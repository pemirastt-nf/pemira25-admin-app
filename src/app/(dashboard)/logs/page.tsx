/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
     DropdownMenu,
     DropdownMenuContent,
     DropdownMenuItem,
     DropdownMenuLabel,
     DropdownMenuSeparator,
     DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LogsPage() {
     const api = useApi();
     const [page, setPage] = useState(1);
     const [search, setSearch] = useState("");
     const [actionFilter, setActionFilter] = useState("ALL");

     // Debounce Search
     const [debouncedSearch, setDebouncedSearch] = useState("");

     // Proper debounce effect
     useEffect(() => {
          const handler = setTimeout(() => {
               setDebouncedSearch(search);
               setPage(1); 
          }, 500);
          return () => clearTimeout(handler);
     }, [search]);

     const limit = 20;

     const { data, isLoading } = useQuery({
          queryKey: ['logs', page, debouncedSearch, actionFilter],
          queryFn: async () => {
               const res = await api.get('/admin/logs', {
                    params: {
                         page,
                         limit,
                         search: debouncedSearch,
                         action: actionFilter === 'ALL' ? undefined : actionFilter
                    }
               });
               return res.data;
          }
     });

     const logs = data?.data || [];

     const translateAction = (action: string) => {
          const map: Record<string, string> = {
               'ADMIN_LOGIN': 'Login Admin',
               'ADMIN_LOGOUT': 'Logout Admin',
               'OTP_REQUEST': 'Permintaan OTP',
               'MANUAL_OTP': 'OTP Manual',
               'VOTE_LOGIN': 'Login Pemilih',
               'CREATE_STUDENT': 'Tambah Mahasiswa',
               'UPDATE_STUDENT': 'Update Mahasiswa',
               'DELETE_STUDENT': 'Hapus Mahasiswa',
               'RESTORE_STUDENT': 'Pulihkan Mahasiswa',
               'PERMANENT_DELETE_STUDENT': 'Hapus Permanen Mhs',
               'CREATE_CANDIDATE': 'Tambah Kandidat',
               'UPDATE_CANDIDATE': 'Update Kandidat',
               'DELETE_CANDIDATE': 'Hapus Kandidat',
               'PROMOTE_COMMITTEE': 'Promosi Panitia',
               'DEMOTE_COMMITTEE': 'Demosi Panitia',
               'UPDATE_ROLE': 'Update Peran',
          };
          return map[action] || action;
     };

     const getActionColor = (action: string) => {
          if (action.includes('DELETE')) return 'destructive';
          if (action.includes('CREATE') || action.includes('RESTORE')) return 'default';
          if (action.includes('UPDATE')) return 'secondary';
          return 'outline';
     };

     return (
          <div className="space-y-6">
               <div className="flex items-center justify-between">
                    <div>
                         <h1 className="text-3xl font-bold tracking-tight">Log Aktivitas</h1>
                         <p className="text-muted-foreground">Pantau tindakan administratif dan kejadian keamanan.</p>
                    </div>
               </div>

               <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                         <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                         <Input
                              type="search"
                              placeholder="Cari aktor, target, atau detail..."
                              className="pl-8"
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                         />
                    </div>

                    <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-50 justify-between">
                                   {actionFilter === 'ALL' ? 'Semua Aksi' : actionFilter}
                                   <Filter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent className="w-50">
                              <DropdownMenuLabel>Filter Berdasarkan Aksi</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setActionFilter("ALL"); setPage(1); }}>Semua Aksi</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setActionFilter("ADMIN_LOGIN"); setPage(1); }}>Login Admin</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setActionFilter("OTP_REQUEST"); setPage(1); }}>Permintaan OTP</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setActionFilter("CREATE_STUDENT"); setPage(1); }}>Buat Mahasiswa</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setActionFilter("DELETE_STUDENT"); setPage(1); }}>Hapus Mahasiswa</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setActionFilter("RESTORE_STUDENT"); setPage(1); }}>Pulihkan Mahasiswa</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setActionFilter("PERMANENT_DELETE_STUDENT"); setPage(1); }}>Hapus Permanen Mhs</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setActionFilter("CREATE_CANDIDATE"); setPage(1); }}>Buat Kandidat</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setActionFilter("UPDATE_CANDIDATE"); setPage(1); }}>Update Kandidat</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setActionFilter("DELETE_CANDIDATE"); setPage(1); }}>Hapus Kandidat</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setActionFilter("PROMOTE_COMMITTEE"); setPage(1); }}>Promosi Panitia</DropdownMenuItem>
                         </DropdownMenuContent>
                    </DropdownMenu>
               </div>

               <div className="rounded-md border">
                    <Table>
                         <TableHeader>
                              <TableRow>
                                   <TableHead>Waktu</TableHead>
                                   <TableHead>Aktor</TableHead>
                                   <TableHead>Aksi</TableHead>
                                   <TableHead>Target</TableHead>
                                   <TableHead>Alamat IP</TableHead>
                              </TableRow>
                         </TableHeader>
                         <TableBody>
                              {isLoading ? (
                                   Array.from({ length: 10 }).map((_, i) => (
                                        <TableRow key={i}>
                                             <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                             <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                             <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                             <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                             <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        </TableRow>
                                   ))
                              ) : logs.length === 0 ? (
                                   <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                             Tidak ada log ditemukan.
                                        </TableCell>
                                   </TableRow>
                              ) : (
                                   logs.map((log: any) => (
                                        <TableRow key={log.id}>
                                             <TableCell className="font-mono text-xs">
                                                  {format(new Date(log.timestamp), "dd MMM yyyy HH:mm:ss", { locale: id })}
                                             </TableCell>
                                             <TableCell>
                                                  <div className="flex flex-col">
                                                       <span className="font-medium">{log.actorName}</span>
                                                       <span className="text-xs text-muted-foreground">ID: {log.actorId}</span>
                                                  </div>
                                             </TableCell>
                                             <TableCell>
                                                  <Badge variant={getActionColor(log.action) as any} className="whitespace-nowrap">
                                                       {translateAction(log.action)}
                                                  </Badge>
                                             </TableCell>
                                             <TableCell className="max-w-75 truncate" title={log.target}>
                                                  {log.target || '-'}
                                             </TableCell>
                                             <TableCell className="font-mono text-xs text-muted-foreground">
                                                  {log.ipAddress}
                                             </TableCell>
                                        </TableRow>
                                   ))
                              )}
                         </TableBody>
                    </Table>
               </div>

               {/* Pagination */}
               <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setPage((p) => Math.max(1, p - 1))}
                         disabled={page === 1 || isLoading}
                    >
                         <ChevronLeft className="h-4 w-4" />
                         Sebelumnya
                    </Button>
                    <div className="text-sm font-medium">Halaman {page}</div>
                    <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setPage((p) => p + 1)}
                         disabled={logs.length < limit || isLoading}
                    >
                         Selanjutnya
                         <ChevronRight className="h-4 w-4" />
                    </Button>
               </div>
          </div>
     );
}
