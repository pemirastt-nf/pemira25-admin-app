/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fixUtcToWib } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAuth } from "@/lib/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
     const [location, setLocation] = useState("Lobby");
     const [votingDay, setVotingDay] = useState("Hari 1");
     const [submitting, setSubmitting] = useState(false);
     const [voteToDelete, setVoteToDelete] = useState<{ id: string, timestamp: string } | null>(null);

     interface InflationDetail {
          present: number;
          tallied: number;
          attempted: number;
          excess: number;
          remaining: number;
     }

     const [inflationError, setInflationError] = useState<{ message: string; detail?: InflationDetail } | null>(null);

     const { data: candidates } = useQuery({
          queryKey: ['candidates'],
          queryFn: async () => {
               const res = await api.get('/candidates');
               return res.data;
          }
     });

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
          setInflationError(null);

          try {
               await api.post('/votes/offline', {
                    candidateId,
                    count: parseInt(voteCount),
                    location,
                    votingDay
               });
               toast.success(`Berhasil menambahkan ${voteCount} suara`);
               setCandidateId("");
               setVoteCount("1");
               refetchLogs();
          } catch (error: unknown) {
               console.error(error);
               const err = error as { response?: { data?: { message?: string; detail?: InflationDetail } } };
               const msg = err.response?.data?.message || "Gagal menambahkan suara";
               const detail = err.response?.data?.detail;

               if (msg.includes("PENGGELEMBUNGAN") || detail) {
                    setInflationError({
                         message: msg,
                         detail: detail
                    });
                    toast.error("ERROR: PENGGELEMBUNGAN SUARA!", { duration: 5000 });
               } else {
                    toast.error(msg);
               }
          } finally {
               setSubmitting(false);
          }
     };

     const handleDeleteClick = (voteId: string, timestamp: string) => {

          const voteTime = fixUtcToWib(timestamp).getTime();
          const now = new Date().getTime();
          const diffInMinutes = (now - voteTime) / 1000 / 60;

          // 1 Hour timeout (60 minutes)
          if (diffInMinutes > 60) {
               toast.error("Tidak dapat menghapus. Batas waktu 1 jam telah lewat.");
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

                                   <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                             <Label htmlFor="votingDay">Sesi / Hari</Label>
                                             <Input
                                                  id="votingDay"
                                                  value={votingDay}
                                                  onChange={(e) => setVotingDay(e.target.value)}
                                                  placeholder="Cth: Hari 1"
                                             />
                                        </div>
                                        <div className="grid gap-2">
                                             <Label htmlFor="location">Lokasi TPS</Label>
                                             <Input
                                                  id="location"
                                                  value={location}
                                                  onChange={(e) => setLocation(e.target.value)}
                                                  placeholder="Cth: Lobby B"
                                             />
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

                              {inflationError && (
                                   <Alert variant="destructive" className="mt-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 bg-destructive/5 dark:bg-destructive/10 border-destructive/50">
                                        <AlertTitle className="text-lg font-bold flex items-center gap-2 mb-2">
                                             Sistem Memblokir Input
                                        </AlertTitle>
                                        <AlertDescription className="text-destructive">
                                             <p className="font-medium mb-3">
                                                  {inflationError.message}
                                             </p>

                                             {inflationError.detail && (
                                                  <div className="bg-background/60 p-3 rounded-md border border-destructive/20 text-sm space-y-2">
                                                       <div className="flex justify-between items-center">
                                                            <span className="text-muted-foreground">Kehadiran (Check-in):</span>
                                                            <div className="flex items-center gap-2">
                                                                 <Badge variant="outline" className="h-5 px-1">{inflationError.detail.present}</Badge>
                                                                 <span className="text-xs text-muted-foreground">pemilih</span>
                                                            </div>
                                                       </div>
                                                       <div className="flex justify-between items-center">
                                                            <span className="text-muted-foreground">Total Suara Masuk:</span>
                                                            <div className="flex items-center gap-2">
                                                                 <Badge variant="outline" className="h-5 px-1">{inflationError.detail.tallied}</Badge>
                                                                 <span className="text-xs text-muted-foreground">suara</span>
                                                            </div>
                                                       </div>
                                                       <div className="flex justify-between items-center pt-2 border-t border-destructive/20 mt-2">
                                                            <span className="font-semibold text-orange-600 dark:text-orange-400">Sisa Kuota Suara:</span>
                                                            <Badge variant="secondary" className="font-mono bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                                                                 {inflationError.detail.remaining}
                                                            </Badge>
                                                       </div>
                                                  </div>
                                             )}
                                        </AlertDescription>
                                   </Alert>
                              )}
                         </CardContent>
                    </Card>

                    {/* Quick Stats & Guide */}
                    <Card>
                         <CardHeader>
                              <CardTitle>Panduan & Statistik</CardTitle>
                              <CardDescription>
                                   Informasi mengenai proses input suara manual.
                              </CardDescription>
                         </CardHeader>
                         <CardContent className="space-y-4 text-sm text-muted-foreground">
                              <div className="p-4 bg-muted/50 rounded-lg border">
                                   <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        Metode Input
                                   </h4>
                                   <ul className="list-disc list-inside space-y-1 ml-1">
                                        <li>Pilih <strong>kandidat</strong> yang sesuai dengan surat suara.</li>
                                        <li>Masukkan <strong>lokasi TPS</strong> atau keterangan sesi.</li>
                                        <li>Isi <strong>jumlah suara</strong> untuk input sekaligus (bulk).</li>
                                   </ul>
                              </div>

                              <div className="p-4 bg-muted/50 rounded-lg border">
                                   <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                                        Validasi Sistem
                                   </h4>
                                   <p className="mb-2">Sistem akan menolak input jika:</p>
                                   <ul className="list-disc list-inside space-y-1 ml-1">
                                        <li>Jumlah suara melebihi sisa kuota (Check-in - Suara Masuk).</li>
                                        <li>Terdeteksi anomali waktu input yang terlalu cepat.</li>
                                   </ul>
                              </div>
                         </CardContent>
                    </Card>

                    {/* Activity Table */}
                    <Card className="col-span-2">
                         <CardHeader>
                              <CardTitle>Riwayat Aktivitas Suara</CardTitle>
                              <CardDescription>
                                   Daftar lengkap suara masuk secara real-time (Online & Offline).
                              </CardDescription>
                         </CardHeader>
                         <CardContent>
                              <Table>
                                   <TableHeader>
                                        <TableRow>
                                             <TableHead className="w-45">Waktu</TableHead>
                                             <TableHead>Sumber</TableHead>
                                             <TableHead>Kandidat</TableHead>
                                             <TableHead>Detail Lokasi</TableHead>
                                             {user?.role === 'super_admin' && (
                                                  <TableHead className="text-right">Aksi</TableHead>
                                             )}
                                        </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                        {activityLogs?.length === 0 ? (
                                             <TableRow>
                                                  <TableCell colSpan={5} className="h-24 text-center">
                                                       Belum ada data suara masuk.
                                                  </TableCell>
                                             </TableRow>
                                        ) : (
                                             activityLogs?.map((log: any) => (
                                                  <TableRow key={log.id}>
                                                       <TableCell className="font-medium text-muted-foreground">
                                                            <div className="flex flex-col">
                                                                 <span>{fixUtcToWib(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                                                                 <span className="text-xs text-muted-foreground/60">
                                                                      {fixUtcToWib(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ({formatDistanceToNow(fixUtcToWib(log.timestamp), { addSuffix: true, locale: idLocale })})
                                                                 </span>
                                                            </div>
                                                       </TableCell>
                                                       <TableCell>
                                                            <Badge variant={log.source === 'online' ? "default" : "secondary"}>
                                                                 {log.source === 'online' ? "Online" : "Offline"}
                                                            </Badge>
                                                       </TableCell>
                                                       <TableCell>
                                                            <span className="font-medium">{log.candidateName || "Secret"}</span>
                                                       </TableCell>
                                                       <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                 {log.source === 'online' ? (
                                                                      <span className="text-muted-foreground text-xs italic">-</span>
                                                                 ) : (
                                                                      <>
                                                                           {log.votingDay && (
                                                                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                                                                     {log.votingDay}
                                                                                </Badge>
                                                                           )}
                                                                           {log.location && (
                                                                                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">
                                                                                     {log.location}
                                                                                </Badge>
                                                                           )}
                                                                           {!log.votingDay && !log.location && <span className="text-muted-foreground text-xs">-</span>}
                                                                      </>
                                                                 )}
                                                            </div>
                                                       </TableCell>
                                                       {user?.role === 'super_admin' && (
                                                            <TableCell className="text-right">
                                                                 <Button
                                                                      variant="ghost"
                                                                      size="icon"
                                                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                      onClick={() => handleDeleteClick(log.id, log.timestamp)}
                                                                      title="Hapus (Hanya kurang dari 1 jam)"
                                                                 >
                                                                      <Trash2 className="h-4 w-4" />
                                                                 </Button>
                                                            </TableCell>
                                                       )}
                                                  </TableRow>
                                             ))
                                        )}
                                   </TableBody>
                              </Table>
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
          </div >
     );
}
