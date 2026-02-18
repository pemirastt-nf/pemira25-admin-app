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
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
     DropdownMenu,
     DropdownMenuContent,
     DropdownMenuItem,
     DropdownMenuLabel,
     DropdownMenuSeparator,
     DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
     Pagination,
     PaginationContent,
     PaginationItem,
     PaginationLink,
     PaginationNext,
     PaginationPrevious,
     PaginationEllipsis,
} from "@/components/ui/pagination";

export default function LogsPage() {
     const api = useApi();
     const [page, setPage] = useState(1);
     const [search, setSearch] = useState("");
     const [actionFilter, setActionFilter] = useState("ALL");

     const [debouncedSearch, setDebouncedSearch] = useState("");

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
     const pagination = data?.pagination || { page: 1, limit: 20, total: 0 };
     const totalPages = Math.ceil(pagination.total / limit);

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
               'CREATE_INVITE': 'Buat Undangan',
               'ACCEPT_INVITE': 'Terima Undangan',
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
          <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
               <div className="flex items-center justify-between shrink-0">
                    <div>
                         <h1 className="text-3xl font-bold tracking-tight">Log Aktivitas</h1>
                         <p className="text-muted-foreground">Pantau tindakan administratif dan kejadian keamanan.</p>
                    </div>
               </div>

               <div className="flex items-center gap-4 shrink-0">
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
                              <DropdownMenuItem onClick={() => { setActionFilter("CREATE_INVITE"); setPage(1); }}>Buat Undangan</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setActionFilter("ACCEPT_INVITE"); setPage(1); }}>Terima Undangan</DropdownMenuItem>
                         </DropdownMenuContent>
                    </DropdownMenu>
               </div>

               <div className="rounded-md border flex-1 overflow-hidden flex flex-col">
                    <div className="overflow-auto bg-background">
                         <Table>
                              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                   <TableRow>
                                        <TableHead className="w-45">Waktu</TableHead>
                                        <TableHead>Aktor</TableHead>
                                        <TableHead>Aksi</TableHead>
                                        <TableHead>Target</TableHead>
                                        <TableHead>Lokasi</TableHead>
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
                                                  <TableCell className="font-mono text-xs whitespace-nowrap">
                                                       {format(new Date(log.timestamp), "dd MMM yyyy HH:mm:ss", { locale: id })}
                                                  </TableCell>
                                                  <TableCell>
                                                       <div className="flex flex-col">
                                                            <span className="font-medium whitespace-nowrap">{log.actorName}</span>
                                                            <span className="text-xs text-muted-foreground truncate max-w-37.5" title={log.actorId}>ID: {log.actorId}</span>
                                                       </div>
                                                  </TableCell>
                                                  <TableCell>
                                                       <Badge variant={getActionColor(log.action) as any} className="whitespace-nowrap">
                                                            {translateAction(log.action)}
                                                       </Badge>
                                                  </TableCell>
                                                  <TableCell className="max-w-50 truncate" title={log.target}>
                                                       {log.target || '-'}
                                                  </TableCell>
                                                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                       {log.location || log.ipAddress || '-'}
                                                  </TableCell>
                                             </TableRow>
                                        ))
                                   )}
                              </TableBody>
                         </Table>
                    </div>
               </div>

               {/* Pagination */}
               <div className="py-2 shrink-0">
                    <Pagination>
                         <PaginationContent>
                              <PaginationItem>
                                   <PaginationPrevious
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                   />
                              </PaginationItem>

                              {/* Simple Logic: Show current page and neighbors if needed, or just simple prev/next for now to avoid complex logic issues. 
                                  But let's try to show some page numbers. */}

                              {[...Array(totalPages)].map((_, i) => {
                                   const p = i + 1;
                                   // Show first, last, current, and neighbors
                                   if (
                                        p === 1 ||
                                        p === totalPages ||
                                        (p >= page - 1 && p <= page + 1)
                                   ) {
                                        return (
                                             <PaginationItem key={p}>
                                                  <PaginationLink
                                                       isActive={page === p}
                                                       onClick={() => setPage(p)}
                                                  >
                                                       {p}
                                                  </PaginationLink>
                                             </PaginationItem>
                                        );
                                   }

                                   // Show ellipsis
                                   if (
                                        (p === page - 2 && p > 1) ||
                                        (p === page + 2 && p < totalPages)
                                   ) {
                                        return (
                                             <PaginationItem key={p}>
                                                  <PaginationEllipsis />
                                             </PaginationItem>
                                        );
                                   }

                                   return null;
                              })}

                              <PaginationItem>
                                   <PaginationNext
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                   />
                              </PaginationItem>
                         </PaginationContent>
                    </Pagination>
               </div>
          </div>
     );
}
