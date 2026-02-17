/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, MoreHorizontal, Edit, Trash2, UserPlus, Undo2, XCircle, Link as LinkIcon, Copy, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import Dialog Alert Component


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

     // Invite State
     const [isInviteOpen, setIsInviteOpen] = useState(false);
     const [inviteEmail, setInviteEmail] = useState("");
     const [inviteQuery, setInviteQuery] = useState("");
     const [inviteSearchResults, setInviteSearchResults] = useState<any[]>([]);
     const [inviteRole, setInviteRole] = useState("panitia");
     const [generatedInviteLink, setGeneratedInviteLink] = useState("");
     const [isInviteLoading, setIsInviteLoading] = useState(false);
     const [isLinkCopied, setIsLinkCopied] = useState(false);
     const [inviteToDelete, setInviteToDelete] = useState<string | null>(null);


     const { data: users, isLoading, refetch } = useQuery({
          queryKey: ['committee-users'],
          queryFn: async () => {
               const res = await api.get('/admin/users');
               return res.data.filter((u: any) => u.role !== 'voter');
          }
     });

     const { data: invitations, isLoading: isInvitationsLoading, refetch: refetchInvitations } = useQuery({
          queryKey: ['invitations'],
          queryFn: async () => {
               const res = await api.get('/admin/users/invitations');
               return res.data;
          }
     });

     const handleResendInvite = (invite: any) => {
          toast.promise(
               async () => {
                    await api.post('/admin/users/invite', {
                         email: invite.email,
                         role: invite.role
                    });
                    refetchInvitations();
               },
               {
                    loading: 'Memperbarui undangan...',
                    success: 'Link undangan berhasil diperbarui',
                    error: (err) => err.response?.data?.error || 'Gagal memperbarui undangan'
               }
          );
     };

     const handleConfirmDeleteInvite = async () => {
          if (!inviteToDelete) return;
          
          toast.promise(
               async () => {
                    await api.delete(`/admin/users/invite/${inviteToDelete}`);
                    setInviteToDelete(null);
                    refetchInvitations();
               },
               {
                    loading: 'Menghapus undangan...',
                    success: 'Undangan berhasil dihapus',
                    error: (err) => err.response?.data?.error || 'Gagal menghapus undangan'
               }
          );
     };

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

     const handleInviteSearch = async (query: string) => {
          setInviteQuery(query);
          
          if (query.length < 2) {
               setInviteSearchResults([]);
               // If query is valid email, set it as active email immediately
               if (query.includes('@')) {
                    setInviteEmail(query);
               }
               return;
          }
          
          try {
               const res = await api.get(`/students?search=${query}`);
               setInviteSearchResults(res.data.data.slice(0, 5));
          } catch (error) {
               console.error(error);
          }
     };

     const filteredUsers = users?.filter((u: any) => showDeleted || !u.deletedAt) || [];

     return (
          <div className="space-y-6">
               <div className="flex items-center justify-between">
                    <div>
                         <h2 className="text-3xl font-bold tracking-tight">Panitia</h2>
                         <p className="text-muted-foreground text-sm">Kelola akun panitia dan hak akses sistem.</p>
                    </div>
                    <div className="flex gap-2">
                         <Button variant="outline" onClick={() => setIsInviteOpen(true)}>
                              <LinkIcon className="mr-2 h-4 w-4" /> Undang via Link
                         </Button>
                         <Button onClick={handleCreate}>
                              <UserPlus className="mr-2 h-4 w-4" /> Tambah Manual
                         </Button>
                    </div>
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

               <div className="space-y-4 pt-4">
                    <h3 className="text-xl font-semibold tracking-tight">Undangan</h3>
                    <div className="border rounded-lg bg-card">
                         <Table>
                              <TableHeader>
                                   <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Kadaluarsa</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {isInvitationsLoading ? (
                                        <TableRow>
                                             <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Memuat undangan...</TableCell>
                                        </TableRow>
                                   ) : !invitations || invitations.length === 0 ? (
                                        <TableRow>
                                             <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Tidak ada undangan pending.</TableCell>
                                        </TableRow>
                                   ) : (
                                        invitations.map((invite: any) => (
                                             <TableRow key={invite.id}>
                                                  <TableCell className="font-medium">{invite.email}</TableCell>
                                                  <TableCell>
                                                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                            {invite.role === 'super_admin' ? 'Super Admin'
                                                                 : invite.role === 'operator_tps' ? 'Operator Registrasi'
                                                                      : invite.role === 'operator_suara' ? 'Operator Suara'
                                                                           : invite.role === 'operator_chat' ? 'Operator Chat'
                                                                                : 'Panitia'}
                                                       </span>
                                                  </TableCell>
                                                  <TableCell>
                                                       <span className="text-sm text-muted-foreground">
                                                            {invite.expiresAt ? new Date(invite.expiresAt).toLocaleString('id-ID', {
                                                                 day: 'numeric',
                                                                 month: 'short',
                                                                 year: 'numeric',
                                                                 hour: '2-digit',
                                                                 minute: '2-digit'
                                                            }) : '-'}
                                                       </span>
                                                  </TableCell>
                                                  <TableCell>
                                                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            invite.status === 'Aktif' 
                                                                 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                                 : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                       }`}>
                                                            {invite.status}
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
                                                                 {invite.status === 'Aktif' && (
                                                                      <DropdownMenuItem onClick={() => {
                                                                           navigator.clipboard.writeText(invite.link);
                                                                           toast.success("Link disalin!");
                                                                      }}>
                                                                           <Copy className="mr-2 h-4 w-4" /> Salin Link
                                                                      </DropdownMenuItem>
                                                                 )}
                                                                 <DropdownMenuItem onClick={() => handleResendInvite(invite)}>
                                                                      <Undo2 className="mr-2 h-4 w-4" />
                                                                      {invite.status === 'Aktif' ? 'Perbarui Link' : 'Generate Ulang'}
                                                                 </DropdownMenuItem>
                                                                 <DropdownMenuSeparator />
                                                                 <DropdownMenuItem className="text-red-600" onClick={() => setInviteToDelete(invite.id)}>
                                                                      <Trash2 className="mr-2 h-4 w-4" /> Batalkan Undangan
                                                                 </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                       </DropdownMenu>
                                                  </TableCell>
                                             </TableRow>
                                        ))
                                   )}
                              </TableBody>
                         </Table>
                    </div>
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
                                             <SelectItem value="super_admin">Super Admin</SelectItem>
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

               {/* Invite Dialog */}
               <Dialog open={isInviteOpen} onOpenChange={(open) => {
                    setIsInviteOpen(open);
                    if (!open) {
                         setGeneratedInviteLink("");
                         setInviteEmail("");
                         setInviteQuery("");
                         setInviteSearchResults([]);
                         setIsLinkCopied(false);
                         setIsInviteLoading(false);
                    }
               }}>
                    <DialogContent>
                         <DialogHeader>
                              <DialogTitle>Undang Panitia Baru</DialogTitle>
                              <DialogDescription>
                                   Bisa undang via email manual atau cari mahasiswa yang sudah ada.
                              </DialogDescription>
                         </DialogHeader>

                         {!generatedInviteLink ? (
                              <div className="space-y-4 py-4 max-h-100">
                                   <div className="space-y-2 relative">
                                        <Label>Cari User / Masukkan Email</Label>
                                        <Input
                                             placeholder="Ketik Nama atau Email"
                                             value={inviteQuery}
                                             onChange={(e) => {
                                                  handleInviteSearch(e.target.value);
                                                  // Basic email assumption: if it looks like an email and no search selected, use it
                                                  if (e.target.value.includes('@')) {
                                                       setInviteEmail(e.target.value);
                                                  }
                                             }}
                                        />
                                        {inviteSearchResults.length > 0 && (
                                             <div className="absolute w-full z-10 bg-background rounded-md border shadow-lg mt-1 overflow-hidden">
                                                  {inviteSearchResults.map(user => (
                                                       <div
                                                            key={user.id}
                                                            className="flex flex-col px-4 py-2 text-sm hover:bg-muted cursor-pointer border-b last:border-0"
                                                            onClick={() => {
                                                                 setInviteEmail(user.email);
                                                                 setInviteQuery(`${user.name} (${user.email})`);
                                                                 setInviteSearchResults([]); // Hide results
                                                            }}
                                                       >
                                                            <span className="font-semibold text-foreground">{user.name}</span>
                                                            <div className="text-xs text-muted-foreground flex justify-between">
                                                                 <span>{user.email}</span>
                                                                 <span className="opacity-70">{user.nim}</span>
                                                            </div>
                                                       </div>
                                                  ))}
                                             </div>
                                        )}
                                        <p className="text-[10px] text-muted-foreground">
                                             Jika memilih user yang ada, akun mereka akan di-upgrade. Jika email baru, akun baru akan dibuat.
                                        </p>
                                   </div>
                                   
                                   {inviteEmail && inviteEmail !== inviteQuery && (
                                        <div className="text-xs p-2 bg-muted/50 rounded flex gap-2 items-center">
                                            <span className="font-semibold text-muted-foreground">Target Email:</span> 
                                            <span className="font-mono">{inviteEmail}</span>
                                        </div>
                                   )}

                                   <div className="space-y-2">
                                        <Label>Peran (Role)</Label>
                                        <Select value={inviteRole} onValueChange={setInviteRole}>
                                             <SelectTrigger>
                                                  <SelectValue placeholder="Pilih Peran" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  <SelectItem value="panitia">Panitia (Committee)</SelectItem>
                                                  <SelectItem value="operator_tps">Operator TPS</SelectItem>
                                                  <SelectItem value="operator_suara">Operator Suara</SelectItem>
                                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                             </SelectContent>
                                        </Select>
                                   </div>
                                   <div className="flex justify-end pt-4">
                                        <Button
                                             onClick={async () => {
                                                  if (!inviteEmail) return toast.error("Email harus diisi");
                                                  setIsInviteLoading(true);
                                                  try {
                                                       const res = await api.post('/admin/users/invite', { email: inviteEmail, role: inviteRole });
                                                       setGeneratedInviteLink(res.data.link);
                                                       toast.success("Link undangan berhasil dibuat");
                                                       refetchInvitations();
                                                  } catch (err: any) {
                                                       toast.error(err.response?.data?.error || "Gagal membuat undangan");
                                                  } finally {
                                                       setIsInviteLoading(false);
                                                  }
                                             }}
                                             disabled={isInviteLoading}
                                        >
                                             {isInviteLoading ? "Memproses..." : "Buat Undangan"}
                                        </Button>
                                   </div>
                              </div>
                         ) : (
                              <div className="flex flex-col items-center justify-center space-y-4 py-6">
                                   <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
                                   </div>
                                   <div className="text-center space-y-1">
                                        <h3 className="text-lg font-semibold">Undangan Siap Dikirim!</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                             Bagikan link berikut kepada calon panitia untuk menyelesaikan pendaftaran.
                                        </p>
                                   </div>
                                   
                                   <div className="w-full flex items-center space-x-2 mt-4 px-2">
                                        <div className="grid flex-1 gap-2">
                                             <Label htmlFor="link" className="sr-only">
                                                  Link Undangan
                                             </Label>
                                             <Input
                                                  id="link"
                                                  value={generatedInviteLink}
                                                  readOnly
                                                  className="h-9 font-mono text-xs bg-muted/50"
                                                  onClick={(e) => e.currentTarget.select()}
                                             />
                                        </div>
                                        <Button
                                             type="button"
                                             size="sm"
                                             className="px-3"
                                             variant={isLinkCopied ? "outline" : "default"}
                                             onClick={() => {
                                                  navigator.clipboard.writeText(generatedInviteLink);
                                                  setIsLinkCopied(true);
                                                  toast.success("Link disalin!");
                                                  setTimeout(() => setIsLinkCopied(false), 2000);
                                             }}
                                        >
                                             {isLinkCopied ? (
                                                  <>
                                                       <CheckCircle2 className="h-4 w-4 mr-2" />
                                                       Tersalin
                                                  </>
                                             ) : (
                                                  <>
                                                       <Copy className="h-4 w-4 mr-2" />
                                                       Salin
                                                  </>
                                             )}
                                        </Button>
                                   </div>

                                   <div className="flex justify-center pt-4 w-full gap-2">
                                        <Button
                                             variant="outline"
                                             className="w-full sm:w-auto min-w-30"
                                             onClick={() => {
                                                  setIsInviteOpen(false);
                                                  setGeneratedInviteLink("");
                                                  setInviteEmail("");
                                                  setInviteQuery("");
                                                  setIsLinkCopied(false);
                                             }}
                                        >
                                             Selesai & Tutup
                                        </Button>
                                        <Button
                                             className="w-full sm:w-auto min-w-30"
                                             onClick={() => {
                                                  setGeneratedInviteLink("");
                                                  setInviteEmail("");
                                                  setInviteQuery("");
                                                  setIsLinkCopied(false);
                                             }}
                                        >
                                             Undang Lagi
                                        </Button>
                                   </div>
                              </div>
                         )}
                    </DialogContent>
               </Dialog>

               <AlertDialog open={!!inviteToDelete} onOpenChange={(open) => !open && setInviteToDelete(null)}>
                    <AlertDialogContent>
                         <AlertDialogHeader>
                              <AlertDialogTitle>Batalkan Undangan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                   Tindakan ini tidak dapat dibatalkan. Link undangan yang sudah dibagikan tidak akan berlaku lagi.
                              </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={handleConfirmDeleteInvite} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                   Ya, Batalkan
                              </AlertDialogAction>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>
          </div>
     );
}
