/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useRef, useCallback, memo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Search, Undo2, Download, UserCheck, UserX, Clock, Percent, Calendar as CalendarIcon, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";



interface BatchRow {
     batch: string;
     totalOffline: number;
     checkedIn: number;
     totalOnline: number;
     votedOnline: number;
}
interface DateRow { date: string; offline: number; online: number; total: number; }

interface RekapSectionProps {
     batchSummary: BatchRow[];
     dateSummary: DateRow[];
     isLoading: boolean;
}

const RekapSection = memo(function RekapSection({ batchSummary, dateSummary, isLoading }: RekapSectionProps) {
     return (
          <Tabs defaultValue="angkatan">
               <TabsList>
                    <TabsTrigger value="angkatan">Rekap per Angkatan</TabsTrigger>
                    <TabsTrigger value="tanggal">Rekap per Tanggal</TabsTrigger>
               </TabsList>
               <TabsContent value="angkatan">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 px-1">
                         <Info className="h-3.5 w-3.5 shrink-0" />
                         <span>Kolom <strong>DPT</strong> menampilkan total seluruh mahasiswa. Kolom <strong>Check-in / Voting</strong> difilter berdasarkan rentang tanggal di atas.</span>
                    </div>
                    <div className="border rounded-lg bg-card">
                         <Table>
                              <TableHeader>
                                   <TableRow>
                                        <TableHead>Angkatan</TableHead>
                                        <TableHead className="text-right">DPT Offline</TableHead>
                                        <TableHead className="text-right">Check-in (Offline)</TableHead>
                                        <TableHead className="text-right">DPT Online</TableHead>
                                        <TableHead className="text-right">Voting (Online)</TableHead>
                                        <TableHead className="text-right">Total Partisipasi</TableHead>
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {isLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                             <TableRow key={i}>
                                                  {Array.from({ length: 6 }).map((_, j) => (
                                                       <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                                                  ))}
                                             </TableRow>
                                        ))
                                   ) : batchSummary.length === 0 ? (
                                        <TableRow>
                                             <TableCell colSpan={6} className="text-center text-muted-foreground py-6">Belum ada data.</TableCell>
                                        </TableRow>
                                   ) : (
                                        batchSummary.map((row) => {
                                             const dpt = row.totalOffline + row.totalOnline;
                                             const partisipasi = row.checkedIn + row.votedOnline;
                                             const pct = dpt > 0 ? ((partisipasi / dpt) * 100).toFixed(1) : "0.0";
                                             return (
                                                  <TableRow key={row.batch}>
                                                       <TableCell className="font-medium">{row.batch}</TableCell>
                                                       <TableCell className="text-right">{row.totalOffline}</TableCell>
                                                       <TableCell className="text-right">{row.checkedIn}</TableCell>
                                                       <TableCell className="text-right">{row.totalOnline}</TableCell>
                                                       <TableCell className="text-right">{row.votedOnline}</TableCell>
                                                       <TableCell className="text-right">
                                                            <Badge variant="outline" className={cn(
                                                                 Number(pct) >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                                                      Number(pct) >= 50 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                                           "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                            )}>{partisipasi} ({pct}%)</Badge>
                                                       </TableCell>
                                                  </TableRow>
                                             );
                                        })
                                   )}
                              </TableBody>
                         </Table>
                    </div>
               </TabsContent>
               <TabsContent value="tanggal">
                    <div className="border rounded-lg bg-card">
                         <Table>
                              <TableHeader>
                                   <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="text-right">Offline (Check-in)</TableHead>
                                        <TableHead className="text-right">Online (Voting)</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {isLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                             <TableRow key={i}>
                                                  {Array.from({ length: 4 }).map((_, j) => (
                                                       <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                                                  ))}
                                             </TableRow>
                                        ))
                                   ) : dateSummary.length === 0 ? (
                                        <TableRow>
                                             <TableCell colSpan={4} className="text-center text-muted-foreground py-6">Belum ada data dalam rentang tanggal ini.</TableCell>
                                        </TableRow>
                                   ) : (
                                        dateSummary.map((row) => (
                                             <TableRow key={row.date}>
                                                  <TableCell className="font-medium">{row.date}</TableCell>
                                                  <TableCell className="text-right">{row.offline}</TableCell>
                                                  <TableCell className="text-right">{row.online}</TableCell>
                                                  <TableCell className="text-right font-semibold">{row.total}</TableCell>
                                             </TableRow>
                                        ))
                                   )}
                              </TableBody>
                         </Table>
                    </div>
               </TabsContent>
          </Tabs>
     );
});

export default function CheckInPage() {
     const api = useApi();
     const queryClient = useQueryClient();
     const [debouncedSearch, setDebouncedSearch] = useState("");
     const [isDownloading, setIsDownloading] = useState(false);
     const [pendingNims, setPendingNims] = useState<Set<string>>(new Set());
     const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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
          queryKey: ['checkin-students', debouncedSearch],
          queryFn: async () => {
               const res = await api.get(`/students?search=${debouncedSearch}&accessType=offline&includeAllRoles=true&limit=50`);
               return res.data.data || [];
          },
     });

     const { data: dptOfflineStudents, isLoading: isLoadingDpt } = useQuery({
          queryKey: ['dpt-offline-full'],
          queryFn: async () => {
               const res = await api.get('/students?accessType=offline&includeAllRoles=true&limit=10000');
               return res.data.data || [];
          },
          staleTime: 60000,
     });

     const { data: onlineStudents, isLoading: isLoadingOnline } = useQuery({
          queryKey: ['online-students'],
          queryFn: async () => {
               const res = await api.get('/students?accessType=online&includeAllRoles=true&limit=10000');
               return res.data.data || [];
          },
          refetchInterval: 10000
     });

     const dateFrom = date?.from;
     const dateTo = date?.to;

     const batchSummary = useMemo<BatchRow[]>(() => {
          const from = dateFrom ? new Date(dateFrom) : null;
          if (from) from.setHours(0, 0, 0, 0);
          const to = dateTo ? new Date(dateTo) : (from ? new Date(from) : null);
          if (to) to.setHours(23, 59, 59, 999);

          const inRange = (ts: string | null) => {
               if (!ts) return false;
               if (!from) return true;
               const d = new Date(ts);
               return d >= from! && d <= to!;
          };

          const map: Record<string, BatchRow> = {};
          for (const s of (dptOfflineStudents || [])) {
               const batch = s.batch || 'Tidak Diketahui';
               if (!map[batch]) map[batch] = { batch, totalOffline: 0, checkedIn: 0, totalOnline: 0, votedOnline: 0 };
               map[batch].totalOffline++;
               if (s.hasVoted && s.voteMethod === 'offline' && inRange(s.checkedInAt)) map[batch].checkedIn++;
          }
          for (const s of (onlineStudents || [])) {
               const batch = s.batch || 'Tidak Diketahui';
               if (!map[batch]) map[batch] = { batch, totalOffline: 0, checkedIn: 0, totalOnline: 0, votedOnline: 0 };
               map[batch].totalOnline++;
               if (s.hasVoted && s.voteMethod === 'online' && inRange(s.votedAt)) map[batch].votedOnline++;
          }
          return Object.values(map).sort((a, b) => a.batch.localeCompare(b.batch));
     }, [dptOfflineStudents, onlineStudents, dateFrom, dateTo]);

     const dateSummary = useMemo<DateRow[]>(() => {
          const from = dateFrom ? new Date(dateFrom) : null;
          if (from) from.setHours(0, 0, 0, 0);
          const to = dateTo ? new Date(dateTo) : (from ? new Date(from) : null);
          if (to) to.setHours(23, 59, 59, 999);

          const inRange = (ts: string | null) => {
               if (!ts) return false;
               if (!from) return true;
               const d = new Date(ts);
               return d >= from! && d <= to!;
          };

          const toKey = (ts: string) => new Date(ts).toLocaleDateString('id-ID', {
               day: '2-digit', month: 'long', year: 'numeric'
          });

          const map: Record<string, { offline: number; online: number }> = {};
          for (const s of (dptOfflineStudents || [])) {
               if (s.checkedInAt && inRange(s.checkedInAt)) {
                    const k = toKey(s.checkedInAt);
                    if (!map[k]) map[k] = { offline: 0, online: 0 };
                    map[k].offline++;
               }
          }
          for (const s of (onlineStudents || [])) {
               if (s.votedAt && inRange(s.votedAt)) {
                    const k = toKey(s.votedAt);
                    if (!map[k]) map[k] = { offline: 0, online: 0 };
                    map[k].online++;
               }
          }
          return Object.entries(map)
               .map(([d, { offline, online }]) => ({ date: d, offline, online, total: offline + online }))
               .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
     }, [dptOfflineStudents, onlineStudents, dateFrom, dateTo]);

     const handleDownloadReport = async () => {
          try {
               setIsDownloading(true);
               const res = await api.get('/students?accessType=offline&includeAllRoles=true&limit=10000');
               const allOfflineStudents: any[] = res.data.data || [];

               const checkedIn = allOfflineStudents.filter((s: any) =>
                    s.hasVoted && s.voteMethod === 'offline' && s.checkedInAt
               );

               if (checkedIn.length === 0) {
                    toast.error("Belum ada data mahasiswa yang melakukan check-in.");
                    setIsDownloading(false);
                    return;
               }

               const workbook = XLSX.utils.book_new();

               const detailRows = checkedIn.map((s: any, i: number) => {
                    const dt = s.checkedInAt ? new Date(s.checkedInAt) : null;
                    return {
                         "No": i + 1,
                         "NIM": s.nim,
                         "Nama": s.name,
                         "Angkatan": s.batch || "-",
                         "Tanggal": dt ? dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : "-",
                         "Jam": dt ? dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "-",
                         "Petugas": s.checkedInByName || s.checkedInBy || "-",
                    };
               });
               const wsDetail = XLSX.utils.json_to_sheet(detailRows);
               wsDetail['!cols'] = [{ wch: 5 }, { wch: 16 }, { wch: 36 }, { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 28 }];
               XLSX.utils.book_append_sheet(workbook, wsDetail, "Detail Check-in");

               const batchMap: Record<string, { total: number; checkedIn: number }> = {};
               for (const s of allOfflineStudents) {
                    const b = s.batch || 'Tidak Diketahui';
                    if (!batchMap[b]) batchMap[b] = { total: 0, checkedIn: 0 };
                    batchMap[b].total++;
                    if (s.hasVoted && s.voteMethod === 'offline' && s.checkedInAt) batchMap[b].checkedIn++;
               }
               const batchRows = Object.entries(batchMap)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([batch, { total, checkedIn }]) => ({
                         "Angkatan": batch,
                         "Total Terdaftar": total,
                         "Total Check-in": checkedIn,
                         "Belum Check-in": total - checkedIn,
                         "Persentase (%)": total > 0 ? Number(((checkedIn / total) * 100).toFixed(1)) : 0,
                    }));
               const wsBatch = XLSX.utils.json_to_sheet(batchRows);
               wsBatch['!cols'] = [{ wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
               XLSX.utils.book_append_sheet(workbook, wsBatch, "Rekap per Angkatan");

               const dateMap: Record<string, number> = {};
               for (const s of checkedIn) {
                    const dateKey = new Date(s.checkedInAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
                    dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
               }
               const dateRows = Object.entries(dateMap).map(([date, count]) => ({ "Tanggal": date, "Jumlah Check-in": count }));
               const wsDate = XLSX.utils.json_to_sheet(dateRows);
               wsDate['!cols'] = [{ wch: 24 }, { wch: 16 }];
               XLSX.utils.book_append_sheet(workbook, wsDate, "Rekap per Tanggal");

               XLSX.writeFile(workbook, `Laporan_Checkin_PEMIRA_${new Date().toISOString().split('T')[0]}.xlsx`);
               toast.success("Laporan berhasil diunduh");
          } catch (error) {
               console.error("Download error:", error);
               toast.error("Gagal mengunduh laporan.");
          } finally {
               setIsDownloading(false);
          }
     };

     const handleCheckIn = useCallback(async (nim: string) => {
          if (pendingNims.has(nim)) return;
          setPendingNims(prev => new Set(prev).add(nim));
          toast.promise(
               api.post('/votes/checkin', { nim })
                    .then(() => {
                         queryClient.invalidateQueries({ queryKey: ['checkin-students'] });
                         queryClient.invalidateQueries({ queryKey: ['dpt-offline-full'] });
                    })
                    .finally(() => setPendingNims(prev => { const s = new Set(prev); s.delete(nim); return s; })),
               {
                    loading: 'Memproses check-in...',
                    success: 'Check-in berhasil!',
                    error: (err: any) => err.response?.data?.message || 'Gagal check-in'
               }
          );
     }, [api, queryClient, pendingNims]);

     const handleUnCheckIn = useCallback(async (nim: string) => {
          if (pendingNims.has(nim)) return;
          setPendingNims(prev => new Set(prev).add(nim));
          toast.promise(
               api.post('/votes/uncheckin', { nim })
                    .then(() => {
                         queryClient.invalidateQueries({ queryKey: ['checkin-students'] });
                         queryClient.invalidateQueries({ queryKey: ['dpt-offline-full'] });
                    })
                    .finally(() => setPendingNims(prev => { const s = new Set(prev); s.delete(nim); return s; })),
               {
                    loading: 'Membatalkan check-in...',
                    success: 'Undo check-in berhasil!',
                    error: (err: any) => err.response?.data?.message || 'Gagal undo check-in'
               }
          );
     }, [api, queryClient, pendingNims]);

     const getStatusBadge = useCallback((student: any) => {
          if (!student.hasVoted) return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Belum Voting</Badge>;
          if (student.voteMethod === 'online') return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Sudah Voting (Online)</Badge>;
          return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Sudah Check-in (Offline)</Badge>;
     }, []);

     const columns = useMemo<ColumnDef<any>[]>(() => [
          {
               accessorKey: "nim",
               header: "NIM",
               cell: ({ row }) => <span className="font-mono">{row.original.nim}</span>,
          },
          {
               accessorKey: "name",
               header: "Nama",
               cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
          },
          {
               accessorKey: "batch",
               header: "Angkatan",
               cell: ({ row }) => row.original.batch || "-",
          },
          {
               accessorKey: "status",
               header: "Status",
               enableSorting: false,
               cell: ({ row }) => getStatusBadge(row.original),
          },
          {
               id: "aksi",
               header: () => <div className="text-right">Aksi</div>,
               enableSorting: false,
               cell: ({ row }) => {
                    const student = row.original;
                    return (
                         <div className="flex justify-end">
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
                         </div>
                    );
               },
          },
     ], [handleCheckIn, handleUnCheckIn]);

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
                                        className={cn("w-65 justify-start text-left font-normal", !date && "text-muted-foreground")}
                                   >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                             date.to ? (
                                                  <>{format(date.from, "LLL dd, y")} -{" "}{format(date.to, "LLL dd, y")}</>
                                             ) : format(date.from, "LLL dd, y")
                                        ) : <span>Filter Tanggal</span>}
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
                    <StatsCard title="Total Check-in" value={stats?.totalCheckedIn ?? 0} icon={UserCheck} description="Mahasiswa (Offline)" />
                    <StatsCard title="Check-in Hari Ini" value={stats?.todayCheckedIn ?? 0} icon={Clock} description="Mahasiswa" />
                    <StatsCard title="Belum Memilih" value={stats?.remainingVoters ?? 0} icon={UserX} description="Mahasiswa (Total)" />
                    <StatsCard title="Partisipasi Total" value={`${Number(stats?.completionRate ?? 0).toFixed(1)}%`} icon={Percent} description="DPT (Online + Offline)" />
               </div>

               <DataTable
                    columns={columns}
                    data={students || []}
                    isLoading={isLoading}
                    loadingRows={5}
                    toolbar={
                         <div className="flex gap-2 max-w-md w-full">
                              <Input
                                   placeholder="Cari NIM atau Nama..."
                                   onChange={(e) => {
                                        clearTimeout(debounceRef.current);
                                        debounceRef.current = setTimeout(() => setDebouncedSearch(e.target.value), 400);
                                   }}
                              />
                              <Button variant="outline" size="icon">
                                   <Search className="h-4 w-4" />
                              </Button>
                         </div>
                    }
               />

               <RekapSection
                    batchSummary={batchSummary}
                    dateSummary={dateSummary}
                    isLoading={isLoadingDpt || isLoadingOnline}
               />
          </div>
     );
}
