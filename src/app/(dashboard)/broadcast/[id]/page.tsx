/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, use } from "react";
import { useApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, Code, Info, Play } from "lucide-react";
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

interface BroadcastEditorProps {
     params: Promise<{ id: string }>;
}

export default function BroadcastEditorPage({ params }: BroadcastEditorProps) {
     // Unwrap params
     const { id } = use(params);
     const isNew = id === "new";

     const api = useApi();
     const router = useRouter();

     const [isLoading, setIsLoading] = useState(!isNew);
     const [isSaving, setIsSaving] = useState(false);
     const [availableBatches, setAvailableBatches] = useState<string[]>([]);

     // Form State
     const [subject, setSubject] = useState("");
     const [content, setContent] = useState("");
     const [targetType, setTargetType] = useState<"all" | "batch" | "unvoted">("all");
     const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
     const [status, setStatus] = useState<string>("draft");
     const [stats, setStats] = useState<{ total: number; sent: number; failed: number } | null>(null);

     // Dialogs
     const [testSendOpen, setTestSendOpen] = useState(false);
     const [testEmail, setTestEmail] = useState("");
     const [previewOpen, setPreviewOpen] = useState(false);
     const [previewHtml, setPreviewHtml] = useState("");
     const [publishOpen, setPublishOpen] = useState(false);

     // CTA Config Dialog State
     const [ctaConfigOpen, setCtaConfigOpen] = useState(false);
     const [tempCtaText, setTempCtaText] = useState("");
     const [tempCtaUrl, setTempCtaUrl] = useState("");

     const handleOpenCtaConfig = () => {
          setTempCtaText("VOTE SEKARANG");
          setTempCtaUrl("https://pemira.nurulfikri.ac.id/login");
          setCtaConfigOpen(true);
     };

     const handleSaveCtaConfig = () => {
          const shortcode = `{{cta_button|${tempCtaText}|${tempCtaUrl}}}`;
          setContent(prev => prev + (prev ? "\n" : "") + shortcode);
          setCtaConfigOpen(false);
          toast.success("Button CTA disisipkan!");
     };

     // Global CTA state removed
     const ctaText = "";
     const ctaUrl = "";
     const setCtaText = (v: string) => { };
     const setCtaUrl = (v: string) => { };


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
{{cta_button|LOGIN & VOTE SEKARANG|https://pemira.nurulfikri.ac.id/login}}
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
{{cta_button|VOTE SEKARANG|https://pemira.nurulfikri.ac.id/login}}
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
Portal pemilihan akan ditutup dalam beberapa jam. Pastikan Anda tidak kehilangan hak pilih Anda.
<br><br>
{{cta_button|VOTE SEKARANG (TERAKHIR)|https://pemira.nurulfikri.ac.id/login}}
<br><br>
Satu suara dari Anda sangat berharga.
<br><br>
Salam,<br>
Panitia PEMIRA STTNF`
          }
     ];

     const handleTemplateSelect = (tmpl: typeof TEMPLATES[0]) => {
          setSubject(tmpl.subject);
          setContent(tmpl.body);
          toast.success("Template diterapkan!", { position: 'bottom-center' });
     };

     useEffect(() => {
          const fetchBatches = async () => {
               try {
                    const res = await api.get("/broadcast/batches");
                    setAvailableBatches(res.data);
               } catch (error) {
                    console.error("Failed to fetch batches", error);
               }
          };

          const fetchBroadcast = async () => {
               try {
                    const res = await api.get(`/broadcast/${id}`);
                    const data = res.data;
                    setSubject(data.subject);
                    setContent(data.content);
                    if (data.filters) {
                         // No global CTA loading
                    }
                    setStatus(data.status);
                    setStats(data.stats);

                    if (data.filters) {
                         setTargetType(data.filters.target);
                         setSelectedBatches(data.filters.batches || []);
                    }
               } catch (error) {
                    console.error(error);
                    toast.error("Gagal memuat data broadcast");
                    router.push("/broadcast");
               } finally {
                    setIsLoading(false);
               }
          };

          fetchBatches();
          if (!isNew) {
               fetchBroadcast();
          }
     }, [id, isNew, api, router]);

     const handleSaveDraft = async () => {
          if (!subject) return toast.error("Subject wajib diisi");

          setIsSaving(true);
          const payload = {
               subject,
               template: content,
               cta: {
                    text: ctaText,
                    url: ctaUrl
               },
               filters: {
                    target: targetType,
                    batches: selectedBatches
               }
          };

          try {
               if (isNew) {
                    const res = await api.post("/broadcast/draft", payload);
                    toast.success("Draft berhasil dibuat");
                    router.replace(`/broadcast/${res.data.id}`);
               } else {
                    await api.put(`/broadcast/${id}`, payload);
                    toast.success("Draft berhasil disimpan");
               }
          } catch (error) {
               console.error(error);
               toast.error("Gagal menyimpan draft");
          } finally {
               setIsSaving(false);
          }
     };

     const handlePublish = async () => {
          setPublishOpen(false);
          setIsSaving(true);

          try {
               let targetId = id;

               const payload = {
                    subject,
                    template: content,
                    cta: { text: ctaText, url: ctaUrl },
                    filters: { target: targetType, batches: selectedBatches }
               };

               if (isNew) {
                    const res = await api.post("/broadcast/draft", payload);
                    targetId = res.data.id;
               } else {
                    await api.put(`/broadcast/${id}`, payload);
               }

               const res = await api.post(`/broadcast/${targetId}/publish`);
               toast.success("Broadcast berhasil dipublish!", {
                    description: `Mengirim ke ${(res.data as any).recipientCount} penerima.`
               });
               router.push("/broadcast");
          } catch (error: any) {
               console.error(error); 
               
               let msg = "Terjadi kesalahan saat mempublish broadcast.";
               
               if (error.response?.data?.message) {
                   msg = error.response.data.message;
               } else if (error.message) {
                   msg = error.message;
               }

               toast.error("Gagal publish broadcast", {
                    description: msg,
                    duration: 5000 
               });
          } finally {
               setIsSaving(false);
          }
     };

     const handleTestSend = async () => {
          if (!testEmail) return toast.error("Email tujuan wajib diisi");
          try {
               await api.post("/broadcast/test-send", {
                    email: testEmail,
                    subject,
                    template: content,
                    cta_text: ctaText,
                    cta_url: ctaUrl
               });
               toast.success(`Email tes dikirim ke ${testEmail}`);
               setTestSendOpen(false);
          } catch (error) {
               toast.error("Gagal mengirim email tes");
          }
     };

     const handlePreview = async () => {
          if (!content) return toast.error("Konten kosong");
          setPreviewOpen(true);
          try {
               const res = await api.post("/broadcast/preview", {
                    template: content,
                    cta_text: ctaText,
                    cta_url: ctaUrl
               });
               setPreviewHtml(res.data.html);
          } catch (error) {
               console.error(error);
          }
     };

     const insertPlaceholder = (text: string) => {
          setContent(prev => prev + ` {{${text}}} `);
     };

     if (isLoading) return <div className="p-8 text-center">Memuat editor...</div>;

     const isEditable = isNew || status === 'draft';

     return (
          <div className="space-y-6 max-w-6xl mx-auto pb-12">
               {/* Header */}
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                         <Button variant="ghost" size="icon" onClick={() => router.back()}>
                              <ArrowLeft className="w-4 h-4" />
                         </Button>
                         <div>
                              <h1 className="text-2xl font-bold flex items-center gap-2">
                                   {isNew ? "Buat Broadcast Baru" : "Edit Broadcast"}
                                   {!isNew && <Badge variant={status === 'draft' ? "outline" : "default"}>{status}</Badge>}
                              </h1>
                              {!isNew && status !== 'draft' && (
                                   <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                                        <span>Total: {stats?.total || 0}</span>
                                        <span className="text-green-600">Tekirim: {stats?.sent || 0}</span>
                                   </div>
                              )}
                         </div>
                    </div>
                    {isEditable && (
                         <div className="flex gap-2">
                              <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
                                   <Save className="w-4 h-4 mr-2" />
                                   {isSaving ? "Menyimpan..." : "Simpan Draft"}
                              </Button>
                              <Button onClick={() => setPublishOpen(true)} disabled={isSaving}>
                                   <Play className="w-4 h-4 mr-2" />
                                   Publish
                              </Button>
                         </div>
                    )}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Form */}
                    <div className="lg:col-span-2 space-y-6">
                         <div className="grid gap-6">
                              <Card>
                                   <CardHeader>
                                        <CardTitle>Metadata Email</CardTitle>
                                   </CardHeader>
                                   <CardContent className="space-y-4">
                                        {isEditable && (
                                             <div className="space-y-2">
                                                  <Label>Template Cepat</Label>
                                                  <div className="flex flex-wrap gap-2">
                                                       {TEMPLATES.map((t, idx) => (
                                                            <Button
                                                                 key={idx}
                                                                 variant="outline"
                                                                 size="sm"
                                                                 onClick={() => handleTemplateSelect(t)}
                                                                 className="bg-muted/50 border hover:border-primary hover:bg-primary/5 hover:text-primary transition-all text-xs"
                                                            >
                                                                 {t.label}
                                                            </Button>
                                                       ))}
                                                  </div>
                                             </div>
                                        )}
                                        <div className="space-y-2">
                                             <Label>Subjek Email</Label>
                                             <Input
                                                  placeholder="Misal: Pengingat Pemilihan Ketua BEM"
                                                  value={subject}
                                                  onChange={e => setSubject(e.target.value)}
                                                  disabled={!isEditable}
                                             />
                                        </div>
                                   </CardContent>
                              </Card>

                              <Card className="flex flex-col">
                                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                        <div className="space-y-1">
                                             <CardTitle>Konten Email</CardTitle>
                                             <CardDescription>Format HTML didukung.</CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                             <Button variant="outline" size="sm" onClick={handlePreview}>
                                                  <Code className="w-4 h-4 mr-2" /> Preview
                                             </Button>
                                             <Button variant="secondary" size="sm" onClick={() => setTestSendOpen(true)}>
                                                  <Send className="w-4 h-4 mr-2" /> Test Send
                                             </Button>
                                        </div>
                                   </CardHeader>
                                   <CardContent className="space-y-4 flex-1">
                                        <div className="space-y-2">
                                             <div className="flex justify-between items-center">
                                                  <Label className="text-xs text-muted-foreground">Variabel tersedia:</Label>
                                                  {isEditable && (
                                                       <div className="flex gap-1">
                                                            <Button size="sm" className="h-6 px-2 text-xs" variant="outline" onClick={() => insertPlaceholder('name')}>+ Name</Button>
                                                            <Button size="sm" className="h-6 px-2 text-xs" variant="outline" onClick={() => insertPlaceholder('nim')}>+ NIM</Button>
                                                            <Button size="sm" className="h-6 px-2 text-xs cursor-pointer" variant="outline" onClick={handleOpenCtaConfig}>+ Button CTA</Button>
                                                       </div>
                                                  )}
                                             </div>
                                             <Textarea
                                                  className="min-h-100 font-mono text-sm leading-relaxed"
                                                  placeholder="Tulis kode HTML atau teks biasa di sini..."
                                                  value={content}
                                                  onChange={e => setContent(e.target.value)}
                                                  disabled={!isEditable}
                                             />
                                             <div className="text-xs text-muted-foreground bg-muted p-2 rounded flex gap-2">
                                                  <Info className="w-4 h-4 shrink-0" />
                                                  <p>Header (Logo) dan Footer (Copyright & Support) akan otomatis ditambahkan oleh sistem.</p>
                                             </div>
                                        </div>
                                   </CardContent>
                              </Card>
                         </div>
                    </div>

                    {/* Sidebar Configuration */}
                    <div className="space-y-6">

                         <Card>
                              <CardHeader>
                                   <CardTitle className="text-lg">Target Penerima</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                   <RadioGroup
                                        value={targetType}
                                        onValueChange={(v: "all" | "batch" | "unvoted") => isEditable && setTargetType(v)}
                                        disabled={!isEditable}
                                   >
                                        <div
                                             className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                                             onClick={() => isEditable && setTargetType('all')}
                                        >
                                             <RadioGroupItem value="all" id="t-all" />
                                             <Label htmlFor="t-all" className="cursor-pointer flex-1 pointer-events-none">Semua Mahasiswa</Label>
                                        </div>
                                        <div
                                             className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                                             onClick={() => isEditable && setTargetType('unvoted')}
                                        >
                                             <RadioGroupItem value="unvoted" id="t-unvoted" />
                                             <Label htmlFor="t-unvoted" className="cursor-pointer flex-1 pointer-events-none">Belum Memilih Saja</Label>
                                        </div>
                                        <div
                                             className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                                             onClick={() => isEditable && setTargetType('batch')}
                                        >
                                             <RadioGroupItem value="batch" id="t-batch" />
                                             <Label htmlFor="t-batch" className="cursor-pointer flex-1 pointer-events-none">Pilih Angkatan</Label>
                                        </div>
                                   </RadioGroup>

                                   {targetType === 'batch' && (
                                        <div className="pl-6 space-y-2 border-l-2 ml-2">
                                             <Label className="text-xs text-muted-foreground">Pilih angkatan:</Label>
                                             <div className="grid grid-cols-2 gap-2">
                                                  {availableBatches.map(batch => (
                                                       <div key={batch} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                 id={`b-${batch}`}
                                                                 checked={selectedBatches.includes(batch)}
                                                                 onCheckedChange={(checked) => {
                                                                      if (!isEditable) return;
                                                                      if (checked) setSelectedBatches(prev => [...prev, batch]);
                                                                      else setSelectedBatches(prev => prev.filter(b => b !== batch));
                                                                 }}
                                                            />
                                                            <Label htmlFor={`b-${batch}`}>{batch}</Label>
                                                       </div>
                                                  ))}
                                             </div>
                                        </div>
                                   )}
                              </CardContent>
                         </Card>

                    </div>
               </div>

               {/* Dialogs */}
               <Dialog open={testSendOpen} onOpenChange={setTestSendOpen}>
                    <DialogContent>
                         <DialogHeader>
                              <DialogTitle>Kirim Test Email</DialogTitle>
                              <DialogDescription>Email ini hanya akan dikirim ke satu alamat untuk pengecekan.</DialogDescription>
                         </DialogHeader>
                         <div className="py-4">
                              <Label>Email Tujuan</Label>
                              <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="admin@example.com" />
                         </div>
                         <DialogFooter>
                              <Button onClick={handleTestSend}>Kirim</Button>
                         </DialogFooter>
                    </DialogContent>
               </Dialog>

               <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                         <DialogHeader>
                              <DialogTitle>Preview</DialogTitle>
                         </DialogHeader>
                         <div className="flex-1 border rounded bg-white overflow-auto p-4">
                              <div dangerouslySetInnerHTML={{ __html: previewHtml }} className="prose max-w-none" />
                         </div>
                    </DialogContent>
               </Dialog>

               <Dialog open={ctaConfigOpen} onOpenChange={setCtaConfigOpen}>
                    <DialogContent>
                         <DialogHeader>
                              <DialogTitle>Konfigurasi Tombol Aksi (CTA)</DialogTitle>
                              <DialogDescription>
                                   Sesuaikan teks dan link tujuan tombol yang akan disisipkan.
                              </DialogDescription>
                         </DialogHeader>
                         <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                   <Label>Teks Tombol</Label>
                                   <Input value={tempCtaText} onChange={e => setTempCtaText(e.target.value)} placeholder="Misal: VOTE SEKARANG" />
                              </div>
                              <div className="space-y-2">
                                   <Label>Link Tujuan</Label>
                                   <Input value={tempCtaUrl} onChange={e => setTempCtaUrl(e.target.value)} placeholder="https://..." />
                              </div>
                         </div>
                         <DialogFooter>
                              <Button variant="outline" onClick={() => setCtaConfigOpen(false)}>Batal</Button>
                              <Button onClick={handleSaveCtaConfig}>Simpan & Sisipkan</Button>
                         </DialogFooter>
                    </DialogContent>
               </Dialog>

               <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
                    <AlertDialogContent>
                         <AlertDialogHeader>
                              <AlertDialogTitle>Publish Broadcast Ini?</AlertDialogTitle>
                              <AlertDialogDescription>
                                   Pesan akan dikirim ke <strong>{targetType === 'all' ? 'SEMUA' : targetType === 'unvoted' ? 'YANG BELUM MEMILIH' : 'ANGKATAN TERPILIH'}</strong>.
                                   <br />
                                   Pastikan konten sudah benar. Aksi ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={handlePublish}>Ya, Kirim Sekarang</AlertDialogAction>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>
          </div>
     );
}
