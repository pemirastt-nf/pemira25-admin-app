/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
     Table,
     TableBody,
     TableCell,
     TableHead,
     TableHeader,
     TableRow,
} from "@/components/ui/table";
import {
     Dialog,
     DialogContent,
     DialogDescription,
     DialogFooter,
     DialogHeader,
     DialogTitle,
     DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, RotateCcw } from "lucide-react";

interface SMTPConfig {
     id: number;
     providerName: string;
     host: string;
     port: number;
     secure: boolean;
     user: string;
     fromEmail?: string;
     priority: number;
     dailyLimit: number;
     currentUsage: number;
}

export default function SMTPPage() {
     const [configs, setConfigs] = useState<SMTPConfig[]>([]);
     const [loading, setLoading] = useState(true);
     const [open, setOpen] = useState(false);
     const [editingConfig, setEditingConfig] = useState<SMTPConfig | null>(null);

     // Form state
     const [formData, setFormData] = useState({
          providerName: "",
          host: "",
          port: 587,
          secure: false,
          user: "",
          pass: "",
          fromEmail: "",
          priority: 1,
          dailyLimit: 100,
     });

     const fetchConfigs = async () => {
          try {
               setLoading(true);
               const res = await api.get('/smtp');
               if (res.data.success) {
                    setConfigs(res.data.data);
               } else {
                    toast.error("Gagal memuat konfigurasi SMTP");
               }
          } catch (error) {
               toast.error("Gagal memuat konfigurasi SMTP");
          } finally {
               setLoading(false);
          }
     };

     useEffect(() => {
          fetchConfigs();
     }, []);

     const handleOpenDialog = (config?: SMTPConfig) => {
          if (config) {
               setEditingConfig(config);
               setFormData({
                    providerName: config.providerName,
                    host: config.host,
                    port: config.port,
                    secure: config.secure,
                    user: config.user,
                    pass: "",
                    fromEmail: config.fromEmail || "",
                    priority: config.priority,
                    dailyLimit: config.dailyLimit,
               });
          } else {
               setEditingConfig(null);
               setFormData({
                    providerName: "",
                    host: "",
                    port: 587,
                    secure: false,
                    user: "",
                    pass: "",
                    fromEmail: "",
                    priority: 1,
                    dailyLimit: 100,
               });
          }
          setOpen(true);
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          try {
               if (editingConfig) {
                    const updateData = { ...formData };
                    if (!updateData.pass) delete (updateData as any).pass;

                    await api.put(`/smtp/${editingConfig.id}`, updateData);
                    toast.success("Konfigurasi berhasil diperbarui");
               } else {
                    if (!formData.pass) {
                         toast.error("Password wajib diisi untuk konfigurasi baru");
                         return;
                    }
                    await api.post('/smtp', formData);
                    toast.success("Konfigurasi berhasil ditambahkan");
               }
               setOpen(false);
               fetchConfigs();
          } catch (error) {
               toast.error("Gagal menyimpan konfigurasi");
          }
     };

     const handleDelete = async (id: number) => {
          if (!confirm("Apakah anda yakin ingin menghapus konfigurasi ini?")) return;
          try {
               await api.delete(`/smtp/${id}`);
               toast.success("Konfigurasi berhasil dihapus");
               fetchConfigs();
          } catch (error) {
               toast.error("Gagal menghapus konfigurasi");
          }
     };

     const handleResetUsage = async (id: number) => {
          try {
               await api.post(`/smtp/${id}/reset`);
               toast.success("Usage berhasil direset");
               fetchConfigs();
          } catch (error) {
               toast.error("Gagal mereset usage");
          }
     };

     return (
          <div className="space-y-6">
               <div className="flex justify-between items-center">
                    <div>
                         <h2 className="text-3xl font-bold tracking-tight">SMTP Configuration</h2>
                         <p className="text-muted-foreground">Manage SMTP servers for email broadcasting.</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                         <Plus className="mr-2 h-4 w-4" /> Add Configuration
                    </Button>
               </div>

               <Card>
                    <CardHeader>
                         <CardTitle>configurations</CardTitle>
                         <CardDescription>
                              Daftar konfigurasi SMTP yang aktif dengan prioritas dan limit hariannya.
                         </CardDescription>
                    </CardHeader>
                    <CardContent>
                         {loading ? (
                              <div className="flex justify-center p-8">
                                   <Loader2 className="h-8 w-8 animate-spin" />
                              </div>
                         ) : (
                              <Table>
                                   <TableHeader>
                                        <TableRow>
                                             <TableHead>Priority</TableHead>
                                             <TableHead>Host</TableHead>
                                             <TableHead>User</TableHead>
                                             <TableHead>Port</TableHead>
                                             <TableHead>Secure</TableHead>
                                             <TableHead>Usage / Limit</TableHead>
                                             <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                        {configs.map((config) => (
                                             <TableRow key={config.id}>
                                                  <TableCell>{config.priority}</TableCell>
                                                  <TableCell className="font-medium">
                                                       <div>{config.providerName}</div>
                                                       <div className="text-xs text-muted-foreground">{config.host}</div>
                                                  </TableCell>
                                                  <TableCell className="text-sm">
                                                       <div>{config.user}</div>
                                                  </TableCell>
                                                  <TableCell>{config.port}</TableCell>
                                                  <TableCell>{config.secure ? "Yes" : "No"}</TableCell>
                                                  <TableCell>
                                                       <div className="flex items-center gap-2">
                                                            <span className={config.currentUsage >= config.dailyLimit ? "text-red-500 font-bold" : ""}>
                                                                 {config.currentUsage}
                                                            </span>
                                                            <span className="text-muted-foreground">/ {config.dailyLimit}</span>
                                                       </div>
                                                  </TableCell>
                                                  <TableCell className="text-right">
                                                       <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="icon" onClick={() => handleResetUsage(config.id)} title="Reset Usage">
                                                                 <RotateCcw className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="outline" size="icon" onClick={() => handleOpenDialog(config)} title="Edit">
                                                                 <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="destructive" size="icon" onClick={() => handleDelete(config.id)} title="Delete">
                                                                 <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                       </div>
                                                  </TableCell>
                                             </TableRow>
                                        ))}
                                        {configs.length === 0 && (
                                             <TableRow>
                                                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                       No SMTP configurations found.
                                                  </TableCell>
                                             </TableRow>
                                        )}
                                   </TableBody>
                              </Table>
                         )}
                    </CardContent>
               </Card>

               <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-125">
                         <DialogHeader>
                              <DialogTitle>{editingConfig ? "Edit Configuration" : "Add Configuration"}</DialogTitle>
                              <DialogDescription>
                                   Configure SMTP server details. Password is encrypted.
                              </DialogDescription>
                         </DialogHeader>
                         <form onSubmit={handleSubmit} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-2 col-span-2">
                                        <Label htmlFor="providerName">Provider Name (Label)</Label>
                                        <Input
                                             id="providerName"
                                             placeholder="e.g. Gmail Primary, Brevo Marketing"
                                             value={formData.providerName}
                                             onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                                             required
                                        />
                                   </div>
                                   <div className="space-y-2">
                                        <Label htmlFor="host">Host</Label>
                                        <Input
                                             id="host"
                                             placeholder="smtp.gmail.com"
                                             value={formData.host}
                                             onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                                             required
                                        />
                                   </div>
                                   <div className="space-y-2">
                                        <Label htmlFor="port">Port</Label>
                                        <Input
                                             id="port"
                                             type="number"
                                             placeholder="587"
                                             value={formData.port}
                                             onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                                             required
                                        />
                                   </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                   <Checkbox
                                        id="secure"
                                        checked={formData.secure}
                                        onCheckedChange={(checked) => setFormData({ ...formData, secure: checked as boolean })}
                                   />
                                   <Label htmlFor="secure">Secure Connection (TLS/SSL)</Label>
                              </div>

                              <div className="space-y-2">
                                   <Label htmlFor="user">Username (SMTP Auth)</Label>
                                   <Input
                                        id="user"
                                        placeholder="your-email@gmail.com"
                                        value={formData.user}
                                        onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                                        required
                                   />
                              </div>

                              <div className="space-y-2">
                                   <Label htmlFor="fromEmail">From Email <span className="text-muted-foreground font-normal">(opsional, override SMTP_FROM global)</span></Label>
                                   <Input
                                        id="fromEmail"
                                        placeholder='"PEMIRA IM STTNF" <noreply@pemirasttnf.web.id>'
                                        value={formData.fromEmail}
                                        onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                                   />
                                   <p className="text-xs text-muted-foreground">Jika diisi, email akan dikirim dari alamat ini. Gunakan untuk Gmail (harus sama dengan username) atau domain khusus per-provider.</p>
                              </div>

                              <div className="space-y-2">
                                   <Label htmlFor="pass">Password {editingConfig && "(Leave empty to keep unchanged)"}</Label>
                                   <Input
                                        id="pass"
                                        type="password"
                                        placeholder="App Password"
                                        value={formData.pass}
                                        onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                                        required={!editingConfig}
                                   />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-2">
                                        <Label htmlFor="priority">Priority</Label>
                                        <Input
                                             id="priority"
                                             type="number"
                                             placeholder="1"
                                             value={formData.priority}
                                             onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                             required
                                        />
                                        <p className="text-xs text-muted-foreground">Lower number = higher priority</p>
                                   </div>
                                   <div className="space-y-2">
                                        <Label htmlFor="dailyLimit">Daily Limit</Label>
                                        <Input
                                             id="dailyLimit"
                                             type="number"
                                             placeholder="100"
                                             value={formData.dailyLimit}
                                             onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) })}
                                             required
                                        />
                                   </div>
                              </div>

                              <DialogFooter>
                                   <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                        Cancel
                                   </Button>
                                   <Button type="submit">
                                        {editingConfig ? "Save Changes" : "Create Configuration"}
                                   </Button>
                              </DialogFooter>
                         </form>
                    </DialogContent>
               </Dialog>
          </div>
     );
}
