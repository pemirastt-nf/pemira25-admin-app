"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { api } from "@/lib/api";

export default function SettingsPage() {
     const [loading, setLoading] = useState(false);
     const [settings, setSettings] = useState({
          isVoteOpen: false,
          startDate: "",
          endDate: "",
          announcementMessage: "",
          showAnnouncement: false,
          allowOtpEmail: true,
          allowBroadcastEmail: true
     });

     const fetchSettings = useCallback(async () => {
          try {
               const res = await api.get('/settings');
               setSettings({
                    ...res.data,
                    startDate: res.data.startDate ? new Date(res.data.startDate).toISOString().slice(0, 16) : "",
                    endDate: res.data.endDate ? new Date(res.data.endDate).toISOString().slice(0, 16) : "",
               });
          } catch (error) {
               console.error("Fetch settings error:", error);
               toast.error("Gagal mengambil pengaturan sistem. Pastikan backend berjalan.");
          }
     }, []);

     useEffect(() => {
          fetchSettings();
     }, [fetchSettings]);

     const handleSave = async () => {
          if ((settings.startDate && !settings.endDate) || (!settings.startDate && settings.endDate)) {
               toast.error("Waktu Mulai dan Waktu Selesai harus diisi keduanya atau dikosongkan keduanya.");
               return;
          }

          if (settings.startDate && settings.endDate) {
               const start = new Date(settings.startDate);
               const end = new Date(settings.endDate);
               if (end <= start) {
                    toast.error("Waktu Selesai harus lebih besar dari Waktu Mulai.");
                    return;
               }
          }

          setLoading(true);
          try {
               await api.put('/settings', settings);
               toast.success("Pengaturan berhasil disimpan");
          } catch (error) {
               console.error("Save settings error:", error);
               toast.error("Gagal menyimpan pengaturan.");
          } finally {
               setLoading(false);
          }
     };

     return (
          <div className="flex-1 space-y-6 pt-6">
               <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
               </div>


               <div className="grid gap-6">
                    {/* Voting Status Card */}
                    <Card>
                         <CardHeader>
                              <CardTitle>Status Pemilihan</CardTitle>
                              <CardDescription>Atur status aktif pemilihan umum raya.</CardDescription>
                         </CardHeader>
                         <CardContent className="space-y-6">
                              <div className="flex items-center justify-between rounded-lg border p-4">
                                   <div className="space-y-0.5">
                                        <Label className="text-base">Buka Voting (Manual)</Label>
                                        <p className="text-sm text-muted-foreground">
                                             Aktifkan secara manual. Jika mati, sistem akan mengikuti jadwal (jika diisi).
                                        </p>
                                   </div>
                                   <Switch
                                        checked={settings.isVoteOpen}
                                        onCheckedChange={(checked) => setSettings({ ...settings, isVoteOpen: checked })}
                                   />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="space-y-2">
                                        <Label>Waktu Mulai</Label>
                                        <Input
                                             type="datetime-local"
                                             value={settings.startDate}
                                             onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
                                        />
                                   </div>
                                   <div className="space-y-2">
                                        <Label>Waktu Selesai</Label>
                                        <Input
                                             type="datetime-local"
                                             value={settings.endDate}
                                             onChange={(e) => setSettings({ ...settings, endDate: e.target.value })}
                                        />
                                   </div>
                              </div>
                         </CardContent>
                    </Card>

                    {/* Announcement Card */}
                    <Card>
                         <CardHeader>
                              <CardTitle>Pengumuman & Banner</CardTitle>
                              <CardDescription>Tampilkan pesan penting di bagian atas website pengguna.</CardDescription>
                         </CardHeader>
                         <CardContent className="space-y-6">
                              <div className="flex items-center justify-between rounded-lg border p-4">
                                   <div className="space-y-0.5">
                                        <Label className="text-base">Tampilkan Banner</Label>
                                        <p className="text-sm text-muted-foreground">
                                             Tampilkan banner pengumuman di halaman utama.
                                        </p>
                                   </div>
                                   <Switch
                                        checked={settings.showAnnouncement}
                                        onCheckedChange={(checked) => setSettings({ ...settings, showAnnouncement: checked })}
                                   />
                              </div>

                              <div className="grid gap-2">
                                   <Label htmlFor="announcement">Isi Pengumuman</Label>
                                   <Input
                                        id="announcement"
                                        placeholder="Contoh: Pemilihan sedang berlangsung hingga pukul 16.00 WIB"
                                        value={settings.announcementMessage || ""}
                                        onChange={(e) => setSettings({ ...settings, announcementMessage: e.target.value })}
                                   />
                              </div>
                         </CardContent>
                    </Card>

                    {/* Email Configuration Card */}
                    <Card>
                         <CardHeader>
                              <CardTitle>Konfigurasi Email</CardTitle>
                              <CardDescription>Kontrol pengiriman email OTP dan Broadcast.</CardDescription>
                         </CardHeader>
                         <CardContent className="space-y-6">
                              <div className="flex items-center justify-between rounded-lg border p-4">
                                   <div className="space-y-0.5">
                                        <Label className="text-base">Izinkan Email OTP</Label>
                                        <p className="text-sm text-muted-foreground">
                                             Jika dimatikan, mahasiswa tidak bisa request OTP via email.
                                        </p>
                                   </div>
                                   <Switch
                                        checked={settings.allowOtpEmail}
                                        onCheckedChange={(checked) => setSettings({ ...settings, allowOtpEmail: checked })}
                                   />
                              </div>

                              <div className="flex items-center justify-between rounded-lg border p-4">
                                   <div className="space-y-0.5">
                                        <Label className="text-base">Izinkan Email Broadcast</Label>
                                        <p className="text-sm text-muted-foreground">
                                             Jika dimatikan, admin tidak bisa mengirim broadcast email baru.
                                        </p>
                                   </div>
                                   <Switch
                                        checked={settings.allowBroadcastEmail}
                                        onCheckedChange={(checked) => setSettings({ ...settings, allowBroadcastEmail: checked })}
                                   />
                              </div>
                         </CardContent>
                    </Card>

                    <Button size="lg" onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                         {loading ? "Menyimpan..." : <><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</>}
                    </Button>
               </div>
          </div>
     );
}
