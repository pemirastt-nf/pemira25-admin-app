"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, AlertCircle } from "lucide-react";
import { useApi } from "@/lib/api";

interface ImportModalProps {
     open: boolean;
     onOpenChange: (open: boolean) => void;
}

export function ImportModal({ open, onOpenChange }: ImportModalProps) {
     const [file, setFile] = useState<File | null>(null);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const api = useApi();

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files[0]) {
               setFile(e.target.files[0]);
               setError(null);
          }
     };

     const handleUpload = async () => {
          if (!file) {
               setError("Mohon pilih file terlebih dahulu.");
               return;
          }

          setIsLoading(true);
          setError(null);

          try {
               // Read file
               const data = await file.arrayBuffer();
               const workbook = XLSX.read(data);
               const worksheetName = workbook.SheetNames[0];
               const worksheet = workbook.Sheets[worksheetName];
               const jsonData = XLSX.utils.sheet_to_json(worksheet);

               if (jsonData.length === 0) {
                    setError("File tampaknya kosong.");
                    setIsLoading(false);
                    return;
               }

               console.log("Importing data:", jsonData);

               // Send to backend
               const response = await api.post('/students/import', { students: jsonData });
               const { success, errors, total } = response.data;

               onOpenChange(false);
               setFile(null);

               if (errors > 0) {
                    alert(`Import Selesai!\nTotal: ${total}\nBerhasil: ${success}\nGagal: ${errors}\n(Pastikan format nama kolom: NIM, Nama, Email)`);
               } else {
                    alert(`Import Berhasil! Total ${success} data masuk.`);
               }
          } catch (err) {
               console.error(err);
               setError("Gagal memproses file. Pastikan format sesuai template.");
          } finally {
               setIsLoading(false);
          }
     };

     return (
          <Dialog open={open} onOpenChange={onOpenChange}>
               <DialogContent className="sm:max-w-106.25">
                    <DialogHeader>
                         <DialogTitle>Import Data Mahasiswa</DialogTitle>
                         <DialogDescription>
                              Upload file Excel (.xlsx) atau CSV yang berisi data mahasiswa (NIM, Nama, Email).
                         </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                         <div className="grid w-full max-w-sm items-center gap-1.5">
                              <Label htmlFor="file">File Data Mahasiswa</Label>
                              <Input id="file" type="file" accept=".xlsx,.csv" onChange={handleFileChange} />
                         </div>
                         {error && (
                              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                                   <AlertCircle className="h-4 w-4" />
                                   <span>{error}</span>
                              </div>
                         )}
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                              Batal
                         </Button>
                         <Button onClick={handleUpload} disabled={isLoading || !file} className="gap-2">
                              {isLoading ? "Mengupload..." : (
                                   <>
                                        <Upload className="h-4 w-4" />
                                        Import Data
                                   </>
                              )}
                         </Button>
                    </DialogFooter>
               </DialogContent>
          </Dialog>
     );
}
