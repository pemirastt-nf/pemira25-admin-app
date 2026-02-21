/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef } from "react";
import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { Plus, Mail, Clock, CheckCircle, XCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define Broadcast Type
interface Broadcast {
     id: string;
     subject: string;
     status: 'draft' | 'processing' | 'completed' | 'failed';
     stats: { total: number; sent: number; failed: number };
     createdAt: string;
     updatedAt: string;
}

export default function BroadcastListPage() {
     const api = useApi();
     const router = useRouter();
     const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
     const [isLoading, setIsLoading] = useState(true);
     const [deleteId, setDeleteId] = useState<string | null>(null);
     const pollRef = useRef<NodeJS.Timeout | null>(null);

     const fetchBroadcasts = async () => {
          try {
               const res = await api.get("/broadcast");
               setBroadcasts(res.data);
          } catch (error) {
               console.error(error);
               toast.error("Gagal memuat riwayat broadcast");
          } finally {
               setIsLoading(false);
          }
     };

     useEffect(() => {
          fetchBroadcasts();
     }, []);

     useEffect(() => {
          const hasProcessing = broadcasts.some(b => b.status === 'processing');
          if (hasProcessing && !pollRef.current) {
               pollRef.current = setInterval(fetchBroadcasts, 5000);
          }
          if (!hasProcessing && pollRef.current) {
               clearInterval(pollRef.current);
               pollRef.current = null;
          }
          return () => {
               if (pollRef.current) {
                    clearInterval(pollRef.current);
                    pollRef.current = null;
               }
          };
     }, [broadcasts]);

     const handleDelete = async () => {
          if (!deleteId) return;
          try {
               await api.delete(`/broadcast/${deleteId}`);
               toast.success("Broadcast berhasil dihapus");
               fetchBroadcasts();
          } catch (error) {
               console.error(error);
               toast.error("Gagal menghapus broadcast");
          } finally {
               setDeleteId(null);
          }
     };

     const getStatusBadge = (status: string) => {
          switch (status) {
               case 'draft': return <Badge variant="secondary"><Edit className="w-3 h-3 mr-1" /> Draft</Badge>;
               case 'processing': return <Badge className="bg-blue-500 hover:bg-blue-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Diproses</Badge>;
               case 'completed': return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Selesai</Badge>;
               case 'failed': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Gagal</Badge>;
               default: return <Badge>{status}</Badge>;
          }
     };

     const getProgress = (stats: Broadcast['stats']) => {
          if (!stats || stats.total === 0) return 0;
          return Math.round(((stats.sent + stats.failed) / stats.total) * 100);
     };

     const getEstimatedTime = (stats: Broadcast['stats']) => {
          if (!stats || stats.total === 0) return null;
          const remaining = stats.total - stats.sent - stats.failed;
          if (remaining <= 0) return null;
          const seconds = remaining * 10;
          if (seconds < 60) return `~${seconds}d lagi`;
          const minutes = Math.ceil(seconds / 60);
          return `~${minutes} menit lagi`;
     };

     return (
          <div className="space-y-6">
               <div className="flex justify-between items-center">
                    <div>
                         <h2 className="text-3xl font-bold tracking-tight">Broadcast Email</h2>
                         <p className="text-muted-foreground text-sm">Kelola pengumuman dan notifikasi email massal.</p>
                    </div>
                    <Button onClick={() => router.push('/broadcast/new')}>
                         <Plus className="w-4 h-4 mr-2" />
                         Buat Email Baru
                    </Button>
               </div>

               <div className="grid gap-4">
                    {isLoading ? (
                         [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
                    ) : broadcasts.length === 0 ? (
                         <Card className="text-center py-12">
                              <CardContent>
                                   <div className="flex justify-center mb-4">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                             <Mail className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                   </div>
                                   <h3 className="text-lg font-medium">Belum ada broadcast</h3>
                                   <p className="text-sm text-muted-foreground mb-4">
                                        Mulai buat broadcast pertamamu sekarang.
                                   </p>
                                   <Button variant="outline" onClick={() => router.push('/broadcast/new')}>
                                        Buat Sekarang
                                   </Button>
                              </CardContent>
                         </Card>
                    ) : (
                         broadcasts.map((item) => (
                              <Card key={item.id} className="hover:shadow-md transition-shadow group">
                                   <CardContent className="p-6 flex flex-col gap-3">
                                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                             <div className="space-y-1 flex-1 cursor-pointer" onClick={() => router.push(`/broadcast/${item.id}`)}>
                                                  <div className="flex items-center gap-2">
                                                       <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                                                            {item.subject}
                                                       </h3>
                                                       {getStatusBadge(item.status)}
                                                  </div>

                                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                       <span>
                                                            {format(new Date(item.updatedAt || item.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                                                       </span>
                                                       {item.status !== 'draft' && (
                                                            <span className="flex items-center gap-1">
                                                                 <CheckCircle className="w-3 h-3 text-green-500" />
                                                                 {item.stats?.sent || 0} / {item.stats?.total || 0} Terkirim
                                                            </span>
                                                       )}
                                                       {item.status === 'processing' && getEstimatedTime(item.stats) && (
                                                            <span className="flex items-center gap-1 text-blue-500">
                                                                 <Clock className="w-3 h-3" />
                                                                 {getEstimatedTime(item.stats)}
                                                            </span>
                                                       )}
                                                  </div>
                                             </div>

                                             <div className="flex items-center gap-2">
                                                  <Button
                                                       variant="secondary"
                                                       size="sm"
                                                       onClick={() => router.push(`/broadcast/${item.id}`)}
                                                  >
                                                       {item.status === 'draft' ? 'Edit' : 'Lihat Detail'}
                                                  </Button>
                                                  {item.status === 'draft' && (
                                                       <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-destructive"
                                                            onClick={() => setDeleteId(item.id)}
                                                       >
                                                            <Trash2 className="w-4 h-4" />
                                                       </Button>
                                                  )}
                                             </div>
                                        </div>

                                        {item.status === 'processing' && (
                                             <div className="space-y-1">
                                                  <Progress value={getProgress(item.stats)} className="h-2" />
                                                  <p className="text-xs text-muted-foreground">
                                                       {getProgress(item.stats)}% — {item.stats?.sent || 0} terkirim, {item.stats?.failed || 0} gagal dari {item.stats?.total || 0} total
                                                  </p>
                                             </div>
                                        )}
                                   </CardContent>
                              </Card>
                         ))
                    )}
               </div>

               <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogContent>
                         <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Draft Broadcast?</AlertDialogTitle>
                              <AlertDialogDescription>
                                   Tindakan ini tidak dapat dibatalkan. Draft ini akan dihapus permanen.
                              </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                   Hapus
                              </AlertDialogAction>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>
          </div>
     );
}

