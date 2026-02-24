"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, X, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
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

interface VotingSchedules {
     dates: string[];   // YYYY-MM-DD
     startTime: string; // HH:MM
     endTime: string;   // HH:MM
}

export default function SettingsPage() {
     const [loading, setLoading] = useState(false);
     const [settings, setSettings] = useState({
          isVoteOpen: false,
          announcementMessage: "",
          showAnnouncement: false,
          allowOtpEmail: true,
          allowBroadcastEmail: true,
          isWinnerPublished: false
     });

     const [schedules, setSchedules] = useState<VotingSchedules>({
          dates: [],
          startTime: "08:00",
          endTime: "16:00",
     });

     const [isWinnerDialogOpen, setIsWinnerDialogOpen] = useState(false);

     const fetchSettings = useCallback(async () => {
          try {
               const res = await api.get('/settings');
               const data = res.data;
               setSettings({
                    isVoteOpen: data.isVoteOpen,
                    announcementMessage: data.announcementMessage || "",
                    showAnnouncement: data.showAnnouncement,
                    allowOtpEmail: data.allowOtpEmail,
                    allowBroadcastEmail: data.allowBroadcastEmail,
                    isWinnerPublished: data.isWinnerPublished || false,
               });
               if (data.votingSchedules) {
                    setSchedules(data.votingSchedules);
               }
          } catch (error) {
               console.error("Fetch settings error:", error);
               toast.error("Gagal mengambil pengaturan sistem. Pastikan backend berjalan.");
          }
     }, []);

     useEffect(() => {
          fetchSettings();
     }, [fetchSettings]);

     const handleSave = async () => {
          if (schedules.dates.length > 0) {
               if (!schedules.startTime || !schedules.endTime) {
                    toast.error("Jam Mulai dan Jam Selesai harus diisi.");
                    return;
               }
               if (schedules.startTime >= schedules.endTime) {
                    toast.error("Jam Selesai harus lebih besar dari Jam Mulai.");
                    return;
               }
          }

          setLoading(true);
          try {
               await api.put('/settings', {
                    ...settings,
                    startDate: null,
                    endDate: null,
                    votingSchedules: schedules.dates.length > 0 ? schedules : null,
               });
               toast.success("Pengaturan berhasil disimpan");
          } catch (error) {
               console.error("Save settings error:", error);
               toast.error("Gagal menyimpan pengaturan.");
          } finally {
               setLoading(false);
          }
     };

     const selectedDates = schedules.dates.map((d) => parseISO(d));

     const handleCalendarSelect = (days: Date[] | undefined) => {
          const sorted = (days || [])
               .map((d) => {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
               })
               .sort();
          setSchedules((prev) => ({ ...prev, dates: sorted }));
     };

     const removeDate = (dateStr: string) => {
          setSchedules((prev) => ({ ...prev, dates: prev.dates.filter((d) => d !== dateStr) }));
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

                              {/* Multi-date Schedule */}
                              <div className="space-y-4">
                                   <div className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                        <Label className="text-base">Jadwal Voting (Multiple Hari)</Label>
                                   </div>
                                   <p className="text-sm text-muted-foreground -mt-2">
                                        Pilih satu atau beberapa tanggal. Jam mulai dan selesai berlaku sama untuk semua hari.
                                   </p>

                                   <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="border rounded-lg p-1 w-fit">
                                             <Calendar
                                                  mode="multiple"
                                                  selected={selectedDates}
                                                  onSelect={handleCalendarSelect}
                                                  numberOfMonths={2}
                                                  className="rounded-md"
                                             />
                                        </div>

                                        <div className="flex-1 space-y-4">
                                             <div className="grid grid-cols-2 gap-4">
                                                  <div className="space-y-2">
                                                       <Label>Jam Mulai</Label>
                                                       <Input
                                                            type="time"
                                                            value={schedules.startTime}
                                                            onChange={(e) => setSchedules((p) => ({ ...p, startTime: e.target.value }))}
                                                       />
                                                  </div>
                                                  <div className="space-y-2">
                                                       <Label>Jam Selesai</Label>
                                                       <Input
                                                            type="time"
                                                            value={schedules.endTime}
                                                            onChange={(e) => setSchedules((p) => ({ ...p, endTime: e.target.value }))}
                                                       />
                                                  </div>
                                             </div>

                                             <div className="space-y-2">
                                                  <Label>Tanggal Dipilih ({schedules.dates.length})</Label>
                                                  {schedules.dates.length === 0 ? (
                                                       <p className="text-sm text-muted-foreground">Belum ada tanggal dipilih.</p>
                                                  ) : (
                                                       <div className="flex flex-wrap gap-2">
                                                            {schedules.dates.map((d) => (
                                                                 <Badge key={d} variant="secondary" className="gap-1 pr-1">
                                                                      {format(parseISO(d), "dd MMM yyyy", { locale: localeId })}
                                                                      <button
                                                                           onClick={() => removeDate(d)}
                                                                           className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                                                      >
                                                                           <X className="h-3 w-3" />
                                                                      </button>
                                                                 </Badge>
                                                            ))}
                                                       </div>
                                                  )}
                                             </div>

                                             {schedules.dates.length > 0 && (
                                                  <div className="rounded-lg bg-muted/50 border p-3 text-sm text-muted-foreground space-y-1">
                                                       <p className="font-medium text-foreground">Ringkasan Jadwal</p>
                                                       {schedules.dates.map((d) => (
                                                            <p key={d}>
                                                                 {format(parseISO(d), "EEEE, dd MMMM yyyy", { locale: localeId })}
                                                                 {" — "}{schedules.startTime} s/d {schedules.endTime} WIB
                                                            </p>
                                                       ))}
                                                  </div>
                                             )}
                                        </div>
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

                    {/* Winner Announcement Card */}
                    <Card className="border-primary/50 bg-primary/5">
                         <CardHeader>
                              <CardTitle className="text-primary">Pengumuman Pemenang PEMIRA</CardTitle>
                              <CardDescription>Publikasikan hasil akhir dan pemenang ke halaman mahasiswa.</CardDescription>
                         </CardHeader>
                         <CardContent className="space-y-6">
                              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-background/50 p-4">
                                   <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">Publikasikan Pemenang</Label>
                                        <p className="text-sm text-muted-foreground">
                                             Jika diaktifkan, kandidat pemenang akan terpampang jelas di halaman depan mahasiswa.
                                        </p>
                                   </div>
                                   <Switch
                                        checked={settings.isWinnerPublished}
                                        onCheckedChange={(checked) => {
                                             if (checked) {
                                                  setIsWinnerDialogOpen(true);
                                             } else {
                                                  setSettings({ ...settings, isWinnerPublished: false });
                                             }
                                        }}
                                   />
                              </div>

                              <AlertDialog open={isWinnerDialogOpen} onOpenChange={setIsWinnerDialogOpen}>
                                   <AlertDialogContent>
                                        <AlertDialogHeader>
                                             <AlertDialogTitle>Konfirmasi Publikasi Pemenang</AlertDialogTitle>
                                             <AlertDialogDescription>
                                                  Apakah Anda yakin ingin mempublikasikan pemenang ke publik? Pastikan semua rekapitulasi suara sudah final dan tervalidasi. Tindakan ini akan langsung terlihat oleh mahasiswa di halaman depan.
                                             </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                             <AlertDialogCancel>Batal</AlertDialogCancel>
                                             <AlertDialogAction onClick={() => {
                                                  setSettings({ ...settings, isWinnerPublished: true });
                                             }}>
                                                  Ya, Publikasikan
                                             </AlertDialogAction>
                                        </AlertDialogFooter>
                                   </AlertDialogContent>
                              </AlertDialog>
                         </CardContent>
                    </Card>

                    <Button size="lg" onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                         {loading ? "Menyimpan..." : <><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</>}
                    </Button>
               </div>
          </div>
     );
}

