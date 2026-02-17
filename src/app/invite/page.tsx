/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

function InviteContent() {
     const router = useRouter();
     const searchParams = useSearchParams();
     const token = searchParams.get('token');
     const api = useApi();

     const [loading, setLoading] = useState(true);
     const [inviteData, setInviteData] = useState<{ email: string; role: string; name?: string } | null>(null);
     const [error, setError] = useState("");

     const [form, setForm] = useState({
          password: "",
          confirmPassword: ""
     });
     
     const [showPassword, setShowPassword] = useState(false);
     const [showConfirmPassword, setShowConfirmPassword] = useState(false);
     const [isPasswordFocused, setIsPasswordFocused] = useState(false);
     const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

     const [submitting, setSubmitting] = useState(false);
     const [success, setSuccess] = useState(false);

     useEffect(() => {
          if (!token) {
               setLoading(false);
               setError("Token undangan tidak ditemukan.");
               return;
          }

          const verifyToken = async () => {
               try {
                    const res = await api.get(`/invite/verify/${token}`);
                    if (res.data.isValid) {
                         setInviteData(res.data);
                    } else {
                         setError("Token undangan tidak valid atau sudah kadaluarsa.");
                    }
               } catch (err: any) {
                    setError(err.response?.data?.error || "Gagal memverifikasi token.");
               } finally {
                    setLoading(false);
               }
          };

          verifyToken();
     }, [token, api]);

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (form.password !== form.confirmPassword) {
               toast.error("Konfirmasi password tidak cocok");
               return;
          }
          if (form.password.length < 6) {
               toast.error("Password minimal 6 karakter");
               return;
          }

          setSubmitting(true);
          try {
               await api.post('/invite/accept', {
                    token,
                    // name is no longer sent from frontend form as it exists in student data
                    password: form.password
               });
               setSuccess(true);
               toast.success("Akun berhasil diaktifkan!");
               setTimeout(() => {
                    router.push('/login');
               }, 3000);
          } catch (err: any) {
               toast.error(err.response?.data?.error || "Gagal membuat akun.");
          } finally {
               setSubmitting(false);
          }
     };

     if (loading) {
          return (
               <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Memverifikasi undangan...</p>
               </div>
          );
     }

     if (success) {
          return (
               <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-primary via-secondary to-primary" />
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

                    <div className="w-full max-w-sm space-y-6 relative z-10">
                         <div className="flex flex-col items-center space-y-4 text-center">
                              <div className="relative h-24 w-24 overflow-hidden drop-shadow-lg transition-transform hover:scale-105 duration-300">
                                   <Image
                                        src="/pemira-logov2.png"
                                        alt="PEMIRA Logo"
                                        fill
                                        className="object-contain rounded-full"
                                        priority
                                   />
                              </div>
                              <div className="space-y-1">
                                   <h1 className="text-2xl font-bold tracking-tight text-primary">
                                        PEMIRA IM STTNF
                                   </h1>
                                   <p className="text-sm text-muted-foreground">
                                        Aktivasi Berhasil
                                   </p>
                              </div>
                         </div>

                         <Card className="shadow-xl bg-card/80 backdrop-blur-sm border-green-100">
                              <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-4">
                                   <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2 animate-bounce">
                                        <CheckCircle2 className="h-8 w-8" />
                                   </div>
                                   <h2 className="text-2xl font-bold text-green-700">Akun Berhasil Dibuat!</h2>
                                   <p className="text-muted-foreground max-w-xs">
                                        Selamat datang. Anda akan dialihkan ke halaman login dalam beberapa detik.
                                   </p>
                                   <Button asChild className="mt-4 w-full bg-green-600 hover:bg-green-700">
                                        <Link href="/login">Masuk Sekarang</Link>
                                   </Button>
                              </CardContent>
                         </Card>

                         <div className="text-center text-xs text-muted-foreground">
                              <p>&copy; {new Date().getFullYear()} PEMIRA IM STT Terpadu Nurul Fikri</p>
                         </div>
                    </div>
               </div>
          );
     }

     return (
          <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
               {/* Decorative Elements */}
               <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-primary via-secondary to-primary" />
               <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
               <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

               <div className="w-full max-w-sm space-y-6 relative z-10">
                    <div className="flex flex-col items-center space-y-4 text-center">
                         <div className="relative h-24 w-24 overflow-hidden drop-shadow-lg transition-transform hover:scale-105 duration-300">
                              <Image
                                   src="/pemira-logov2.png"
                                   alt="PEMIRA Logo"
                                   fill
                                   className="object-contain rounded-full"
                                   priority
                              />
                         </div>
                         <div className="space-y-1">
                              <h1 className="text-2xl font-bold tracking-tight text-primary">
                                   PEMIRA IM STTNF
                              </h1>
                              <p className="text-sm text-muted-foreground">
                                   Aktivasi Akun Panitia
                              </p>
                         </div>
                    </div>

                    <Card className="border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
                         <CardHeader className="space-y-1">
                              <CardTitle className="text-xl">Buat Password</CardTitle>
                              <CardDescription>
                                   Silakan atur password untuk akun Anda.
                              </CardDescription>
                         </CardHeader>
                         <CardContent>
                              {error ? (
                                   <Alert variant="destructive" className="mb-6">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                   </Alert>
                              ) : (
                                   <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                             <Label>Email Terdaftar</Label>
                                             <Input 
                                                  value={inviteData?.email || ""} 
                                                  disabled 
                                                  className="bg-muted/50 border-primary/20" 
                                             />
                                        </div>
                                        <div className="space-y-2">
                                             <Label htmlFor="password">Password Baru</Label>
                                             <div className="relative">
                                                  <Input
                                                       id="password"
                                                       type={showPassword ? "text" : "password"}
                                                       placeholder="Minimal 6 karakter"
                                                       value={form.password}
                                                       onChange={(e) => setForm({ ...form, password: e.target.value })}
                                                       onFocus={() => setIsPasswordFocused(true)}
                                                       onBlur={() => setIsPasswordFocused(false)}
                                                       required
                                                       minLength={6}
                                                       className="bg-background/50 border-primary/20 focus:border-primary focus:ring-primary/20 pr-10"
                                                  />
                                                  <button
                                                       type="button"
                                                       className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-opacity duration-200 ${isPasswordFocused && form.password.length > 0 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                                                       onClick={() => setShowPassword(!showPassword)}
                                                       onMouseDown={(e) => e.preventDefault()}
                                                       tabIndex={-1}
                                                  >
                                                       {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                  </button>
                                             </div>
                                        </div>
                                        <div className="space-y-2">
                                             <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                                             <div className="relative">
                                                  <Input
                                                       id="confirmPassword"
                                                       type={showConfirmPassword ? "text" : "password"}
                                                       placeholder="Ulangi password"
                                                       value={form.confirmPassword}
                                                       onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                                       onFocus={() => setIsConfirmPasswordFocused(true)}
                                                       onBlur={() => setIsConfirmPasswordFocused(false)}
                                                       required
                                                       className="bg-background/50 border-primary/20 focus:border-primary focus:ring-primary/20 pr-10"
                                                  />
                                                  <button
                                                       type="button"
                                                       className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-opacity duration-200 ${isConfirmPasswordFocused && form.confirmPassword.length > 0 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                                                       onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                       onMouseDown={(e) => e.preventDefault()}
                                                       tabIndex={-1}
                                                  >
                                                       {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                  </button>
                                             </div>
                                        </div>

                                        <Button type="submit" className="w-full mt-2" disabled={submitting}>
                                             {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                             Aktifkan Akun
                                        </Button>
                                   </form>
                              )}
                         </CardContent>
                         {error && (
                              <CardFooter className="justify-center">
                                   <Button variant="link" asChild>
                                        <Link href="/login">Kembali ke Login</Link>
                                   </Button>
                              </CardFooter>
                         )}
                    </Card>
                    <div className="text-center text-xs text-muted-foreground">
                         <p>&copy; {new Date().getFullYear()} PEMIRA IM STT Terpadu Nurul Fikri</p>
                    </div>
               </div>
          </div>
     );
}

export default function InvitePageWrapper() {
     return (
          <Suspense fallback={
               <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
               </div>
          }>
               <InviteContent />
          </Suspense>
     );
}