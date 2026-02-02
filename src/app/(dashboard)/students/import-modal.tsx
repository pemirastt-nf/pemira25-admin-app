"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Search, Loader2, CheckCircle, XCircle, FileSpreadsheet, UploadCloud, ArrowRight } from "lucide-react";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImportModalProps {
     open: boolean;
     onOpenChange: (open: boolean) => void;
}

interface PreviewData {
     id: number;
     nim: string;
     name: string;
     email: string;
     batch: string;
     isValid: boolean;
     original: Record<string, unknown>;
}

interface ColumnMapping {
     nim: string;
     name: string;
     email: string;
     batch: string;
}

export function ImportModal({ open, onOpenChange }: ImportModalProps) {
     const [step, setStep] = useState<"upload" | "mapping" | "config" | "preview">("upload");
     const [file, setFile] = useState<File | null>(null);
     const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);

     // Sheet Selection
     const [sheets, setSheets] = useState<string[]>([]);
     const [selectedSheet, setSelectedSheet] = useState<string>("");

     // Batch Config
     const [detectedBatches, setDetectedBatches] = useState<string[]>([]);
     const [batchConfig, setBatchConfig] = useState<Record<string, "online" | "offline">>({});

     // Column Mapping
     const [headers, setHeaders] = useState<string[]>([]);
     const [mapping, setMapping] = useState<ColumnMapping>({ nim: "", name: "", email: "", batch: "" });

     // Data Preview
     const [rawJson, setRawJson] = useState<Record<string, unknown>[]>([]);
     const [previewData, setPreviewData] = useState<PreviewData[]>([]);
     const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
     const [searchQuery, setSearchQuery] = useState("");

     // UI States
     const [isProcessing, setIsProcessing] = useState(false);
     const [isDragging, setIsDragging] = useState(false);

     const api = useApi();

     const resetState = () => {
          setStep("upload");
          setFile(null);
          setWorkbook(null);
          setSheets([]);
          setSelectedSheet("");
          setHeaders([]);
          setMapping({ nim: "", name: "", email: "", batch: "" });
          setRawJson([]);
          setPreviewData([]);
          setSelectedRows(new Set());
          setSearchQuery("");
     };

     const handleOpenChange = (isOpen: boolean) => {
          if (!isOpen) resetState();
          onOpenChange(isOpen);
     };

     // File Handling
     const processFile = async (selectedFile: File) => {
          setFile(selectedFile);

          try {
               const data = await selectedFile.arrayBuffer();
               const wb = XLSX.read(data);
               setWorkbook(wb);
               setSheets(wb.SheetNames);

               if (wb.SheetNames.length > 0) {
                    // Default to first sheet
                    handleSheetSelect(wb.SheetNames[0], wb);
               }
          } catch (err) {
               console.error(err);
               toast.error("Gagal membaca file Excel", { description: "Pastikan format file valid (.xlsx, .csv)" });
               setFile(null);
          }
     };

     const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files[0]) {
               processFile(e.target.files[0]);
          }
     };

     const handleDragOver = (e: React.DragEvent) => {
          e.preventDefault();
          setIsDragging(true);
     };

     const handleDragLeave = (e: React.DragEvent) => {
          e.preventDefault();
          setIsDragging(false);
     };

     const handleDrop = (e: React.DragEvent) => {
          e.preventDefault();
          setIsDragging(false);

          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
               const droppedFile = e.dataTransfer.files[0];
               if (droppedFile.name.match(/\.(xlsx|xls|csv)$/)) {
                    processFile(droppedFile);
               } else {
                    toast.error("Format file tidak didukung", { description: "Harap upload file Excel (.xlsx) atau CSV." });
               }
          }
     };

     // Sheet & Data Processing
     function handleSheetSelect(sheetName: string, wb: XLSX.WorkBook | null = workbook) {
          if (!wb) return;
          setSelectedSheet(sheetName);

          const worksheet = wb.Sheets[sheetName];
          const jsonData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // defval ensures empty cells exist

          if (jsonData.length === 0) {
               toast.warning("Sheet kosong", { description: "Silakan pilih sheet lain." });
               setHeaders([]);
               setRawJson([]);
               return;
          }

          setRawJson(jsonData);

          // Extract Headers
          const firstRow = jsonData[0];
          const extractedHeaders = Object.keys(firstRow);
          setHeaders(extractedHeaders);

          // Auto-detect Mapping
          const newMapping = { nim: "", name: "", email: "", batch: "" };
          extractedHeaders.forEach(h => {
               const lower = h.toLowerCase();
               if (lower.includes("nim") || lower.includes("nomor") || lower.includes("induk")) newMapping.nim = h;
               else if (lower.includes("nama") || lower.includes("name")) newMapping.name = h;
               else if (lower.includes("email") || lower.includes("surel")) newMapping.email = h;
               else if (lower.includes("angkatan") || lower.includes("batch") || lower.includes("tahun")) newMapping.batch = h;
          });
          setMapping(newMapping);

          setStep("mapping");
     };

     const applyMapping = () => {
          if (!mapping.nim || !mapping.name) {
               toast.warning("Mapping Kurang Lengkap", { description: "Kolom NIM dan Nama wajib dipilih." });
               return;
          }

          const processed: PreviewData[] = rawJson.map((row, index) => {
               const nim = String(row[mapping.nim] || "").trim();
               const name = String(row[mapping.name] || "").trim();
               const email = mapping.email ? String(row[mapping.email] || "").trim() : "";
               const batch = mapping.batch ? String(row[mapping.batch] || "").trim() : "";
               const isValid = nim.length > 0 && name.length > 0;

               // Construct a clean object for backend using standard keys
               const cleanOriginal = {
                    NIM: nim,
                    Name: name,
                    Email: email,
                    Batch: batch
               };

               return {
                    id: index,
                    nim,
                    name,
                    email,
                    batch,
                    isValid,
                    original: cleanOriginal
               };
          });

          setPreviewData(processed);

          setPreviewData(processed);

          // Auto select all valid rows
          const validIds = new Set(processed.filter(d => d.isValid).map(d => d.id));
          setSelectedRows(validIds);

          // Detect Batches for Config Step
          const uniqueBatches = Array.from(new Set(processed.map(d => d.batch).filter(Boolean))).sort();
          setDetectedBatches(uniqueBatches);

          // Default all to Online
          const initialConfig: Record<string, "online" | "offline"> = {};
          uniqueBatches.forEach(b => initialConfig[b] = "online");
          setBatchConfig(initialConfig);

          // Go to Config Step if batches exist, else Preview
          if (uniqueBatches.length > 0) {
               setStep("config");
          } else {
               setStep("preview");
          }
     };

     // Preview Logic
     const filteredData = useMemo(() => {
          if (!searchQuery) return previewData;
          const lower = searchQuery.toLowerCase();
          return previewData.filter(item =>
               item.nim.toLowerCase().includes(lower) ||
               item.name.toLowerCase().includes(lower)
          );
     }, [previewData, searchQuery]);

     const toggleRow = (id: number) => {
          const newSelected = new Set(selectedRows);
          if (newSelected.has(id)) {
               newSelected.delete(id);
          } else {
               newSelected.add(id);
          }
          setSelectedRows(newSelected);
     };

     const toggleAll = () => {
          const validFilteredIds = filteredData.filter(d => d.isValid).map(d => d.id);
          const allSelected = validFilteredIds.length > 0 && validFilteredIds.every(id => selectedRows.has(id));

          const newSelected = new Set(selectedRows);
          if (allSelected) {
               validFilteredIds.forEach(id => newSelected.delete(id));
          } else {
               validFilteredIds.forEach(id => newSelected.add(id));
          }
          setSelectedRows(newSelected);
     };

     const handleImport = async () => {
          if (selectedRows.size === 0) {
               toast.warning("Pilih setidaknya satu data untuk diimport");
               return;
          }

          setIsProcessing(true);
          try {
               const finalData = previewData
                    .filter(item => selectedRows.has(item.id))
                    .map(item => item.original);

               const response = await api.post('/students/import', {
                    students: finalData,
                    batchConfig: batchConfig
               });
               const { success, errors, total } = response.data;

               handleOpenChange(false);

               if (errors > 0) {
                    toast.warning(`Import Selesai dengan Catatan`, {
                         description: `Berhasil: ${success}, Gagal: ${errors}, Total: ${total}`,
                         duration: 5000,
                    });
               } else {
                    toast.success("Import Berhasil", {
                         description: `${success} data mahasiswa berhasil ditambahkan.`
                    });
               }
          } catch (err) {
               console.error(err);
               toast.error("Gagal melakukan import data");
          } finally {
               setIsProcessing(false);
          }
     };

     const validCount = previewData.filter(d => d.isValid).length;
     const invalidCount = previewData.length - validCount;

     return (
          <Dialog open={open} onOpenChange={handleOpenChange}>
               <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b">
                         <DialogTitle>Import Data Mahasiswa</DialogTitle>
                         <DialogDescription>
                              {step === "upload" && "Upload file Excel (.xlsx) untuk memulai."}
                              {step === "mapping" && "Sesuaikan kolom Excel dengan data sistem."}
                              {step === "preview" && "Review dan pilih data yang akan diimport."}
                         </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                         {/* Step 1: Upload */}
                         {step === "upload" && (
                              <div
                                   className={cn(
                                        "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer",
                                        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                                   )}
                                   onDragOver={handleDragOver}
                                   onDragLeave={handleDragLeave}
                                   onDrop={handleDrop}
                                   onClick={() => document.getElementById('file-upload')?.click()}
                              >
                                   <div className="p-4 bg-muted rounded-full">
                                        <UploadCloud className="h-10 w-10 text-muted-foreground" />
                                   </div>
                                   <div className="text-center space-y-1">
                                        <p className="text-lg font-semibold text-foreground">
                                             Klik untuk upload atau drag & drop
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                             Excel (.xlsx) atau CSV (max. 10MB)
                                        </p>
                                   </div>
                                   <Input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileSelect}
                                   />
                              </div>
                         )}

                         {/* Step 2: Sheet & Mapping */}
                         {step === "mapping" && (
                              <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4">
                                   <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                             <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                             <p className="font-medium text-sm">File Terpilih</p>
                                             <p className="text-xs text-muted-foreground">{file?.name}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setStep("upload")}>
                                             Ganti File
                                        </Button>
                                   </div>

                                   {sheets.length > 0 && (
                                        <div className="space-y-2">
                                             <Label>Pilih Sheet Data</Label>
                                             <Select value={selectedSheet} onValueChange={handleSheetSelect}>
                                                  <SelectTrigger>
                                                       <SelectValue placeholder="Pilih sheet..." />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       {sheets.map(sheet => (
                                                            <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                                                       ))}
                                                  </SelectContent>
                                             </Select>
                                        </div>
                                   )}

                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                             <Label className="text-primary font-semibold">Kolom NIM <span className="text-red-500">*</span></Label>
                                             <Select value={mapping.nim} onValueChange={(val) => setMapping(prev => ({ ...prev, nim: val }))}>
                                                  <SelectTrigger>
                                                       <SelectValue placeholder="Pilih kolom NIM" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                  </SelectContent>
                                             </Select>
                                             <p className="text-[10px] text-muted-foreground">Nomor Induk Mahasiswa (Unik)</p>
                                        </div>

                                        <div className="space-y-2">
                                             <Label className="text-primary font-semibold">Kolom Nama <span className="text-red-500">*</span></Label>
                                             <Select value={mapping.name} onValueChange={(val) => setMapping(prev => ({ ...prev, name: val }))}>
                                                  <SelectTrigger>
                                                       <SelectValue placeholder="Pilih kolom Nama" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                  </SelectContent>
                                             </Select>
                                             <p className="text-[10px] text-muted-foreground">Nama Lengkap Mahasiswa</p>
                                        </div>

                                        <div className="space-y-2">
                                             <Label>Kolom Email <span className="text-muted-foreground text-[10px] font-normal">(Opsional)</span></Label>
                                             <Select value={mapping.email || "ignore"} onValueChange={(val) => setMapping(prev => ({ ...prev, email: val === "ignore" ? "" : val }))}>
                                                  <SelectTrigger>
                                                       <SelectValue placeholder="Pilih kolom Email" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       <SelectItem value="ignore">- Tidak Ada -</SelectItem>
                                                       {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                  </SelectContent>
                                             </Select>
                                             <p className="text-[10px] text-muted-foreground">Email aktif untuk verifikasi</p>
                                        </div>

                                        <div className="space-y-2">
                                             <Label>Kolom Angkatan <span className="text-muted-foreground text-[10px] font-normal">(Opsional)</span></Label>
                                             <Select value={mapping.batch || "ignore"} onValueChange={(val) => setMapping(prev => ({ ...prev, batch: val === "ignore" ? "" : val }))}>
                                                  <SelectTrigger>
                                                       <SelectValue placeholder="Pilih kolom Angkatan" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       <SelectItem value="ignore">- Tidak Ada -</SelectItem>
                                                       {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                  </SelectContent>
                                             </Select>
                                             <p className="text-[10px] text-muted-foreground">Tahun Angkatan</p>
                                        </div>
                                   </div>
                              </div>
                         )}

                         {/* Step 2.5: Batch Config */}
                         {step === "config" && (
                              <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4">
                                   <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                                        <div className="mt-0.5"><CheckCircle className="h-5 w-5" /></div>
                                        <div>
                                             <p className="font-semibold">Konfigurasi Akses Voting</p>
                                             <p className="opacity-90">Sistem mendeteksi {detectedBatches.length} angkatan. Tentukan metode voting default untuk masing-masing angkatan.</p>
                                        </div>
                                   </div>

                                   <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                             <TableHeader className="bg-muted/50">
                                                  <TableRow>
                                                       <TableHead>Angkatan (Batch)</TableHead>
                                                       <TableHead>Metode Voting Default</TableHead>
                                                  </TableRow>
                                             </TableHeader>
                                             <TableBody>
                                                  {detectedBatches.map(batch => (
                                                       <TableRow key={batch}>
                                                            <TableCell className="font-medium">{batch}</TableCell>
                                                            <TableCell>
                                                                 <Select
                                                                      value={batchConfig[batch]}
                                                                      onValueChange={(val: "online" | "offline") => setBatchConfig(prev => ({ ...prev, [batch]: val }))}
                                                                 >
                                                                      <SelectTrigger className="w-45">
                                                                           <SelectValue />
                                                                      </SelectTrigger>
                                                                      <SelectContent>
                                                                           <SelectItem value="online">Online (Web)</SelectItem>
                                                                           <SelectItem value="offline">Offline (TPS)</SelectItem>
                                                                      </SelectContent>
                                                                 </Select>
                                                                 <p className="text-[10px] text-muted-foreground mt-1">
                                                                      {batchConfig[batch] === 'offline'
                                                                           ? 'Mahasiswa TIDAK BISA login di web.'
                                                                           : 'Mahasiswa bisa login & voting.'}
                                                                 </p>
                                                            </TableCell>
                                                       </TableRow>
                                                  ))}
                                             </TableBody>
                                        </Table>
                                   </div>
                              </div>
                         )}

                         {/* Step 3: Preview */}
                         {step === "preview" && (
                              <div className="space-y-4 animate-in fade-in-50">
                                   <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                             <div className="relative">
                                                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                  <Input
                                                       placeholder="Cari NIM atau Nama..."
                                                       value={searchQuery}
                                                       onChange={(e) => setSearchQuery(e.target.value)}
                                                       className="pl-8 w-64"
                                                  />
                                             </div>
                                             <div className="flex gap-2 text-xs font-medium">
                                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md flex items-center gap-1">
                                                       <CheckCircle className="h-3 w-3" /> {validCount} Valid
                                                  </span>
                                                  {invalidCount > 0 && (
                                                       <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md flex items-center gap-1">
                                                            <XCircle className="h-3 w-3" /> {invalidCount} Invalid
                                                       </span>
                                                  )}
                                             </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                             {selectedRows.size} dipilih
                                        </div>
                                   </div>

                                   <div className="border rounded-md">
                                        <ScrollArea className="h-87.5">
                                             <Table>
                                                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                                       <TableRow>
                                                            <TableHead className="w-12.5">
                                                                 <Checkbox
                                                                      checked={filteredData.length > 0 && filteredData.filter(d => d.isValid).every(d => selectedRows.has(d.id))}
                                                                      onCheckedChange={toggleAll}
                                                                 />
                                                            </TableHead>
                                                            <TableHead>NIM</TableHead>
                                                            <TableHead>Nama</TableHead>
                                                            <TableHead>Angkatan</TableHead>
                                                            <TableHead>Email</TableHead>
                                                            <TableHead className="text-right">Status</TableHead>
                                                       </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                       {filteredData.length === 0 ? (
                                                            <TableRow>
                                                                 <TableCell colSpan={5} className="h-24 text-center">
                                                                      Tidak ada data ditemukan.
                                                                 </TableCell>
                                                            </TableRow>
                                                       ) : (
                                                            filteredData.map((row) => (
                                                                 <TableRow key={row.id} className={!row.isValid ? "bg-red-600 hover:bg-red-500" : ""}>
                                                                      <TableCell>
                                                                           <Checkbox
                                                                                checked={selectedRows.has(row.id)}
                                                                                onCheckedChange={() => toggleRow(row.id)}
                                                                                disabled={!row.isValid}
                                                                           />
                                                                      </TableCell>
                                                                      <TableCell className="font-medium">{row.nim || <span className="text-white text-xs italic">(Kosong)</span>}</TableCell>
                                                                      <TableCell>{row.name || <span className="text-white text-xs italic">(Kosong)</span>}</TableCell>
                                                                      <TableCell>{row.batch || "-"}</TableCell>
                                                                      <TableCell>{row.email || "-"}</TableCell>
                                                                      <TableCell className="text-right">
                                                                           {row.isValid ? (
                                                                                <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                                                                           ) : (
                                                                                <XCircle className="h-4 w-4 text-white ml-auto" />
                                                                           )}
                                                                      </TableCell>
                                                                 </TableRow>
                                                            ))
                                                       )}
                                                  </TableBody>
                                             </Table>
                                        </ScrollArea>
                                   </div>
                              </div>
                         )}
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/40 flex justify-between gap-2">
                         <div className="flex gap-2 mr-auto">
                              {step !== "upload" && (
                                   <Button variant="ghost" onClick={() => setStep(step === "preview" ? "mapping" : "upload")} disabled={isProcessing}>
                                        Kembali
                                   </Button>
                              )}
                         </div>

                         <div className="flex gap-2">
                              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isProcessing}>
                                   Batal
                              </Button>

                              {step === "mapping" && (
                                   <Button onClick={applyMapping} className="gap-2">
                                        Lanjut Preview <ArrowRight className="h-4 w-4" />
                                   </Button>
                              )}

                              {step === "preview" && (
                                   <Button onClick={handleImport} disabled={isProcessing || selectedRows.size === 0} className="gap-2">
                                        {isProcessing ? (
                                             <>
                                                  <Loader2 className="h-4 w-4 animate-spin" />
                                                  Memproses...
                                             </>
                                        ) : (
                                             <>
                                                  <Upload className="h-4 w-4" />
                                                  Import {selectedRows.size > 0 ? `${selectedRows.size} Data` : ""}
                                             </>
                                        )}
                                   </Button>
                              )}
                         </div>
                    </DialogFooter>
               </DialogContent>
          </Dialog>
     );
}
