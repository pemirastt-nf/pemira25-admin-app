/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fixUtcToWib } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAuth } from "@/lib/auth-context";
import {
     Dialog,
     DialogContent,
     DialogDescription,
     DialogFooter,
     DialogHeader,
     DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

export default function VotesPage() {
     const api = useApi();
     const { user } = useAuth();
     const [candidateId, setCandidateId] = useState("");
     const [voteCount, setVoteCount] = useState("1");
     const [submitting, setSubmitting] = useState(false);
     const [voteToDelete, setVoteToDelete] = useState<{ id: string, timestamp: string } | null>(null);

     // Fetch Candidates
     const { data: candidates } = useQuery({
          queryKey: ['candidates'],
          queryFn: async () => {
               const res = await api.get('/candidates');
               return res.data;
          }
     });

     // Fetch Activity Log
     const { data: activityLogs, refetch: refetchLogs } = useQuery({
          queryKey: ['vote-activity'],
          queryFn: async () => {
               const res = await api.get('/votes/activity');
               return res.data;
          },
          refetchInterval: 5000
     });

     const handleManualVote = async (e: React.FormEvent) => {
          e.preventDefault();
          setSubmitting(true);

          try {
               await api.post('/votes/offline', { candidateId, count: parseInt(voteCount) });
               toast.success(`Berhasil menambahkan ${voteCount} suara`);
               setCandidateId("");
               setVoteCount("1");
               refetchLogs();
          } catch (error: any) {
               console.error(error);
               toast.error("Gagal menambahkan suara");
          } finally {
               setSubmitting(false);
          }
     };

     const handleDeleteClick = (voteId: string, timestamp: string) => {

          const voteTime = fixUtcToWib(timestamp).getTime();
          const now = new Date().getTime();
          const diffInMinutes = (now - voteTime) / 1000 / 60;

          if (diffInMinutes > 1) {
               toast.error("Tidak dapat menghapus. Batas waktu 1 menit telah lewat.");
               return;
          }

          setVoteToDelete({ id: voteId, timestamp });
     };

     const confirmDelete = async () => {
          if (!voteToDelete) return;

          try {
               await api.delete(`/votes/${voteToDelete.id}`);
               toast.success("Data suara berhasil dihapus");
               refetchLogs();
          } catch (error) {
               console.error(error);
               toast.error("Gagal menghapus (Mungkin batas waktu sudah lewat)");
          } finally {
               setVoteToDelete(null);
          }
     };

     return (
          <div className="space-y-6">
               <div>
                    <h2 className="text-3xl font-bold tracking-tight">Manajemen Suara</h2>
                    <p className="text-muted-foreground text-sm">Monitor perolehan suara dan input suara manual (offline).</p>
               </div>

               <div className="grid gap-6 md:grid-cols-2">
                    {/* Input Form */}
                    <Card>
                         <CardHeader>
                              <CardTitle>Input Suara Manual</CardTitle>
                              <CardDescription>
                                   Masukkan suara dari kertas pemungutan suara (Offline).
                              </CardDescription>
                         </CardHeader>
                         <CardContent>
                              <form onSubmit={handleManualVote} className="space-y-4">
                                   <div className="grid gap-2">
                                        <Label>Pilih Kandidat untuk Ditambahkan</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                             {candidates?.map((c: any) => (
                                                  <div key={c.id} className="relative">
                                                       <input
                                                            type="radio"
                                                            id={c.id}
                                                            name="candidate"
                                                            value={c.id}
                                                            className="peer sr-only"
                                                            checked={candidateId === c.id}
                                                            onChange={(e) => setCandidateId(e.target.value)}
                                                            required
                                                       />
                                                       <Label
                                                            htmlFor={c.id}
                                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-checked:border-primary peer-checked:bg-accent peer-checked:text-accent-foreground cursor-pointer transition-all"
                                                       >
                                                            <span className="text-xl font-bold mb-2 text-primary">#{c.orderNumber}</span>
                                                            <span className="text-sm font-medium text-center">{c.name}</span>
                                                       </Label>
                                                  </div>
                                             ))}
                                        </div>
                                   </div>

                                   <div className="grid gap-2">
                                        <Label htmlFor="voteCount">Jumlah Suara</Label>
                                        <Input
                                             id="voteCount"
                                             type="number"
                                             min="1"
                                             placeholder="Masukkan jumlah suara (misal: 10)"
                                             value={voteCount}
                                             onChange={(e) => setVoteCount(e.target.value)}
                                             required
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                             Masukkan angka total untuk input sekaligus (Bulk Insert).
                                        </p>
                                   </div>

                                   <Button type="submit" className="w-full" disabled={submitting || !candidateId || !voteCount}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Tambah Suara
                                   </Button>
                              </form>
                         </CardContent>
                    </Card>

                    {/* Recent Activity Log */}
                    <Card>
                         <CardHeader>
                              <CardTitle>Riwayat Input (Live)</CardTitle>
                              <CardDescription>
                                   Daftar suara masuk terbaru (Online & Offline).
                              </CardDescription>
                         </CardHeader>
                         <CardContent>
                              <div className="space-y-4">
                                   {activityLogs?.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                                             <p>Belum ada data suara masuk.</p>
                                        </div>
                                   ) : (
                                        <div className="space-y-2">
                                             {activityLogs?.map((log: any) => (
                                                  <div key={log.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                                       <div>
                                                            <div className="font-medium text-sm flex items-center">
                                                                 Suara Masuk
                                                                 {/* Source Badge */}
                                                                 <Badge variant={log.source === 'online' ? "default" : "secondary"} className="ml-2 text-[10px] h-5 px-1.5">
                                                                      {log.source === 'online' ? "Online" : "Offline"}
                                                                 </Badge>
                                                                 {/* Only show candidate name to admin? Logic says yes. */}
                                                                 <span className="text-muted-foreground font-normal ml-1"> -&gt; {log.candidateName || "Secret"}</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">

                                                                 {formatDistanceToNow(fixUtcToWib(log.timestamp), { addSuffix: true, locale: idLocale })}
                                                            </p>
                                                       </div>
                                                       {user?.role === 'super_admin' && (
                                                            <Button
                                                                 variant="ghost"
                                                                 size="icon"
                                                                 className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                 onClick={() => handleDeleteClick(log.id, log.timestamp)}
                                                                 title="Hapus (Hanya kurang dari 1 menit)"
                                                            >
                                                                 <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                       )}
                                                  </div>
                                             ))}
                                        </div>
                                   )}
                              </div>
                         </CardContent>
                    </Card>
               </div>


               <Dialog open={!!voteToDelete} onOpenChange={(open) => !open && setVoteToDelete(null)}>
                    <DialogContent>
                         <DialogHeader>
                              <DialogTitle>Konfirmasi Hapus Suara</DialogTitle>
                              <DialogDescription>
                                   Apakah Anda yakin ingin menghapus suara ini? Tindakan ini tidak dapat dibatalkan.
                                   Hanya data yang berusia kurang dari 1 menit yang dapat dihapus.
                              </DialogDescription>
                         </DialogHeader>
                         <DialogFooter>
                              <Button variant="outline" onClick={() => setVoteToDelete(null)}>
                                   Batal
                              </Button>
                              <Button variant="destructive" onClick={confirmDelete}>
                                   Hapus Permanen
                              </Button>
                         </DialogFooter>
                    </DialogContent>
               </Dialog>
          </div>
     );
}
