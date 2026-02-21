/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { FileUp, Search, RefreshCw, Plus, Pencil } from "lucide-react";
import { ImportModal } from "./import-modal";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { createColumns, Student } from "./columns";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StudentsPage() {
     const [search, setSearch] = useState("");
     const [isImportOpen, setIsImportOpen] = useState(false);
     const [isAddOpen, setIsAddOpen] = useState(false);
     const [showDeleted, setShowDeleted] = useState(false);
     const [rowSelection, setRowSelection] = useState({});
     const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
     const [bulkUpdateData, setBulkUpdateData] = useState({ accessType: "", batch: "" });

     const api = useApi();
     const { user } = useAuth();

     const isSuperAdmin = user?.role === 'super_admin';

     // OTP Confirmation & Cooldown State
     const [otpConfirmOpen, setOtpConfirmOpen] = useState(false);
     const [selectedStudentForOtp, setSelectedStudentForOtp] = useState<any>(null);
     const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
     const [now, setNow] = useState(() => Date.now());

     // Action Dialog State (Delete, Permanent, Restore)
     const [actionDialog, setActionDialog] = useState<{ isOpen: boolean; type: 'delete' | 'permanent' | 'restore'; data: any }>({
          isOpen: false,
          type: 'delete',
          data: null
     });

     // Add Student State
     const [newStudent, setNewStudent] = useState({ nim: "", name: "", email: "", batch: "" });

     // Edit Student State
     const [isEditOpen, setIsEditOpen] = useState(false);
     const [editStudent, setEditStudent] = useState<{ id: string; nim: string; name: string; email: string; batch: string; accessType: string } | null>(null);

     // Tick for cooldown timer
     useEffect(() => {
          const interval = setInterval(() => setNow(Date.now()), 1000);
          return () => clearInterval(interval);
     }, []);

     // React Query for Students
     const { data, isLoading, refetch } = useQuery({
          queryKey: ['students', search, showDeleted],
          queryFn: async () => {
               const res = await api.get(`/students?search=${search}&includeDeleted=${showDeleted}&includeAllRoles=true`);
               return res.data;
          }
     });

     const handleResendOtpClick = (student: any) => {
          setSelectedStudentForOtp(student);
          setOtpConfirmOpen(true);
     };

     const confirmResendOtp = async () => {
          if (!selectedStudentForOtp) return;
          const nim = selectedStudentForOtp.nim;

          setOtpConfirmOpen(false);

          toast.promise(api.post('/auth/manual-otp', { identifier: nim }), {
               loading: 'Mengirim OTP...',
               success: () => {
                    setCooldowns(prev => ({ ...prev, [nim]: Date.now() + 60000 }));
                    return 'OTP berhasil dikirim!';
               },
               error: (err) => `Gagal pengiriman: ${err.response?.data?.message || "Unknown error"}`,
          });

          setSelectedStudentForOtp(null);
     };

     const handleMarkAttendance = async (nim: string) => {
          toast.promise(
               async () => {
                    const res = await api.post('/votes/checkin', { nim });
                    refetch();
                    return res; 
               },
               {
                    loading: 'Verifikasi kehadiran (Offline)...',
                    success: (res: any) => `Check-in Berhasil: ${res.data.user.name} (${res.data.user.nim})`,
                    error: (err) => {
                         const msg = err.response?.data?.message || "Gagal check-in";
                         const detail = err.response?.data?.detail;
                         return detail ? `${msg}: ${detail}` : msg;
                    },
               }
          );
     };

     // Manual Add Student
     const handleAddStudent = async () => {
          if (!newStudent.nim || !newStudent.name) {
               toast.error("NIM dan Nama wajib diisi");
               return;
          }

          toast.promise(
               async () => {
                    await api.post('/students', newStudent);
                    setIsAddOpen(false);
                    setNewStudent({ nim: "", name: "", email: "", batch: "" });
                    refetch();
               },
               {
                    loading: 'Menambahkan mahasiswa...',
                    success: 'Mahasiswa berhasil ditambahkan',
                    error: (err) => `Gagal: ${err.response?.data?.message || "Error"}`
               }
          );
     };

     const handleEditStudent = async () => {
          if (!editStudent || !editStudent.nim || !editStudent.name) {
               toast.error("NIM dan Nama wajib diisi");
               return;
          }

          toast.promise(
               async () => {
                    await api.put(`/students/${editStudent.id}`, {
                         nim: editStudent.nim,
                         name: editStudent.name,
                         email: editStudent.email,
                         batch: editStudent.batch,
                         accessType: editStudent.accessType
                    });
                    setIsEditOpen(false);
                    setEditStudent(null);
                    refetch();
               },
               {
                    loading: 'Menyimpan perubahan...',
                    success: 'Data mahasiswa berhasil diperbarui',
                    error: (err) => `Gagal: ${err.response?.data?.message || "Error"}`
               }
          );
     };

     const openEditDialog = (student: any) => {
          setEditStudent({
               id: student.id,
               nim: student.nim || "",
               name: student.name || "",
               email: student.email || "",
               batch: student.batch || "",
               accessType: student.accessType || "online"
          });
          setIsEditOpen(true);
     };


     const students = data?.data || [];

     const handleBulkUpdate = async () => {
          const selectedIndices = Object.keys(rowSelection);
          if (selectedIndices.length === 0) return;

          const selectedStudentIds = selectedIndices.map(idx => students[Number(idx)]?.id).filter(Boolean);
          
          if (selectedStudentIds.length === 0) return;

          const updates: any = {};
          if (bulkUpdateData.accessType) updates.accessType = bulkUpdateData.accessType;
          if (bulkUpdateData.batch) updates.batch = bulkUpdateData.batch;

          if (Object.keys(updates).length === 0) {
               toast.error("Tidak ada perubahan yang dipilih");
               return;
          }

          toast.promise(api.put('/students/bulk', { ids: selectedStudentIds, updates }), {
               loading: 'Mengupdate data mahasiswa...',
               success: () => {
                    setIsBulkEditOpen(false);
                    setRowSelection({});
                    setBulkUpdateData({ accessType: "", batch: "" });
                    refetch();
                    return 'Berhasil update data mahasiswa!';
               },
               error: (err) => `Gagal update: ${err.response?.data?.message || err.message}`
          });
     };

     // Action Handlers
     const handleDeleteStudent = (student: any) => {
          setActionDialog({ isOpen: true, type: 'delete', data: student });
     };

     const handleRestore = (student: any) => {
          setActionDialog({ isOpen: true, type: 'restore', data: student });
     };

     const handlePermanentDelete = (student: any) => {
          setActionDialog({ isOpen: true, type: 'permanent', data: student });
     };

     const confirmAction = async () => {
          const { type, data } = actionDialog;
          if (!data) return;

          setActionDialog(prev => ({ ...prev, isOpen: false }));

          if (type === 'delete') {
               toast.promise(
                    async () => {
                         await api.delete(`/students/${data.id}`);
                         refetch();
                    },
                    {
                         loading: 'Menghapus data...',
                         success: 'Data mahasiswa berhasil dihapus (Soft Delete)',
                         error: 'Gagal menghapus data'
                    }
               );
          } else if (type === 'restore') {
               toast.promise(
                    async () => {
                         await api.post(`/students/${data.id}/restore`);
                         refetch();
                    },
                    {
                         loading: 'Memulihkan data...',
                         success: 'Data mahasiswa berhasil dipulihkan',
                         error: 'Gagal memulihkan data'
                    }
               );
          } else if (type === 'permanent') {
               toast.promise(
                    async () => {
                         await api.delete(`/students/${data.id}/permanent`);
                         refetch();
                    },
                    {
                         loading: 'Menghapus permanen...',
                         success: 'Data mahasiswa dihapus permanen',
                         error: 'Gagal menghapus permanen'
                    }
               );
          }
     };

     const getCooldownRemaining = (nim: string) => {
          const expiry = cooldowns[nim];
          if (!expiry) return 0;
          return Math.max(0, Math.ceil((expiry - now) / 1000));
     };

     const columnActions = {
          onEdit: openEditDialog,
          onDelete: handleDeleteStudent,
          onRestore: handleRestore,
          onPermanentDelete: handlePermanentDelete,
          onResendOtp: handleResendOtpClick,
          onMarkAttendance: handleMarkAttendance,
          getCooldownRemaining,
          isSuperAdmin,
     };

     const columns = createColumns(columnActions);

     return (
          <div className="space-y-6">
               <div className="flex items-center justify-between">
                    <div>
                         <h2 className="text-3xl font-bold tracking-tight">Mahasiswa</h2>
                         <p className="text-muted-foreground text-sm">Kelola data pemilih dan monitor status voting.</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                         <Button onClick={() => setIsAddOpen(true)} className="gap-2" variant="outline">
                              <Plus className="h-4 w-4" />
                              Tambah Manual
                         </Button>
                         <Button onClick={() => setIsImportOpen(true)} className="gap-2">
                              <FileUp className="h-4 w-4" />
                              Import Excel
                         </Button>
                         {Object.keys(rowSelection).length > 0 && (
                              <Button variant="secondary" onClick={() => setIsBulkEditOpen(true)} className="gap-2">
                                   <Pencil className="h-4 w-4" />
                                   Edit ({Object.keys(rowSelection).length})
                              </Button>
                         )}
                    </div>
               </div>

               <div className="mb-4 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                         <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                         <Input
                              placeholder="Cari nama atau NIM..."
                              className="pl-8"
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                         />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => refetch()}>
                         <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <div className="flex items-center space-x-2">
                         <Switch
                              id="show-deleted"
                              checked={showDeleted}
                              onCheckedChange={setShowDeleted}
                         />
                         <Label htmlFor="show-deleted">Tampilkan Dihapus</Label>
                    </div>
               </div>

               <DataTable 
                    columns={columns} 
                    data={students.map((student: any) => ({ ...student, deletedAt: student.deletedAt }))} 
                    rowSelection={rowSelection}
                    onRowSelectionChange={setRowSelection}
               />

               <ImportModal open={isImportOpen} onOpenChange={setIsImportOpen} />

               {/* Bulk Edit Dialog */}
               <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
                    <DialogContent>
                         <DialogHeader>
                              <DialogTitle>Edit Masal ({Object.keys(rowSelection).length} Mahasiswa)</DialogTitle>
                              <DialogDescription>
                                   Ubah atribut untuk semua mahasiswa yang dipilih sekaligus. Kosongkan jika tidak ingin mengubah.
                              </DialogDescription>
                         </DialogHeader>
                         <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                   <Label>Tipe Akses (Voting Method)</Label>
                                   <Select
                                        value={bulkUpdateData.accessType}
                                        onValueChange={(val) => setBulkUpdateData({ ...bulkUpdateData, accessType: val })}
                                   >
                                        <SelectTrigger>
                                             <SelectValue placeholder="Pilih Tipe Akses (Biarkan kosong untuk skip)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="online">Online (Web Voting)</SelectItem>
                                             <SelectItem value="offline">Offline (TPS Voting)</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div className="space-y-2">
                                   <Label>Batch / Angkatan</Label>
                                   <Input
                                        placeholder="Tahun Angkatan (Biarkan kosong untuk skip)"
                                        value={bulkUpdateData.batch}
                                        onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, batch: e.target.value })}
                                   />
                              </div>
                         </div>
                         <DialogFooter>
                              <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>Batal</Button>
                              <Button onClick={handleBulkUpdate}>Simpan Perubahan</Button>
                         </DialogFooter>
                    </DialogContent>
               </Dialog>


               {/* OTP Confirmation Dialog */}
               <AlertDialog open={otpConfirmOpen} onOpenChange={setOtpConfirmOpen}>
                    <AlertDialogContent>
                         <AlertDialogHeader>
                              <AlertDialogTitle>Kirim Ulang OTP?</AlertDialogTitle>
                              <AlertDialogDescription>
                                   Apakah Anda yakin ingin mengirim ulang OTP kepada <strong>{selectedStudentForOtp?.name}</strong> ({selectedStudentForOtp?.email})?
                                   <br /><br />
                                   Pastikan mahasiswa tersebut benar-benar membutuhkan OTP baru. Gunakan fitur ini dengan bijak untuk menghindari spam.
                              </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={confirmResendOtp}>Ya, Kirim OTP</AlertDialogAction>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>

               {/* Action Confirmation Dialog (Delete/Restore/Permanent) */}
               <AlertDialog open={actionDialog.isOpen} onOpenChange={(open) => setActionDialog(prev => ({ ...prev, isOpen: open }))}>
                    <AlertDialogContent>
                         <AlertDialogHeader>
                              <AlertDialogTitle>
                                   {actionDialog.type === 'delete' && "Hapus Mahasiswa (Soft Delete)?"}
                                   {actionDialog.type === 'restore' && "Pulihkan Mahasiswa?"}
                                   {actionDialog.type === 'permanent' && "Hapus Permanen?"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                   {actionDialog.type === 'delete' && (
                                        <>
                                             Anda akan menghapus data <strong>{actionDialog.data?.name}</strong> secara sementara. Data masih dapat dipulihkan oleh Super Admin.
                                        </>
                                   )}
                                   {actionDialog.type === 'restore' && (
                                        <>
                                             Anda akan memulihkan data <strong>{actionDialog.data?.name}</strong>. Data akan kembali muncul di daftar aktif.
                                        </>
                                   )}
                                   {actionDialog.type === 'permanent' && (
                                        <>
                                             <span className="text-destructive font-bold">PERINGATAN KERAS!</span><br />
                                             Tindakan ini akan menghapus data <strong>{actionDialog.data?.name}</strong> secara permanen dari database. Tindakan ini <strong>TIDAK DAPAT DIBATALKAN</strong>.
                                        </>
                                   )}
                              </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                   onClick={confirmAction}
                                   className={actionDialog.type === 'permanent' || actionDialog.type === 'delete' ? "bg-destructive hover:bg-destructive/90" : ""}
                              >
                                   {actionDialog.type === 'delete' && "Ya, Hapus Sementara"}
                                   {actionDialog.type === 'restore' && "Ya, Pulihkan"}
                                   {actionDialog.type === 'permanent' && "Ya, Hapus Permanen"}
                              </AlertDialogAction>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>

               {/* Add Manual Student Dialog */}
               <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent>
                         <DialogHeader>
                              <DialogTitle>Tambah Mahasiswa Manual</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-4 py-2">
                              <div className="space-y-2">
                                   <Label htmlFor="nim">NIM <span className="text-red-500">*</span></Label>
                                   <Input
                                        id="nim"
                                        placeholder="Contoh: 0110221001"
                                        value={newStudent.nim}
                                        onChange={(e) => setNewStudent({ ...newStudent, nim: e.target.value })}
                                   />
                              </div>
                              <div className="space-y-2">
                                   <Label htmlFor="name">Nama Lengkap <span className="text-red-500">*</span></Label>
                                   <Input
                                        id="name"
                                        placeholder="Nama mahasiswa..."
                                        value={newStudent.name}
                                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                   />
                              </div>
                              <div className="space-y-2">
                                   <Label htmlFor="batch">Angkatan (Opsional)</Label>
                                   <Input
                                        id="batch"
                                        placeholder="Contoh: 2023"
                                        value={newStudent.batch}
                                        onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                                   />
                              </div>
                              <div className="space-y-2">
                                   <Label htmlFor="email">Email (Opsional)</Label>
                                   <Input
                                        id="email"
                                        placeholder="Email..."
                                        value={newStudent.email}
                                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                   />
                              </div>
                              <div className="flex justify-end gap-2 pt-4">
                                   <Button variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
                                   <Button onClick={handleAddStudent}>Simpan</Button>
                              </div>
                         </div>
                    </DialogContent>
               </Dialog>

               {/* Edit Student Dialog */}
               <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                         <DialogHeader>
                              <DialogTitle>Edit Data Mahasiswa</DialogTitle>
                         </DialogHeader>
                         {editStudent && (
                              <div className="space-y-4 py-2">
                                   <div className="space-y-2">
                                        <Label htmlFor="edit-nim">NIM <span className="text-red-500">*</span></Label>
                                        <Input
                                             id="edit-nim"
                                             placeholder="Contoh: 0110221001"
                                             value={editStudent.nim}
                                             onChange={(e) => setEditStudent({ ...editStudent, nim: e.target.value })}
                                        />
                                   </div>
                                   <div className="space-y-2">
                                        <Label htmlFor="edit-name">Nama Lengkap <span className="text-red-500">*</span></Label>
                                        <Input
                                             id="edit-name"
                                             placeholder="Nama mahasiswa..."
                                             value={editStudent.name}
                                             onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                                        />
                                   </div>
                                   <div className="space-y-2">
                                        <Label htmlFor="edit-batch">Angkatan (Opsional)</Label>
                                        <Input
                                             id="edit-batch"
                                             placeholder="Contoh: 2023"
                                             value={editStudent.batch}
                                             onChange={(e) => setEditStudent({ ...editStudent, batch: e.target.value })}
                                        />
                                   </div>
                                   <div className="space-y-2">
                                        <Label htmlFor="edit-email">Email (Opsional)</Label>
                                        <Input
                                             id="edit-email"
                                             placeholder="Email..."
                                             value={editStudent.email}
                                             onChange={(e) => setEditStudent({ ...editStudent, email: e.target.value })}
                                        />
                                   </div>
                                   <div className="space-y-2">
                                        <Label>Akses Login</Label>
                                        <Select
                                             value={editStudent.accessType}
                                             onValueChange={(val) => setEditStudent({ ...editStudent, accessType: val })}
                                        >
                                             <SelectTrigger>
                                                  <SelectValue />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  <SelectItem value="online">Online (Web)</SelectItem>
                                                  <SelectItem value="offline">Offline (TPS)</SelectItem>
                                             </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground">
                                             Jika &apos;Offline&apos;, mahasiswa tidak dapat login di web.
                                        </p>
                                   </div>
                                   <div className="flex justify-end gap-2 pt-4">
                                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
                                        <Button onClick={handleEditStudent}>Simpan Perubahan</Button>
                                   </div>
                              </div>
                         )}
                    </DialogContent>
               </Dialog>
          </div>
     );
}

