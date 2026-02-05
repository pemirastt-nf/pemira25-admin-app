/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function CandidateDialog({ children, candidate, onSuccess }: { children: React.ReactNode; candidate?: any; onSuccess: () => void }) {
     const api = useApi();
     const [open, setOpen] = useState(false);
     const [loading, setLoading] = useState(false);

     // Form States
     const [chairmanName, setChairmanName] = useState("");
     const [viceChairmanName, setViceChairmanName] = useState("");
     const [orderNumber, setOrderNumber] = useState("");
     const [vision, setVision] = useState("");
     const [mission, setMission] = useState("");
     const [programs, setPrograms] = useState("");
     const [photoUrl, setPhotoUrl] = useState("");

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
                              <Label htmlFor="photo">URL Foto</Label>
                              <Input id="photo" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." />
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
