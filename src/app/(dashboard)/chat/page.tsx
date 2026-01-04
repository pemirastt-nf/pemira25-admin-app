'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MessageCircle, Search, User, Clock, Send, Archive, MoreVertical, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface ChatSession {
     id: string;
     studentId: string | null;
     guestName: string | null;
     guestEmail: string | null;
     status: 'open' | 'closed' | 'archived';
     lastMessageAt: string;
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
     senderType: 'student' | 'admin' | 'system';
     senderId?: string;
     createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ChatDashboard() {
     const [sessions, setSessions] = useState<ChatSession[]>([]);
     const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
     const [messages, setMessages] = useState<Message[]>([]);
     const [isConnected, setIsConnected] = useState(false);
     const [inputText, setInputText] = useState("");
     const [isLoadingSessions, setIsLoadingSessions] = useState(true);

     const socketRef = useRef<Socket | null>(null);
     const messagesEndRef = useRef<HTMLDivElement>(null);

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

          const token = localStorage.getItem('admin_token');
          if (!token) return;

          const newSocket = io(API_URL, {
               auth: { token },
               withCredentials: true
          });

          newSocket.on('connect', () => {
               console.log("Admin Socket Connected");
               setIsConnected(true);
               newSocket.emit('join_admin');
          });

          newSocket.on('disconnect', () => setIsConnected(false));

          // Listen for new sessions
          newSocket.on('new_session', () => {
               // Refresh list or append locally
               fetchSessions(); // Simple refresh for now
          });

          // Listen for session updates (last message)
          newSocket.on('session_update', (data: { sessionId: string, lastMessage: string }) => {
               setSessions(prev => prev.map(s => {
                    if (s.id === data.sessionId) {
                         return { ...s, lastMessageAt: new Date().toISOString() };
                    }
                    return s;
               }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));

               // If selected, maybe fetch messages? 
               // Actually if selected, we are in the room, so 'new_message' will handle it.
          });

          // Listen for messages in current room (joined via admin_join_session)
          newSocket.on('new_message', (msg: Message) => {
               setMessages(prev => [...prev, msg]);
          });

          newSocket.on('message_history', (history: Message[]) => {
               setMessages(history);
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
               setSessions(prev => prev.filter(s => s.id !== selectedSessionId));
               setSelectedSessionId(null);
               setMessages([]);
          } catch (error) {
               console.error("Failed to archive session", error);
          }
     };

     const selectedSession = sessions.find(s => s.id === selectedSessionId);

     return (
          <div className="space-y-6">
               <div className="flex items-center justify-between">
                    <div>
                         <h2 className="text-3xl font-bold tracking-tight">Live Chat</h2>
                         <p className="text-muted-foreground text-sm">Berkomunikasi langsung dengan mahasiswa/pemilih secara real-time.</p>
                    </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                    {/* Sidebar List */}
                    <div className="md:col-span-1 border rounded-xl bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden">
                         <div className="p-4 border-b">
                              <h3 className="font-semibold mb-3 flex justify-between items-center text-sm">
                                   Pesan Masuk
                                   <Button variant="ghost" size="icon" onClick={fetchSessions} className="h-6 w-6"><RefreshCw size={14} /></Button>
                              </h3>
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
                                        {sessions.map(session => (
                                             <button
                                                  key={session.id}
                                                  onClick={() => handleSelectSession(session.id)}
                                                  className={cn(
                                                       "flex items-start gap-3 p-4 text-left border-b hover:bg-muted/50 transition-colors",
                                                       selectedSessionId === session.id && "bg-muted border-l-4 border-l-primary"
                                                  )}
                                             >
                                                  <div className="bg-primary/10 p-2 rounded-full shrink-0">
                                                       <User size={18} className="text-primary" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                       <div className="flex justify-between items-start mb-1">
                                                            <span className="font-semibold text-sm truncate text-foreground">
                                                                 {session.student?.name || session.guestName || "Guest"}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                                 {formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true, locale: id })}
                                                            </span>
                                                       </div>
                                                       <p className="text-xs text-muted-foreground truncate">
                                                            {session.student?.nim || session.guestEmail || "No Info"}
                                                       </p>
                                                  </div>
                                             </button>
                                        ))}
                                   </div>
                              )}
                         </ScrollArea>
                    </div>

                    {/* Chat Area */}
                    <div className="md:col-span-2 border rounded-xl bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden">
                         {selectedSession ? (
                              <>
                                   {/* Header */}
                                   <div className="h-16 px-6 border-b flex items-center justify-between bg-card text-card-foreground">
                                        <div className="flex items-center gap-3">
                                             <div className="bg-primary/10 p-2 rounded-full text-primary">
                                                  <User size={20} />
                                             </div>
                                             <div>
                                                  <h3 className="font-bold text-sm">
                                                       {selectedSession.student?.name || selectedSession.guestName || "Guest"}
                                                  </h3>
                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                       <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            Mulai: {new Date(selectedSession.lastMessageAt).toLocaleDateString("id-ID")}
                                                       </span>
                                                       <span>•</span>
                                                       <span>{selectedSession.student?.nim || selectedSession.guestEmail}</span>
                                                  </div>
                                             </div>
                                        </div>
                                        <div className="flex gap-1">
                                             <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  title="Arsipkan"
                                                  onClick={handleArchiveSession}
                                             >
                                                  <Archive size={18} className="text-muted-foreground" />
                                             </Button>
                                        </div>
                                   </div>

                                   {/* Messages */}
                                   <ScrollArea className="flex-1 p-6 bg-muted/20">
                                        <div className="space-y-4">
                                             {messages.map(msg => (
                                                  <div
                                                       key={msg.id}
                                                       className={cn(
                                                            "flex w-full",
                                                            msg.senderType === 'admin' ? "justify-end" : "justify-start"
                                                       )}
                                                  >
                                                       <div className={cn(
                                                            "max-w-[80%] rounded-2xl p-4 text-sm shadow-sm",
                                                            msg.senderType === 'admin'
                                                                 ? "bg-primary text-primary-foreground rounded-br-none"
                                                                 : "bg-background text-foreground border rounded-bl-none"
                                                       )}>
                                                            <p>{msg.message}</p>
                                                            <span className={cn(
                                                                 "text-[10px] block mt-1 text-right opacity-70",
                                                                 msg.senderType === 'admin' ? "text-primary-foreground/80" : "text-muted-foreground"
                                                            )}>
                                                                 {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                       </div>
                                                  </div>
                                             ))}
                                             <div ref={messagesEndRef} />
                                        </div>
                                   </ScrollArea>

                                   {/* Input */}
                                   <div className="p-4 border-t bg-card">
                                        <form onSubmit={handleSendMessage} className="flex gap-3">
                                             <Input
                                                  value={inputText}
                                                  onChange={e => setInputText(e.target.value)}
                                                  placeholder="Ketik balasan..."
                                                  className="h-11 rounded-full bg-muted/50 border-input focus:bg-background transition-all"
                                             />
                                             <Button type="submit" disabled={!isConnected || !inputText.trim()} className="h-11 w-11 rounded-full shrink-0">
                                                  <Send size={18} />
                                             </Button>
                                        </form>
                                   </div>
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
          </div>
     );
}
