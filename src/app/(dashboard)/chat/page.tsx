'use client';

import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { api, initSocket } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MessageCircle, Search, User, Clock, Send, Archive, RefreshCw, Smile, Trash2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import EmojiPicker from 'emoji-picker-react';
import { Theme } from 'emoji-picker-react';
import { adminStorage } from '@/lib/storage';
import { useAuth } from '@/lib/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ChatSession {
     id: string;
     studentId: string | null;
     guestName: string | null;
     guestEmail: string | null;
     status: 'open' | 'closed' | 'archived';
     lastMessageAt: string;
     lastMessage?: string;
     student?: {
          name: string;
          email: string;
          nim: string;
     };
     unreadCount?: number; // Optional local state
}

interface Message {
     id: string;
     message: string;
     senderType: 'student' | 'panitia' | 'super_admin' | 'operator_chat' | 'admin' | 'system';
     senderId?: string;
     senderName?: string | null;
     createdAt: string;
}

const senderLabel: Record<string, string> = {
     super_admin: 'Super Admin',
     panitia: 'Panitia',
     operator_chat: 'Humas',
     admin: 'Admin',
     system: 'Sistem',
};

export default function ChatDashboard() {
     const { user: authUser } = useAuth();
     const authUserRef = useRef(authUser);
     useEffect(() => { authUserRef.current = authUser; }, [authUser]);

     const [sessions, setSessions] = useState<ChatSession[]>([]);
     const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
     const [messages, setMessages] = useState<Message[]>([]);
     const [isConnected, setIsConnected] = useState(false);
     const [inputText, setInputText] = useState("");
     const [isLoadingSessions, setIsLoadingSessions] = useState(true);
     const [showEmojiPicker, setShowEmojiPicker] = useState(false);
     const [authError, setAuthError] = useState<string | null>(null);

     const socketRef = useRef<Socket | null>(null);
     const messagesEndRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
          fetchSessions();

          const token = adminStorage.getItem('admin_token');
          
          if (!token) {
               setAuthError('Admin token tidak ditemukan. Silakan login kembali.');
               return;
          }
          setAuthError(null);
     }, []);

     // Fetch Sessions
     const fetchSessions = async () => {
          setIsLoadingSessions(true);
          try {
               const res = await api.get('/chat/sessions');
               setSessions(res.data);
          } catch (error) {
               console.error("Failed to fetch sessions", error);
          } finally {
               setIsLoadingSessions(false);
          }
     };

     useEffect(() => {
          fetchSessions();

          const token = adminStorage.getItem('admin_token');
          
          if (!token) return;

          const newSocket = initSocket(token);

          newSocket.on('connect', () => {
               setIsConnected(true);
               newSocket.emit('join_admin');
          });

          newSocket.on('connect_error', () => {
               setIsConnected(false);
          });

          newSocket.on('disconnect', () => {
               setIsConnected(false);
          });

          // Listen for new sessions
          newSocket.on('new_session', () => {
               // Refresh list or append locally
               fetchSessions(); // Simple refresh for now
          });

          // Listen for session updates (last message)
          newSocket.on('session_update', (data: { sessionId: string, lastMessage: string }) => {
               setSessions(prev => prev.map(s => {
                    if (s.id === data.sessionId) {
                         return { 
                              ...s, 
                              lastMessageAt: new Date().toISOString(),
                              lastMessage: data.lastMessage 
                         };
                    }
                    return s;
               }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));

               // If selected, maybe fetch messages? 
               // Actually if selected, we are in the room, so 'new_message' will handle it.
          });

          // Listen for messages in current room (joined via admin_join_session)
          newSocket.on('new_message', (msg: Message) => {
               const currentUser = authUserRef.current;
               const enriched = (!msg.senderName && msg.senderId && msg.senderId === currentUser?.id)
                    ? { ...msg, senderName: currentUser.name }
                    : msg;
               setMessages(prev => [...prev, enriched]);
          });

          newSocket.on('message_history', (history: Message[]) => {
               const currentUser = authUserRef.current;
               const enriched = history.map(msg =>
                    !msg.senderName && msg.senderId && msg.senderId === currentUser?.id
                         ? { ...msg, senderName: currentUser.name }
                         : msg
               );
               setMessages(enriched);
               scrollToBottom();
          });

          socketRef.current = newSocket;

          return () => {
               newSocket.disconnect();
               socketRef.current = null;
          };
     }, []);

     useEffect(() => {
          scrollToBottom();
     }, [messages]);

     const scrollToBottom = () => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     };

     const handleSelectSession = (sessionId: string) => {
          setSelectedSessionId(sessionId);
          setMessages([]); // Clear previous
          if (socketRef.current) {
               socketRef.current.emit('admin_join_session', sessionId);
               // Also manually request message history
               setTimeout(() => {
                    if (socketRef.current) {
                         socketRef.current.emit('get_message_history', { sessionId });
                    }
               }, 500);
          }
     };

     const handleSendMessage = (e: React.FormEvent) => {
          e.preventDefault();
          if (!inputText.trim() || !selectedSessionId || !socketRef.current) return;
          
          socketRef.current.emit('admin_send_message', {
               sessionId: selectedSessionId,
               message: inputText
          });
          setInputText("");
     };

     const handleArchiveSession = async () => {
          if (!selectedSessionId) return;
          try {
               await api.patch(`/chat/sessions/${selectedSessionId}/status`, { status: 'archived' });
               // Update status locally - this is the source of truth
               setSessions(prev => prev.map(s => 
                    s.id === selectedSessionId 
                         ? { ...s, status: 'archived' as const }
                         : s
               ));
               // Keep the session selected but switch to archived tab
               setActiveTab('archived');
               // Refresh after a delay to ensure backend has updated
               setTimeout(() => fetchSessions(), 1000);
          } catch (error) {
               console.error("Failed to archive session", error);
               // Only refresh on error to get correct state from backend
               fetchSessions();
          }
     };

     const selectedSession = sessions.find(s => s.id === selectedSessionId);

     const [activeTab, setActiveTab] = useState<'open' | 'archived'>('open');
     const [isDeleting, setIsDeleting] = useState(false);
     const [showDeleteDialog, setShowDeleteDialog] = useState(false);
     const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

     const handleDeleteSession = async () => {
          if (!sessionToDelete) return;
          setIsDeleting(true);
          try {
               await api.delete(`/chat/sessions/${sessionToDelete}`);
               setSessions(prev => prev.filter(s => s.id !== sessionToDelete));
               if (selectedSessionId === sessionToDelete) {
                    setSelectedSessionId(null);
                    setMessages([]);
               }
               setSessionToDelete(null);
               setShowDeleteDialog(false);
               // Only refresh after delete to ensure clean state
               setTimeout(() => fetchSessions(), 300);
               toast.success("Sesi chat berhasil dihapus");
          } catch (error) {
               console.error("Failed to delete session", error);
               toast.error("Gagal menghapus sesi chat");
          } finally {
               setIsDeleting(false);
          }
     };

     const showDeleteConfirmation = (sessionId: string) => {
          setSessionToDelete(sessionId);
          setShowDeleteDialog(true);
     };

     const filteredSessions = sessions.filter(s => {
          if (activeTab === 'open') return s.status === 'open';
          return s.status === 'archived' || s.status === 'closed';
     });

     // Clear selected session if it doesn't exist in current tab
     useEffect(() => {
          if (selectedSessionId && !filteredSessions.find(s => s.id === selectedSessionId)) {
               setSelectedSessionId(null);
               setMessages([]);
          }
     }, [activeTab, filteredSessions, selectedSessionId]);

     return (
          <div className="space-y-6">
               <div className="flex items-center justify-between">
                    <div>
                         <h2 className="text-3xl font-bold tracking-tight">Live Chat</h2>
                         <p className="text-muted-foreground text-sm">Berkomunikasi langsung dengan mahasiswa/pemilih secara real-time.</p>
                    </div>
               </div>

               {authError ? (
                    <div className="border rounded-xl bg-card text-card-foreground shadow-sm p-8">
                         <div className="text-center">
                              <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
                                   <h3 className="font-semibold mb-2">Authentication Error</h3>
                                   <p className="text-sm">{authError}</p>
                              </div>
                              <div className="space-y-2">
                                   <Button 
                                        onClick={() => {
                                             adminStorage.clear();
                                             window.location.href = '/login';
                                        }}
                                        className="mr-2"
                                   >
                                        Login Kembali
                                   </Button>
                                   <Button 
                                        onClick={() => window.location.reload()}
                                        variant="outline"
                                        className="mr-2"
                                   >
                                        Refresh Page
                                   </Button>
                                   <Button 
                                        onClick={() => {
                                             const token = prompt('Masukkan admin token (untuk testing):');
                                             if (token) {
                                                  adminStorage.setItem('admin_token', token);
                                                  window.location.reload();
                                             }
                                        }}
                                        variant="outline"
                                        size="sm"
                                   >
                                        Set Token Manual
                                   </Button>
                              </div>
                         </div>
                    </div>
               ) : (
                    <div className="md:grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)] flex flex-col">
                    {/* Sidebar List */}
                    <div className={cn(
                         "md:col-span-1 border rounded-xl bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden h-full",
                         selectedSessionId ? "hidden md:flex" : "flex"
                    )}>
                         <div className="p-4 border-b space-y-3">
                              <h3 className="font-semibold flex justify-between items-center text-sm">
                                   Pesan Masuk
                                   <Button variant="ghost" size="icon" onClick={fetchSessions} className="h-6 w-6"><RefreshCw size={14} /></Button>
                              </h3>

                              {/* Tabs */}
                              <div className="flex p-1 bg-muted rounded-lg">
                                   <button
                                        onClick={() => setActiveTab('open')}
                                        className={cn(
                                             "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                                             activeTab === 'open' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                   >
                                        Aktif ({sessions.filter(s => s.status === 'open').length})
                                   </button>
                                   <button
                                        onClick={() => setActiveTab('archived')}
                                        className={cn(
                                             "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                                             activeTab === 'archived' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                   >
                                        Arsip ({sessions.filter(s => s.status === 'archived' || s.status === 'closed').length})
                                   </button>
                              </div>

                              <div className="relative">
                                   <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                   <Input placeholder="Cari..." className="pl-9 h-9" />
                              </div>
                         </div>
                         <ScrollArea className="flex-1">
                              {isLoadingSessions ? (
                                   <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                                        <RefreshCw className="animate-spin h-5 w-5" />
                                        <span>Memuat...</span>
                                   </div>
                              ) : sessions.length === 0 ? (
                                   <div className="p-8 text-center text-muted-foreground text-sm">Belum ada percakapan</div>
                              ) : (
                                   <div className="flex flex-col">
                                        {filteredSessions.map(session => (
                                             <button
                                                  key={session.id}
                                                  onClick={() => handleSelectSession(session.id)}
                                                  className={cn(
                                                       "flex items-start gap-3 p-4 text-left border-b hover:bg-muted/50 transition-colors w-full",
                                                       selectedSessionId === session.id && "bg-muted border-l-4 border-l-primary"
                                                  )}
                                             >
                                                  <div className="bg-primary/10 p-2 rounded-full shrink-0">
                                                       <User size={18} className="text-primary" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                       <div className="flex justify-between items-start mb-1">
                                                            <div className="flex items-center gap-2 max-w-[70%]">
                                                                 <span className="font-semibold text-sm truncate text-foreground block">
                                                                      {session.student?.name || session.guestName || "Guest"}
                                                                 </span>
                                                                 {session.status === 'archived' && (
                                                                      <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full shrink-0">
                                                                           ARSIP
                                                                      </span>
                                                                 )}
                                                                 {session.status === 'closed' && (
                                                                      <span className="text-[9px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full shrink-0">
                                                                           TUTUP
                                                                      </span>
                                                                 )}
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2 shrink-0">
                                                                 {formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true, locale: id })}
                                                            </span>
                                                       </div>
                                                       <p className={cn(
                                                            "text-xs truncate",
                                                            session.unreadCount ? "font-medium text-foreground" : "text-muted-foreground"
                                                       )}>
                                                            {session.lastMessage || session.student?.nim || session.guestEmail || "Mulai percakapan..."}
                                                       </p>
                                                  </div>
                                             </button>
                                        ))}
                                   </div>
                              )}
                         </ScrollArea>
                    </div>

                    {/* Chat Area */}
                    <div className={cn(
                         "md:col-span-2 border rounded-xl bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden h-full",
                         !selectedSessionId ? "hidden md:flex" : "flex container-chat"
                    )}>
                         {selectedSession ? (
                              <>
                                   {/* Header */}
                                   <div className="h-16 px-4 md:px-6 border-b flex items-center justify-between bg-card text-card-foreground shrink-0">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                             <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  className="md:hidden shrink-0 -ml-2"
                                                  onClick={() => setSelectedSessionId(null)}
                                             >
                                                  <ArrowLeft size={20} />
                                             </Button>
                                             <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0 hidden sm:flex">
                                                  <User size={20} />
                                             </div>
                                             <div className="min-w-0">
                                                  <div className="flex items-center gap-2">
                                                       <h3 className="font-bold text-sm truncate">
                                                            {selectedSession.student?.name || selectedSession.guestName || "Guest"}
                                                       </h3>
                                                       {selectedSession.status === 'archived' && (
                                                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full hidden sm:inline-block">
                                                                 ARSIP
                                                            </span>
                                                       )}
                                                  </div>
                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                                                       <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            <span className="hidden sm:inline">Mulai:</span> {new Date(selectedSession.lastMessageAt).toLocaleDateString("id-ID")}
                                                       </span>
                                                       <span className="hidden sm:inline">•</span>
                                                       <span className="hidden sm:inline truncate">{selectedSession.student?.nim || selectedSession.guestEmail}</span>
                                                  </div>
                                             </div>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                             {activeTab === 'open' ? (
                                                  <Button
                                                       variant="ghost"
                                                       size="icon"
                                                       title="Arsipkan"
                                                       onClick={handleArchiveSession}
                                                  >
                                                       <Archive size={18} className="text-muted-foreground hover:text-orange-500" />
                                                  </Button>
                                             ) : (
                                                  <Button
                                                       variant="ghost"
                                                       size="icon"
                                                       title="Hapus Permanen"
                                                       onClick={() => showDeleteConfirmation(selectedSessionId!)}
                                                       disabled={isDeleting}
                                                  >
                                                       <Trash2 size={18} className="text-muted-foreground hover:text-red-500" />
                                                  </Button>
                                             )}
                                        </div>
                                   </div>

                                   {/* Messages */}
                                   <ScrollArea className="flex-1 p-6 bg-muted/20">
                                        <div className="space-y-4">
                                             {messages.length === 0 ? (
                                                  <div className="flex-1 flex items-center justify-center py-12">
                                                       <div className="text-center text-muted-foreground">
                                                            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                                                            {!isConnected ? (
                                                                 <>
                                                                      <p className="text-sm text-red-600 mb-2">Socket tidak terkoneksi!</p>
                                                                      <p className="text-xs mb-4">Cek console untuk error details</p>
                                                                      <Button 
                                                                           onClick={() => window.location.reload()} 
                                                                           size="sm" 
                                                                           variant="outline"
                                                                      >
                                                                           Refresh Page
                                                                      </Button>
                                                                 </>
                                                            ) : selectedSessionId ? (
                                                                 <>
                                                                      <p className="text-sm">Belum ada pesan</p>
                                                                      <p className="text-xs">Pesan akan muncul di sini</p>
                                                                 </>
                                                            ) : (
                                                                 <p className="text-sm">Pilih session untuk melihat chat</p>
                                                            )}
                                                       </div>
                                                  </div>
                                             ) : (
                                                  messages.map(msg => {
                                                       // Admin side includes: panitia, super_admin, operator_chat, system
                                                       const isAdminSide = msg.senderType !== 'student';

                                                       return (
                                                            <div
                                                                 key={msg.id}
                                                                 className={cn(
                                                                      "flex w-full flex-col",
                                                                      isAdminSide ? "items-end" : "items-start"
                                                                 )}
                                                            >
                                                                 {isAdminSide && (
                                                                      <span className="text-[10px] text-muted-foreground mb-1 px-1">
                                                                           {msg.senderName
                                                                                ? msg.senderName.split(' ')[0]
                                                                                : senderLabel[msg.senderType] ?? msg.senderType}
                                                                      </span>
                                                                 )}
                                                                 <div className={cn(
                                                                      "max-w-[80%] rounded-2xl p-4 text-sm shadow-sm",
                                                                      isAdminSide
                                                                           ? "bg-primary text-primary-foreground rounded-br-none"
                                                                           : "bg-background text-foreground border rounded-bl-none"
                                                                 )}>
                                                                      <p>{msg.message}</p>
                                                                      <span className={cn(
                                                                           "text-[10px] block mt-1 text-right opacity-70",
                                                                           isAdminSide ? "text-primary-foreground/80" : "text-muted-foreground"
                                                                      )}>
                                                                           {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                      </span>
                                                                 </div>
                                                            </div>
                                                       );
                                                  })
                                             )}
                                             <div ref={messagesEndRef} />
                                        </div>
                                   </ScrollArea>

                                   {/* Input */}
                                   {selectedSession?.status === 'open' ? (
                                        <div className="p-4 border-t bg-card relative">
                                             {/* Emoji Picker Popup */}
                                             {showEmojiPicker && (
                                                  <div className="absolute bottom-20 left-4 z-50 shadow-xl rounded-xl overflow-hidden">
                                                       <EmojiPicker
                                                            onEmojiClick={(emojiData) => {
                                                                 setInputText(prev => prev + emojiData.emoji);
                                                                 setShowEmojiPicker(false);
                                                            }}
                                                            width={320}
                                                            height={400}
                                                            theme={Theme.DARK}
                                                       />
                                                  </div>
                                             )}
                                             <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                                                  <Button
                                                       type="button"
                                                       variant="ghost"
                                                       size="icon"
                                                       className="h-11 w-11 rounded-full shrink-0"
                                                       onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                  >
                                                       <Smile size={20} className="text-muted-foreground" />
                                                  </Button>
                                                  <Input
                                                       value={inputText}
                                                       onChange={e => setInputText(e.target.value)}
                                                       placeholder="Ketik balasan..."
                                                       className="h-11 rounded-full bg-muted/50 border-input focus:bg-background transition-all"
                                                       onFocus={() => setShowEmojiPicker(false)}
                                                  />
                                                  <Button type="submit" disabled={!isConnected || !inputText.trim()} className="h-11 w-11 rounded-full shrink-0">
                                                       <Send size={18} />
                                                  </Button>
                                             </form>
                                        </div>
                                   ) : (
                                        <div className="p-4 border-t bg-muted/30 text-center">
                                             <p className="text-sm text-muted-foreground">
                                                  Percakapan ini telah {selectedSession?.status === 'archived' ? 'diarsipkan' : 'ditutup'}
                                             </p>
                                        </div>
                                   )}
                              </>
                         ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                                   <div className="bg-muted p-4 rounded-full mb-4">
                                        <MessageCircle size={48} className="text-muted-foreground/50" />
                                   </div>
                                   <p className="text-lg font-medium">Pilih percakapan untuk memulai</p>
                                   <p className="text-sm text-muted-foreground/80">Pilih salah satu sesi dari daftar di sebelah kiri.</p>
                              </div>
                         )}
                    </div>
               </div>
               )}

               {/* Delete Confirmation Dialog */}
               <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                         <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Sesi Chat Permanen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                   <span className="text-destructive font-bold">PERINGATAN!</span><br />
                                   Tindakan ini akan menghapus sesi chat secara permanen dari database. 
                                   Semua pesan dalam sesi ini akan <strong>HILANG SELAMANYA</strong> dan tidak dapat dipulihkan.
                              </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => {
                                   setSessionToDelete(null);
                                   setShowDeleteDialog(false);
                              }}>
                                   Batal
                              </AlertDialogCancel>
                              <AlertDialogAction
                                   onClick={handleDeleteSession}
                                   className="bg-destructive hover:bg-destructive/90"
                                   disabled={isDeleting}
                              >
                                   {isDeleting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                   ) : null}
                                   Ya, Hapus Permanen
                              </AlertDialogAction>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>
          </div>
     );
}
