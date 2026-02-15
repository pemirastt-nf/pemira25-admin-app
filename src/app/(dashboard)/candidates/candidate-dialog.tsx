/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useRef } from "react";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";

export function CandidateDialog({ children, candidate, onSuccess }: { children: React.ReactNode; candidate?: any; onSuccess: () => void }) {
     const api = useApi();
     const [open, setOpen] = useState(false);
     const [loading, setLoading] = useState(false);
     const [uploading, setUploading] = useState(false);
     const fileInputRef = useRef<HTMLInputElement>(null);

     // Form States
     const [chairmanName, setChairmanName] = useState("");
     const [viceChairmanName, setViceChairmanName] = useState("");
     const [orderNumber, setOrderNumber] = useState("");
     const [vision, setVision] = useState("");
     const [mission, setMission] = useState("");
     const [programs, setPrograms] = useState("");
     const [photoUrl, setPhotoUrl] = useState("");

     // Convert to WebP and Upload
     const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;

          try {
               setUploading(true);

               // 1. Convert to WebP Client-Side
               const webpBlob = await convertToWebP(file);
               
               // 2. Prepare Form Data
               const formData = new FormData();
               formData.append('file', webpBlob, `${file.name.split('.')[0]}.webp`);

               // 3. Upload to Backend
               const res = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
               });

               setPhotoUrl(res.data.url);
          } catch (error) {
               console.error("Upload failed", error);
               alert("Gagal mengupload gambar. Pastikan format sesuai.");
          } finally {
               setUploading(false);
          }
     };

     const convertToWebP = (file: File): Promise<Blob> => {
          return new Promise((resolve, reject) => {
               const img = document.createElement('img');
               img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('Canvas context failed'));
                    
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                         if (blob) resolve(blob);
                         else reject(new Error('Conversion failed'));
                    }, 'image/webp', 0.85); // 85% Quality WebP
               };
               img.onerror = reject;
               img.src = URL.createObjectURL(file);
          });
     };

     // Populate form on edit
     useEffect(() => {
          if (candidate) {
               const [cName, vName] = candidate.name.split(" & ");
               setChairmanName(cName || candidate.name);
               setViceChairmanName(vName || "");
               setOrderNumber(String(candidate.orderNumber));
               setVision(candidate.vision || "");
               setMission(candidate.mission || "");
               setPrograms(candidate.programs || "");
               setPhotoUrl(candidate.photoUrl || "");
          } else {
               // Reset
               setChairmanName("");
               setViceChairmanName("");
               setOrderNumber("");
               setVision("");
               setMission("");
               setPrograms("");
               setPhotoUrl("");
          }
     }, [candidate, open]);

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setLoading(true);

          const fullName = viceChairmanName ? `${chairmanName} & ${viceChairmanName}` : chairmanName;

          const payload = {
               name: fullName,
               orderNumber: Number(orderNumber),
               vision,
               mission,
               programs,
               photoUrl
          };

          try {
               if (candidate) {
                    // Update
                    await api.put(`/candidates/${candidate.id}`, payload);
               } else {
                    // Create
                    await api.post('/candidates', payload);
               }
               setOpen(false);
               onSuccess();
          } catch (error) {
               console.error(error);
               alert("Gagal menyimpan data kandidat");
          } finally {
               setLoading(false);
          }
     };

     return (
          <Dialog open={open} onOpenChange={setOpen}>
               <DialogTrigger asChild>
                    {children}
               </DialogTrigger>
               <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                         <DialogTitle>{candidate ? "Edit Kandidat" : "Tambah Kandidat"}</DialogTitle>
                         <DialogDescription>
                              {candidate ? "Perbarui detail kandidat." : "Tambahkan profil kandidat baru."}
                         </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                         <div className="grid gap-2">
                              <Label htmlFor="order">Nomor Urut</Label>
                              <Input id="order" type="number" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} required placeholder="Contoh: 1" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                   <Label htmlFor="chairman">Nama Ketua</Label>
                                   <Input id="chairman" value={chairmanName} onChange={e => setChairmanName(e.target.value)} required placeholder="Nama Ketua..." />
                              </div>
                              <div className="grid gap-2">
                                   <Label htmlFor="vice">Nama Wakil</Label>
                                   <Input id="vice" value={viceChairmanName} onChange={e => setViceChairmanName(e.target.value)} required placeholder="Nama Wakil..." />
                              </div>
                         </div>
                         <div className="grid gap-2">
                              <Label htmlFor="photo">Foto Kandidat</Label>
                              <div className="flex flex-col gap-4">
                                   {/* Preview Area */}
                                   {photoUrl ? (
                                        <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden border">
                                             <Image 
                                                  src={photoUrl} 
                                                  alt="Preview" 
                                                  fill 
                                                  className="object-contain" 
                                             />
                                             <Button
                                                  type="button"
                                                  variant="destructive"
                                                  size="icon"
                                                  className="absolute top-2 right-2 h-8 w-8"
                                                  onClick={() => setPhotoUrl("")}
                                             >
                                                  <X className="h-4 w-4" />
                                             </Button>
                                        </div>
                                   ) : (
                                        <div 
                                             onClick={() => fileInputRef.current?.click()}
                                             className="w-full h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/50"
                                        >
                                             {uploading ? (
                                                  <>
                                                       <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                                                       <span className="text-sm text-muted-foreground">Mengkonversi ke WebP & Upload...</span>
                                                  </>
                                             ) : (
                                                  <>
                                                       <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                       <span className="text-sm text-muted-foreground">Klik untuk upload foto</span>
                                                       <span className="text-xs text-muted-foreground mt-1">(JPG, PNG akan otomatis diubah ke WebP)</span>
                                                  </>
                                             )}
                                        </div>
                                   )}
                                   
                                   <input 
                                        ref={fileInputRef}
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleImageUpload}
                                   />
                                   
                                   {/* Hidden Input for manual override if needed */}
                                   <Input id="photo" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} type="hidden" />
                              </div>
                         </div>
                         <div className="grid gap-2">
                              <Label htmlFor="vision">Visi</Label>
                              <Textarea id="vision" value={vision} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVision(e.target.value)} placeholder="Visi kandidat..." />
                         </div>
                         <div className="grid gap-2">
                              <Label htmlFor="mission">Misi (Pisahkan dengan baris baru untuk poin-poin)</Label>
                              <Textarea id="mission" value={mission} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMission(e.target.value)} rows={5} placeholder="1. Misi pertama&#10;2. Misi kedua&#10;..." />
                         </div>
                         <div className="grid gap-2">
                              <Label htmlFor="programs">Program Unggulan (Pisahkan dengan baris baru)</Label>
                              <Textarea id="programs" value={programs} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrograms(e.target.value)} rows={5} placeholder="1. Program pertama&#10;2. Program kedua&#10;..." />
                         </div>
                         <DialogFooter>
                              <Button type="submit" disabled={loading}>
                                   {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                   Simpan Perubahan
                              </Button>
                         </DialogFooter>
                    </form>
               </DialogContent>
          </Dialog>
     );
}
