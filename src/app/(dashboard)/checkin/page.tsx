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
import { CheckCircle, XCircle, Search, Undo2, Download, UserCheck, UserX, Clock, Percent, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function CheckInPage() {
     const api = useApi();
     const queryClient = useQueryClient();
     const [searchQuery, setSearchQuery] = useState("");
     const [isDownloading, setIsDownloading] = useState(false);
     
     // Date Filter State
     const [date, setDate] = useState<DateRange | undefined>({
          from: new Date(),
          to: new Date(),
     });

     const { data: stats } = useQuery({
          queryKey: ['checkin-stats', date],
          queryFn: async () => {
               const params = new URLSearchParams();
               if (date?.from) params.append('startDate', date.from.toISOString());
               if (date?.to) params.append('endDate', date.to.toISOString());
               
               const res = await api.get(`/votes/checkin-stats?${params.toString()}`);
               return res.data;
          },
          refetchInterval: 5000
     });

     const { data: students, isLoading } = useQuery({
          queryKey: ['checkin-students', searchQuery],
          queryFn: async () => {
               const res = await api.get(`/students?search=${searchQuery}&accessType=offline&includeAllRoles=true`);
               return res.data.data || [];
          },
          enabled: true
     });

     const handleDownloadReport = async () => {
          try {
               setIsDownloading(true);
               const res = await api.get('/students?accessType=offline&includeAllRoles=true&limit=10000');
               const allOfflineStudents = res.data.data || [];

               const checkedInStudents = allOfflineStudents.filter((s: any) => 
                    s.hasVoted && s.voteMethod === 'offline' && s.checkedInAt
               );

               if (checkedInStudents.length === 0) {
                    toast.error("Belum ada data mahasiswa yang melakukan check-in.");
                    setIsDownloading(false);
                    return;
               }

               const data = checkedInStudents.map((s: any, index: number) => ({
                    "No": index + 1,
                    "NIM": s.nim,
                    "Nama": s.name,
                    "Angkatan": s.batch || "-",
                    "Waktu Check-in": s.checkedInAt ? new Date(s.checkedInAt).toLocaleString('id-ID') : "-",
                    "Petugas Check-in": s.checkedInByName || s.checkedInBy || "-"
               }));

               const worksheet = XLSX.utils.json_to_sheet(data);
               const workbook = XLSX.utils.book_new();
               XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Check-in");

               XLSX.writeFile(workbook, `Laporan_Checkin_PEMIRA_${new Date().toISOString().split('T')[0]}.csv`);
               
               toast.success("Laporan berhasil diunduh");
          } catch (error) {
               console.error("Download error:", error);
               toast.error("Gagal mengunduh laporan.");
          } finally {
               setIsDownloading(false);
          }
     };

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
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                         <h2 className="text-3xl font-bold tracking-tight">Check-in Mahasiswa</h2>
                         <p className="text-muted-foreground text-sm">Tandai kehadiran mahasiswa untuk voting offline.</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <Popover>
                              <PopoverTrigger asChild>
                                   <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                             "w-65 justify-start text-left font-normal",
                                             !date && "text-muted-foreground"
                                        )}
                                   >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                             date.to ? (
                                                  <>
                                                       {format(date.from, "LLL dd, y")} -{" "}
                                                       {format(date.to, "LLL dd, y")}
                                                  </>
                                             ) : (
                                                  format(date.from, "LLL dd, y")
                                             )
                                        ) : (
                                             <span>Filter Tanggal</span>
                                        )}
                                   </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                   <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                   />
                              </PopoverContent>
                         </Popover>
                         <Button variant="outline" onClick={handleDownloadReport} disabled={isDownloading}>
                              <Download className="mr-2 h-4 w-4" />
                              {isDownloading ? "..." : "Laporan"}
                         </Button>
                    </div>
               </div>

               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard 
                         title="Total Check-in" 
                         value={stats?.totalCheckedIn ?? 0}
                         icon={UserCheck}
                         description="Mahasiswa (Offline)"
                    />
                    <StatsCard 
                         title="Check-in Hari Ini" 
                         value={stats?.todayCheckedIn ?? 0}
                         icon={Clock}
                         description="Mahasiswa"
                    />
                    <StatsCard 
                         title="Belum Memilih" 
                         value={stats?.remainingVoters ?? 0}
                         icon={UserX}
                         description="Mahasiswa (Total)"
                    />
                    <StatsCard 
                         title="Partisipasi Total" 
                         value={`${Number(stats?.completionRate ?? 0).toFixed(1)}%`}
                         icon={Percent}
                         description="DPT (Online + Offline)"
                    />
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
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
