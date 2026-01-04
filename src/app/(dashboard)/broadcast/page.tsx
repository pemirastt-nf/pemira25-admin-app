"use client";

import { useState } from "react";
import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, Eye, Info } from "lucide-react";
import {
     Dialog,
     DialogContent,
     DialogDescription,
     DialogFooter,
     DialogHeader,
     DialogTitle,
} from "@/components/ui/dialog";
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

export default function BroadcastPage() {
     const api = useApi();
     const [subject, setSubject] = useState("");
     const [template, setTemplate] = useState("");
     const [isSending, setIsSending] = useState(false);

     // Preview State
     const [previewOpen, setPreviewOpen] = useState(false);
     const [previewHtml, setPreviewHtml] = useState("");
     const [isPreviewLoading, setIsPreviewLoading] = useState(false);

     // Confirm Send State
     const [confirmOpen, setConfirmOpen] = useState(false);

     const TEMPLATES = [
          {
               label: "📢 Pembukaan Pemilihan",
               subject: "[PENTING] PEMIRA STTNF Telah Dibuka! Gunakan Hak Suara Anda",
               body: `Halo <b>{{name}}</b>,
<br><br>
Masa pemilihan Raya (PEMIRA) STTNF telah resmi dibuka!.
<br><br>
Kami mengundang Anda untuk berpartisipasi dalam menentukan masa depan organisasi mahasiswa. Suara Anda sangat berarti bagi kemajuan kampus kita.
<br><br>
👉 <b>Silakan login dan pilih kandidat terbaik menurut Anda.</b>
<br><br>
Jangan lewatkan kesempatan ini!
<br><br>
Salam,<br>
Panitia PEMIRA STTNF`
          },
          {
               label: "⏰ Pengingat Voting",
               subject: "[Reminder] Sudahkah Anda Memilih di PEMIRA?",
               body: `Halo <b>{{name}}</b>,
<br><br>
Kami melihat bahwa Anda belum menggunakan hak suara Anda dalam PEMIRA kali ini.
<br><br>
Ingat, partisipasi Anda menentukan siapa yang akan memimpin organisasi mahasiswa ke depan. Proses pemilihan sangat mudah dan cepat.
<br><br>
Segera login dan berikan suara Anda sebelum waktu pemilihan berakhir.
<br><br>
Salam,<br>
Panitia PEMIRA STTNF`
          },
          {
               label: "⚠️ Segera Berakhir",
               subject: "[URGENT] Waktu Pemilihan Hampir Habis!",
               body: `Halo <b>{{name}}</b>,
<br><br>
Waktu pemilihan tinggal sedikit lagi!
<br><br>
Ini adalah kesempatan terakhir Anda untuk berkontribusi. Jangan biarkan suara Anda hangus.
<br><br>
<b>Segera vote sekarang juga!</b>
<br><br>
Salam,<br>
Panitia PEMIRA STTNF`
          }
     ];

     const handleTemplateSelect = (tmpl: typeof TEMPLATES[0]) => {
          setSubject(tmpl.subject);
          setTemplate(tmpl.body);
          toast.success("Template diterapkan!", { position: 'bottom-center' });
     };

     const handleInsertPlaceholder = (placeholder: string) => {
          setTemplate((prev) => prev + ` {{${placeholder}}} `);
     };

     const handlePreview = async () => {
          if (!template) {
               toast.error("Template tidak boleh kosong");
               return;
          }

          setIsPreviewLoading(true);
          setPreviewOpen(true);
          try {
               const res = await api.post("/broadcast/preview", { template });
               setPreviewHtml(res.data.html);
          } catch (error) {
               toast.error("Gagal memuat preview");
               console.error(error);
          } finally {
               setIsPreviewLoading(false);
          }
     };

     const handleSend = async () => {
          if (!subject || !template) {
               toast.error("Subject dan Template wajib diisi");
               return;
          }
          setConfirmOpen(true);
     };

     const confirmSendBroadcast = async () => {
          setConfirmOpen(false);
          setIsSending(true);

          try {
               const res = await api.post("/broadcast/send", {
                    subject,
                    template,
                    target: 'all' // Default to all for now
               });

               toast.success("Broadcast berhasil dijadwalkan!", {
                    description: `Mengirim ke ${res.data.recipientCount} penerima.`
               });

               // Optional: clear form
               // setSubject("");
          } catch (error: unknown) {
               console.error(error);
               const msg = (error as unknown as { response: { data: { message: string } } })?.response?.data?.message || "Terjadi kesalahan server";
               toast.error("Gagal mengirim broadcast", {
                    description: msg
               });
          } finally {
               setIsSending(false);
          }
     };

     return (
          <div className="space-y-6">
               <div>
                    <h2 className="text-3xl font-bold tracking-tight">Broadcast Email</h2>
                    <p className="text-muted-foreground text-sm">Kirim email pengumuman atau informasi ke seluruh mahasiswa.</p>
               </div>

               <div className="grid gap-6">
                    <Card>
                         <CardHeader>
                              <CardTitle>Buat Pesan Baru</CardTitle>
                              <CardDescription>
                                   Gunakan placeholder untuk personalisasi pesan (misal: Halo nama).
                              </CardDescription>
                         </CardHeader>
                         <CardContent className="space-y-4">
                              <div className="space-y-2">
                                   <Label>Template Cepat</Label>
                                   <div className="flex flex-wrap gap-2">
                                        {TEMPLATES.map((t, idx) => (
                                             <Button
                                                  key={idx}
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleTemplateSelect(t)}
                                                  className="bg-muted/50 border hover:border-primary hover:bg-primary/5 hover:text-primary peer-checked:bg-primary peer-checked:text-primary peer-checked:border-primary transition-all"
                                             >
                                                  {t.label}
                                             </Button>
                                        ))}
                                   </div>
                              </div>

                              <div className="space-y-2">
                                   <Label htmlFor="subject">Subjek Email</Label>
                                   <Input
                                        id="subject"
                                        placeholder="Contoh: Pengumuman Penting PEMIRA"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                   />
                              </div>

                              <div className="space-y-2">
                                   <div className="flex justify-between items-center">
                                        <Label htmlFor="template">Isi Pesan (HTML Supported)</Label>
                                        <div className="flex gap-2">
                                             <Button size="sm" variant="outline" onClick={() => handleInsertPlaceholder("name")}>+ Nama</Button>
                                             <Button size="sm" variant="outline" onClick={() => handleInsertPlaceholder("nim")}>+ NIM</Button>
                                             <Button size="sm" variant="outline" onClick={() => handleInsertPlaceholder("email")}>+ Email</Button>
                                        </div>
                                   </div>
                                   <Textarea
                                        id="template"
                                        placeholder="Tulis pesan Anda di sini..."
                                        className="min-h-75 font-mono text-sm leading-relaxed"
                                        value={template}
                                        onChange={(e) => setTemplate(e.target.value)}
                                   />
                                   <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        Anda dapat menggunakan tag HTML dasar seperti &lt;b&gt;, &lt;br&gt;, &lt;p&gt;.
                                   </p>
                              </div>
                         </CardContent>
                         <CardFooter className="flex justify-between border-t px-6 py-4">
                              <Button variant="ghost" onClick={handlePreview} disabled={!template}>
                                   <Eye className="w-4 h-4 mr-2" />
                                   Preview
                              </Button>
                              <Button onClick={handleSend} disabled={isSending || !subject || !template}>
                                   <Send className="w-4 h-4 mr-2" />
                                   {isSending ? "Mengirim..." : "Kirim Broadcast"}
                              </Button>
                         </CardFooter>
                    </Card>
               </div>

               {/* Preview Dialog */}
               <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                         <DialogHeader>
                              <DialogTitle>Preview Pesan</DialogTitle>
                              <DialogDescription>
                                   Tampilan simulasi untuk satu mahasiswa contoh.
                              </DialogDescription>
                         </DialogHeader>

                         <div className="border rounded-md p-4 bg-white min-h-75">
                              {isPreviewLoading ? (
                                   <div className="flex items-center justify-center h-full text-muted-foreground">Memuat preview...</div>
                              ) : (
                                   <div dangerouslySetInnerHTML={{ __html: previewHtml }} className="prose prose-sm max-w-none dark:prose-invert" />
                              )}
                         </div>

                         <DialogFooter>
                              <Button onClick={() => setPreviewOpen(false)}>Tutup</Button>
                         </DialogFooter>
                    </DialogContent>
               </Dialog>

               {/* Confirm Send Dialog */}
               <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <AlertDialogContent>
                         <AlertDialogHeader>
                              <AlertDialogTitle>Kirim Broadcast Email?</AlertDialogTitle>
                              <AlertDialogDescription>
                                   Tindakan ini akan mengirimkan email ke <strong>seluruh mahasiswa aktif</strong> yang memiliki email terdaftar.
                                   <br /><br />
                                   Pastikan konten sudah benar. Proses ini akan berjalan di latar belakang.
                              </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={confirmSendBroadcast}>Ya, Kirim Sekarang</AlertDialogAction>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>
          </div>
     );
}
