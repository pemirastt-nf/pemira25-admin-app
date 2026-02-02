/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, MoreHorizontal, Edit, Trash2, UserPlus, Undo2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
     DropdownMenu,
     DropdownMenuContent,
     DropdownMenuItem,
     DropdownMenuLabel,
     DropdownMenuSeparator,
     DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function CommitteePage() {
     const api = useApi();
     const [isAddOpen, setIsAddOpen] = useState(false);
     const [searchQuery, setSearchQuery] = useState("");
     const [searchResults, setSearchResults] = useState<any[]>([]);
     const [showDeleted, setShowDeleted] = useState(false);

     // Password Dialog State
     const [isPasswordOpen, setIsPasswordOpen] = useState(false);
     const [selectedUser, setSelectedUser] = useState<any>(null);
     const [password, setPassword] = useState("");
     const [selectedRole, setSelectedRole] = useState("operator_tps"); // Default role

     // Edit Dialog State
     const [isEditOpen, setIsEditOpen] = useState(false);
     const [editForm, setEditForm] = useState({
          name: "",
          email: "",
          role: "",
          password: ""
     });

     const { data: users, isLoading, refetch } = useQuery({
          queryKey: ['committee-users'],
          queryFn: async () => {
               const res = await api.get('/admin/users');
               return res.data.filter((u: any) => u.role !== 'voter');
          }
     });

     const handleSearch = async () => {
          if (!searchQuery) return;
          try {
               const res = await api.get(`/students?search=${searchQuery}`);
               setSearchResults(res.data.data);
          } catch (error) {
               console.error(error);
          }
     };

     const handlePromoteClick = (user: any) => {
          setSelectedUser(user);
          setPassword("");
          setSelectedRole("operator_tps");
          setIsPasswordOpen(true);
     };

     const handleConfirmPromote = async () => {
          if (!selectedUser || !password) return;

          toast.promise(
               async () => {
                    await api.patch(`/admin/users/${selectedUser.id}`, {
                         role: selectedRole,
                         password: password
                    });
                    setIsPasswordOpen(false);
                    setIsAddOpen(false);
                    setSelectedUser(null);
                    refetch();
               },
               {
                    loading: 'Mempromosikan pengguna...',
                    success: 'Pengguna berhasil dipromosikan dan password telah diatur',
                    error: 'Gagal mempromosikan pengguna'
               }
          );
     };

     const handleDemote = async (id: string) => {
          toast.promise(
               async () => {
                    await api.patch(`/admin/users/${id}`, { role: 'voter' });
                    refetch();
               },
               {
                    loading: 'Mendemosi pengguna...',
                    success: 'Pengguna dikembalikan menjadi Pemilih (Voter)',
                    error: 'Gagal mendemosi pengguna'
               }
          );
     };

     const handleRestore = async (id: string) => {
          toast.promise(
               async () => {
                    await api.post(`/students/${id}/restore`); // Reusing student endpoint as it targets the same 'users' table
                    refetch();
               },
               {
                    loading: 'Memulihkan pengguna...',
                    success: 'Pengguna berhasil dipulihkan',
                    error: 'Gagal memulihkan pengguna'
               }
          );
     };

     const handlePermanentDelete = async (id: string) => {
          if (!confirm("PERINGATAN: Tindakan ini permanen dan tidak dapat dibatalkan. Apakah Anda yakin?")) return;
          toast.promise(
               async () => {
                    await api.delete(`/students/${id}/permanent`);
                    refetch();
               },
               {
                    loading: 'Menghapus permanen...',
                    success: 'Pengguna dihapus permanen',
                    error: 'Gagal menghapus permanen'
               }
          );
     };

     const handleSoftDelete = async (id: string) => {
          // Reusing demote logic or actual delete logic. Assuming demote for now based on previous code usually just removing role, 
          // but if "delete" means soft delete the user entirely:
          toast.promise(
               async () => {
                    await api.delete(`/students/${id}`); // Assuming /students/:id delete endpoint works for soft delete
                    refetch();
               },
               {
                    loading: 'Menghapus pengguna...',
                    success: 'Pengguna berhasil dihapus',
                    error: 'Gagal menghapus pengguna'
               }
          );
     };

     const handleEdit = (user: any) => {
          setSelectedUser(user);
          setEditForm({
               name: user.name,
               email: user.email,
               role: user.role,
               password: ""
          });
          setIsEditOpen(true);
     };

     const handleConfirmEdit = async () => {
          if (!selectedUser) return;

          toast.promise(
               async () => {
                    await api.patch(`/admin/users/${selectedUser.id}`, editForm);
                    setIsEditOpen(false);
                    setSelectedUser(null);
                    refetch();
               },
               {
                    loading: 'Menyimpan perubahan...',
                    success: 'Data pengguna berhasil diperbarui',
                    error: 'Gagal memperbarui data pengguna'
               }
          );
     };

     const handleCreate = () => {
          setIsAddOpen(true);
          setSearchQuery("");
          setSearchResults([]);
     };

     const filteredUsers = users?.filter((u: any) => showDeleted || !u.deletedAt) || [];

     return (
          <div className="space-y-6">
               <div className="flex items-center justify-between">
                    <div>
                         <h2 className="text-3xl font-bold tracking-tight">Panitia</h2>
                         <p className="text-muted-foreground text-sm">Kelola akun panitia dan hak akses sistem.</p>
                    </div>
                    <Button onClick={handleCreate}>
                         <UserPlus className="mr-2 h-4 w-4" /> Tambah Panitia
                    </Button>
               </div>

               <div className="flex items-center space-x-2">
                    <Switch
                         id="show-deleted"
                         checked={showDeleted}
                         onCheckedChange={setShowDeleted}
                    />
                    <Label htmlFor="show-deleted">Tampilkan Dihapus</Label>
               </div>

               <div className="border rounded-lg bg-card">
                    <Table>
                         <TableHeader>
                              <TableRow>
                                   <TableHead>Nama</TableHead>
                                   <TableHead>Email</TableHead>
                                   <TableHead>Role</TableHead>
                                   <TableHead className="text-right">Aksi</TableHead>
                              </TableRow>
                         </TableHeader>
                         <TableBody>
                              {isLoading ? (
                                   Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                             <TableCell><Skeleton className="h-4 w-37.5" /></TableCell>
                                             <TableCell><Skeleton className="h-4 w-50" /></TableCell>
                                             <TableCell><Skeleton className="h-4 w-25" /></TableCell>
                                             <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                                        </TableRow>
                                   ))
                              ) : (
                                   filteredUsers.map((user: any) => {
                                        const isDeleted = !!user.deletedAt;
                                        return (
                                             <TableRow key={user.id} className={isDeleted ? "opacity-50 bg-destructive/5 hover:bg-destructive/10" : ""}>
                                                  <TableCell className="font-medium">
                                                       {user.name}
                                                       {isDeleted && <span className="ml-2 text-[10px] text-destructive border border-destructive px-1 rounded">DELETED</span>}
                                                  </TableCell>
                                                  <TableCell>{user.email}</TableCell>
                                                  <TableCell>
                                                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'super_admin'
                                                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                            }`}>
                                                            {user.role === 'super_admin' ? 'Super Admin'
                                                                 : user.role === 'operator_tps' ? 'Operator Registrasi'
                                                                      : user.role === 'operator_suara' ? 'Operator Suara'
                                                                           : user.role === 'operator_chat' ? 'Operator Chat'
                                                                                : 'Panitia'}
                                                       </span>
                                                  </TableCell>
                                                  <TableCell className="text-right">

                                                       <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                 <Button variant="ghost" className="h-8 w-8 p-0">
                                                                      <span className="sr-only">Open menu</span>
                                                                      <MoreHorizontal className="h-4 w-4" />
                                                                 </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                 <DropdownMenuLabel>Aksi</DropdownMenuLabel>

                                                                 {!isDeleted && (
                                                                      <>
                                                                           <DropdownMenuItem onClick={() => handleEdit(user)}>
                                                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                                           </DropdownMenuItem>
                                                                           <DropdownMenuSeparator />
                                                                           {user.role !== 'super_admin' && (
                                                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDemote(user.id)}>
                                                                                     <Shield className="mr-2 h-4 w-4" /> Demosi ke Voter
                                                                                </DropdownMenuItem>
                                                                           )}
                                                                           <DropdownMenuItem className="text-red-600" onClick={() => handleSoftDelete(user.id)}>
                                                                                <Trash2 className="mr-2 h-4 w-4" /> Hapus (Soft)
                                                                           </DropdownMenuItem>
                                                                      </>
                                                                 )}

                                                                 {isDeleted && (
                                                                      <>
                                                                           <DropdownMenuItem className="text-blue-600" onClick={() => handleRestore(user.id)}>
                                                                                <Undo2 className="mr-2 h-4 w-4" /> Pulihkan
                                                                           </DropdownMenuItem>
                                                                           <DropdownMenuItem className="text-red-600" onClick={() => handlePermanentDelete(user.id)}>
                                                                                <XCircle className="mr-2 h-4 w-4" /> Hapus Permanen
                                                                           </DropdownMenuItem>
                                                                      </>
                                                                 )}
                                                            </DropdownMenuContent>
                                                       </DropdownMenu>

                                                  </TableCell>
                                             </TableRow>
                                        );
                                   })
                              )}
                         </TableBody>
                    </Table>
               </div>

               {/* Add Member Dialog */}
               <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent>
                         <DialogHeader>
                              <DialogTitle>Tambah Anggota Panitia</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-4">
                              <div className="flex gap-2">
                                   <Input
                                        placeholder="Cari mahasiswa (NIM/Nama)..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                   />
                                   <Button onClick={handleSearch}>Cari</Button>
                              </div>
                              <div className="space-y-2">
                                   {searchResults.map((s: any) => (
                                        <div key={s.id} className="flex justify-between items-center border p-2 rounded">
                                             <div>
                                                  <div className="font-bold">{s.name}</div>
                                                  <div className="text-xs text-muted-foreground">{s.nim}</div>
                                             </div>
                                             <Button size="sm" onClick={() => handlePromoteClick(s)}>Angkat Panitia</Button>
                                        </div>
                                   ))}
                                   {searchResults.length === 0 && searchQuery && <p className="text-sm text-muted-foreground">Tidak ditemukan.</p>}
                              </div>
                         </div>
                    </DialogContent>
               </Dialog>

               {/* Password Confirmation Dialog */}
               <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                    <DialogContent>
                         <DialogHeader>
                              <DialogTitle>Atur Password Panitia</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-4 py-2">
                              <div className="space-y-2">
                                   <Label>Peran / Tugas</Label>
                                   <Select onValueChange={setSelectedRole} defaultValue={selectedRole}>
                                        <SelectTrigger>
                                             <SelectValue placeholder="Pilih Peran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="operator_tps">Operator Registrasi (TPS)</SelectItem>
                                             <SelectItem value="operator_suara">Operator Suara (Saksi)</SelectItem>
                                             <SelectItem value="operator_chat">Operator Chat (Humas)</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>

                              <p className="text-sm text-muted-foreground">
                                   Untuk keamanan, silakan atur password baru untuk <strong>{selectedUser?.name}</strong> agar dapat login ke dashboard admin.
                              </p>
                              <div className="space-y-2">
                                   <label htmlFor="pass" className="text-sm font-medium">Password Baru</label>
                                   <Input
                                        id="pass"
                                        type="password"
                                        placeholder="Masukkan password..."
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                   />
                              </div>
                              <div className="flex justify-end gap-2">
                                   <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>Batal</Button>
                                   <Button onClick={handleConfirmPromote} disabled={!password}>
                                        Konfirmasi & Simpan
                                   </Button>
                              </div>
                         </div>
                    </DialogContent>
               </Dialog>

               {/* Edit User Dialog */}
               <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                         <DialogHeader>
                              <DialogTitle>Edit Anggota Panitia</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-4 py-2">
                              <div className="space-y-2">
                                   <Label htmlFor="edit-name">Nama Lengkap</Label>
                                   <Input
                                        id="edit-name"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                   />
                              </div>
                              <div className="space-y-2">
                                   <Label htmlFor="edit-email">Email</Label>
                                   <Input
                                        id="edit-email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                   />
                              </div>
                              <div className="space-y-2">
                                   <Label>Peran / Tugas</Label>
                                   <Select
                                        value={editForm.role}
                                        onValueChange={(val) => setEditForm({ ...editForm, role: val })}
                                   >
                                        <SelectTrigger>
                                             <SelectValue placeholder="Pilih Peran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="panitia">Panitia (Umum)</SelectItem>
                                             <SelectItem value="operator_tps">Operator Registrasi (TPS)</SelectItem>
                                             <SelectItem value="operator_suara">Operator Suara (Saksi)</SelectItem>
                                             <SelectItem value="operator_chat">Operator Chat (Humas)</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div className="space-y-2">
                                   <Label htmlFor="edit-pass">Password Baru (Opsional)</Label>
                                   <Input
                                        id="edit-pass"
                                        type="password"
                                        placeholder="Kosongkan jika tidak ingin mengubah"
                                        value={editForm.password}
                                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                   />
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                   <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
                                   <Button onClick={handleConfirmEdit}>
                                        Simpan Perubahan
                                   </Button>
                              </div>
                         </div>
                    </DialogContent>
               </Dialog>
          </div>
     );
}
