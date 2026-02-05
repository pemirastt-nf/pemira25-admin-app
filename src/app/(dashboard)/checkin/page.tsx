/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Search, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CheckInPage() {
     const api = useApi();
     const queryClient = useQueryClient();
     const [searchQuery, setSearchQuery] = useState("");

     const { data: students, isLoading } = useQuery({
          queryKey: ['checkin-students', searchQuery],
          queryFn: async () => {
               const res = await api.get(`/students?search=${searchQuery}&accessType=offline&includeAllRoles=true`);
               return res.data.data || [];
          },
          enabled: true
     });

     const handleCheckIn = async (nim: string) => {
          toast.promise(
               async () => {
                    await api.post('/votes/checkin', { nim });
                    queryClient.invalidateQueries({ queryKey: ['checkin-students'] });
               },
               {
                    loading: 'Memproses check-in...',
                    success: 'Check-in berhasil!',
                    error: (err) => err.response?.data?.message || 'Gagal check-in'
               }
          );
     };

     const handleUnCheckIn = async (nim: string) => {
          toast.promise(
               async () => {
                    await api.post('/votes/uncheckin', { nim });
                    queryClient.invalidateQueries({ queryKey: ['checkin-students'] });
               },
               {
                    loading: 'Membatalkan check-in...',
                    success: 'Undo check-in berhasil!',
                    error: (err) => err.response?.data?.message || 'Gagal undo check-in'
               }
          );
     };

     const getStatusBadge = (student: any) => {
          if (!student.hasVoted) {
               return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Belum Voting</Badge>;
          }
          if (student.voteMethod === 'online') {
               return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Sudah Voting (Online)</Badge>;
          }
          return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Sudah Check-in (Offline)</Badge>;
     };

     return (
          <div className="space-y-6">
               <div>
                    <h2 className="text-3xl font-bold tracking-tight">Check-in Mahasiswa</h2>
                    <p className="text-muted-foreground text-sm">Tandai kehadiran mahasiswa untuk voting offline.</p>
               </div>

               <div className="flex gap-2 max-w-md">
                    <Input
                         placeholder="Cari NIM atau Nama..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button variant="outline" size="icon">
                         <Search className="h-4 w-4" />
                    </Button>
               </div>

               <div className="border rounded-lg bg-card">
                    <Table>
                         <TableHeader>
                              <TableRow>
                                   <TableHead>NIM</TableHead>
                                   <TableHead>Nama</TableHead>
                                   <TableHead>Angkatan</TableHead>
                                   <TableHead>Status</TableHead>
                                   <TableHead className="text-right">Aksi</TableHead>
                              </TableRow>
                         </TableHeader>
                         <TableBody>
                              {isLoading ? (
                                   Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                             <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                             <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                             <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                             <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                        </TableRow>
                                   ))
                              ) : students?.length === 0 ? (
                                   <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                             {searchQuery ? "Tidak ditemukan mahasiswa dengan kata kunci tersebut." : "Belum ada data mahasiswa offline."}
                                        </TableCell>
                                   </TableRow>
                              ) : (
                                   students?.map((student: any) => (
                                        <TableRow key={student.id}>
                                             <TableCell className="font-mono">{student.nim}</TableCell>
                                             <TableCell className="font-medium">{student.name}</TableCell>
                                             <TableCell>{student.batch || '-'}</TableCell>
                                             <TableCell>{getStatusBadge(student)}</TableCell>
                                             <TableCell className="text-right">
                                                  {!student.hasVoted ? (
                                                       <Button size="sm" onClick={() => handleCheckIn(student.nim)}>
                                                            <CheckCircle className="mr-2 h-4 w-4" /> Check-in
                                                       </Button>
                                                  ) : student.voteMethod === 'offline' ? (
                                                       <Button size="sm" variant="outline" onClick={() => handleUnCheckIn(student.nim)}>
                                                            <Undo2 className="mr-2 h-4 w-4" /> Undo
                                                       </Button>
                                                  ) : (
                                                       <Button size="sm" variant="ghost" disabled>
                                                            <XCircle className="mr-2 h-4 w-4" /> Sudah Online
                                                       </Button>
                                                  )}
                                             </TableCell>
                                        </TableRow>
                                   ))
                              )}
                         </TableBody>
                    </Table>
               </div>
          </div>
     );
}
