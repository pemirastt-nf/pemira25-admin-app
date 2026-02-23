/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useApi } from "@/lib/api";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash, Edit, User, Undo2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CandidateDialog } from "./candidate-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function CandidatesPage() {
     const api = useApi();
     const { user } = useAuth();
     const isSuperAdmin = user?.role === 'super_admin';
     const [showDeleted, setShowDeleted] = useState(false);

     const { data: candidates, isLoading, refetch } = useQuery({
          queryKey: ['candidates', showDeleted],
          queryFn: async () => {
               const res = await api.get(`/candidates?includeDeleted=${showDeleted}`);
               return res.data;
          }
     });

     // Action Dialog State (Delete, Permanent, Restore)
     const [actionDialog, setActionDialog] = useState<{ isOpen: boolean; type: 'delete' | 'permanent' | 'restore'; data: any }>({
          isOpen: false,
          type: 'delete',
          data: null
     });

     // Action Handlers
     const handleDelete = (candidate: any) => {
          setActionDialog({ isOpen: true, type: 'delete', data: candidate });
     };

     const handleRestore = (candidate: any) => {
          setActionDialog({ isOpen: true, type: 'restore', data: candidate });
     };

     const handlePermanentDelete = (candidate: any) => {
          setActionDialog({ isOpen: true, type: 'permanent', data: candidate });
     };

     // Confirm Action Execution
     const confirmAction = async () => {
          const { type, data } = actionDialog;
          if (!data) return;

          setActionDialog(prev => ({ ...prev, isOpen: false }));

          if (type === 'delete') {
               toast.promise(
                    async () => {
                         await api.delete(`/candidates/${data.id}`);
                         refetch();
                    },
                    {
                         loading: 'Menghapus kandidat...',
                         success: 'Kandidat berhasil dihapus (soft delete)',
                         error: 'Gagal menghapus kandidat',
                    }
               );
          } else if (type === 'restore') {
               toast.promise(
                    async () => {
                         await api.post(`/candidates/${data.id}/restore`);
                         refetch();
                    },
                    {
                         loading: 'Memulihkan kandidat...',
                         success: 'Kandidat berhasil dipulihkan',
                         error: 'Gagal memulihkan kandidat'
                    }
               );
          } else if (type === 'permanent') {
               toast.promise(
                    async () => {
                         await api.delete(`/candidates/${data.id}/permanent`);
                         refetch();
                    },
                    {
                         loading: 'Menghapus permanen...',
                         success: 'Kandidat dihapus permanen',
                         error: 'Gagal menghapus permanen'
                    }
               );
          }
     };


     return (
          <div className="space-y-6">
               <div className="flex items-center justify-between">
                    <div>
                         <h2 className="text-3xl font-bold tracking-tight">Kandidat</h2>
                         <p className="text-muted-foreground text-sm">Kelola data pasangan calon ketua dan wakil.</p>
                    </div>
                    <CandidateDialog onSuccess={refetch}>
                         <Button>
                              <Plus className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Tambah Kandidat</span>
                         </Button>
                    </CandidateDialog>
               </div>

               <div className="flex items-center space-x-2">
                    <Switch
                         id="show-deleted"
                         checked={showDeleted}
                         onCheckedChange={setShowDeleted}
                    />
                    <Label htmlFor="show-deleted">Tampilkan Dihapus</Label>
               </div>

               {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                         {[1, 2, 3].map((i) => (
                              <Card key={i} className="overflow-hidden">
                                   <CardHeader className="h-48 bg-muted animate-pulse" />
                                   <CardContent className="p-6 space-y-4">
                                        <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                                        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                                   </CardContent>
                              </Card>
                         ))}
                    </div>
               ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                         {candidates?.map((candidate: any) => {
                              const isDeleted = !!candidate.deletedAt;
                              const [chairmanName, viceChairmanName] = candidate.name.split(" & ");
                              return (
                                   <Card key={candidate.id} className={`overflow-hidden flex flex-col ${isDeleted ? 'opacity-60 border-destructive/20 bg-destructive/5' : ''}`}>
                                        <CardHeader className="pb-2">
                                             <div className="flex justify-between items-start">
                                                  <span className="text-sm font-medium text-muted-foreground">
                                                       Kandidat #{candidate.orderNumber}
                                                  </span>
                                                  <User className="h-4 w-4 text-muted-foreground" />
                                             </div>
                                             <CardTitle className="text-2xl font-bold mt-1 group-hover:text-primary transition-colors">
                                                  {chairmanName} & {viceChairmanName}
                                             </CardTitle>
                                        </CardHeader>
                                        <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden mx-6 rounded-md mb-4 border">
                                             {candidate.photoUrl ? (
                                                  <Image
                                                       src={candidate.photoUrl}
                                                       alt={`Kandidat ${candidate.orderNumber}`}
                                                       fill
                                                       className="object-cover hover:scale-105 transition-transform duration-500"
                                                       sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                  />
                                             ) : (
                                                  <User className="h-16 w-16 text-muted-foreground/50" />
                                             )}
                                             {isDeleted && (
                                                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm z-20">
                                                       <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded font-bold uppercase tracking-wider shadow-lg transform -rotate-12 border-2 border-white">
                                                            DELETED
                                                       </span>
                                                  </div>
                                             )}
                                        </div>
                                        <CardContent className="pb-4 grow">
                                             <div className="space-y-2 text-sm text-muted-foreground">
                                                  <div className="flex items-center gap-2">
                                                       <span className="font-semibold text-foreground w-20">Visi:</span>
                                                       <p className="line-clamp-2 italic">&quot;{candidate.vision}&quot;</p>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                       <span className="font-semibold text-foreground w-20">Misi:</span>
                                                       <p className="line-clamp-1 whitespace-pre-line">{candidate.mission?.substring(0, 50)}...</p>
                                                  </div>
                                             </div>
                                        </CardContent>
                                        <CardFooter className="pt-0 flex gap-2 justify-end border-t bg-muted/20 p-4">
                                             {!isDeleted ? (
                                                  <>
                                                       <CandidateDialog candidate={candidate} onSuccess={refetch}>
                                                            <Button variant="outline" size="sm" className="h-8">
                                                                 <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                                                            </Button>
                                                       </CandidateDialog>
                                                       {isSuperAdmin && (
                                                            <Button
                                                                 variant="destructive"
                                                                 size="sm"
                                                                 className="h-8"
                                                                 onClick={() => handleDelete(candidate)}
                                                            >
                                                                 <Trash className="mr-2 h-3.5 w-3.5" /> Hapus
                                                            </Button>
                                                       )}
                                                  </>
                                             ) : (
                                                  isSuperAdmin && (
                                                       <>
                                                            <Button
                                                                 variant="outline"
                                                                 size="sm"
                                                                 className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                                 onClick={() => handleRestore(candidate)}
                                                            >
                                                                 <Undo2 className="mr-2 h-3.5 w-3.5" /> Pulihkan
                                                            </Button>
                                                            <Button
                                                                 variant="destructive"
                                                                 size="sm"
                                                                 className="h-8"
                                                                 onClick={() => handlePermanentDelete(candidate)}
                                                            >
                                                                 <XCircle className="mr-2 h-3.5 w-3.5" /> Hapus Permanen
                                                            </Button>
                                                       </>
                                                  )
                                             )}
                                        </CardFooter>
                                   </Card>
                              );
                         })}
                    </div>
               )}

               {/* Action Confirmation Dialog */}
               <AlertDialog open={actionDialog.isOpen} onOpenChange={(open) => setActionDialog(prev => ({ ...prev, isOpen: open }))}>
                    <AlertDialogContent>
                         <AlertDialogHeader>
                              <AlertDialogTitle>
                                   {actionDialog.type === 'delete' && "Hapus Kandidat (Soft Delete)?"}
                                   {actionDialog.type === 'restore' && "Pulihkan Kandidat?"}
                                   {actionDialog.type === 'permanent' && "Hapus Permanen?"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                   {actionDialog.type === 'delete' && (
                                        <>
                                             Anda akan menghapus kandidat <strong>No. {actionDialog.data?.number}</strong> secara sementara. Data masih dapat dipulihkan.
                                        </>
                                   )}
                                   {actionDialog.type === 'restore' && (
                                        <>
                                             Anda akan memulihkan kandidat <strong>No. {actionDialog.data?.number}</strong>. Data akan kembali muncul di daftar aktif.
                                        </>
                                   )}
                                   {actionDialog.type === 'permanent' && (
                                        <>
                                             <span className="text-destructive font-bold">PERINGATAN KERAS!</span><br />
                                             Tindakan ini akan menghapus data kandidat <strong>No. {actionDialog.data?.number}</strong> secara permanen dari database. Tindakan ini <strong>TIDAK DAPAT DIBATALKAN</strong>.
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
          </div>
     );
}
