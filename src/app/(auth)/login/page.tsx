/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
     const { login, user, loading: authLoading } = useAuth();
     const api = useApi();
     const [loading, setLoading] = useState(false);
     const [email, setEmail] = useState("");
     const [password, setPassword] = useState("");
     const [showPassword, setShowPassword] = useState(false);
     const [isPasswordFocused, setIsPasswordFocused] = useState(false);
     const [error, setError] = useState("");
     const router = useRouter();

     // If already authenticated, redirect to dashboard
     useEffect(() => {
          if (!authLoading && user) {
               router.push("/");
          }
     }, [authLoading, user, router]);

     const handleLogin = async (e: React.FormEvent) => {
          e.preventDefault();
          setLoading(true);
          setError("");

          try {
               const res = await api.post('/auth/admin-login', { email, password });
               login(res.data.token, res.data.user);
          } catch (err: any) {
               console.error(err);
               setError(err.response?.data?.message || err.message || "Login failed");
          } finally {
               setLoading(false);
          }
     };

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
                                   Admin Portal Login
                              </p>
                         </div>
                    </div>

                    <Card className="border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
                         <CardHeader className="space-y-1">
                              <CardTitle className="text-xl">Sign In</CardTitle>
                              <CardDescription>
                                   Masukkan kredensial Anda untuk mengakses dashboard.
                              </CardDescription>
                         </CardHeader>
                         <form onSubmit={handleLogin}>
                              <CardContent className="grid gap-4">
                                   <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                             id="email"
                                             type="email"
                                             placeholder="admin@student.nurulfikri.ac.id"
                                             value={email}
                                             onChange={(e) => setEmail(e.target.value)}
                                             required
                                             className="bg-background/50 border-primary/20 focus:border-primary focus:ring-primary/20"
                                        />
                                   </div>
                                   <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                             <Input
                                                  id="password"
                                                  type={showPassword ? "text" : "password"}
                                                  placeholder="••••••••"
                                                  value={password}
                                                  onChange={(e) => setPassword(e.target.value)}
                                                  onFocus={() => setIsPasswordFocused(true)}
                                                  onBlur={() => setIsPasswordFocused(false)}
                                                  required
                                                  className="bg-background/50 border-primary/20 focus:border-primary focus:ring-primary/20 pr-10"
                                             />
                                             <button
                                                  type="button"
                                                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-opacity duration-200 ${isPasswordFocused && password.length > 0 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                                                  onClick={() => setShowPassword(!showPassword)}
                                                  onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
                                                  tabIndex={-1}
                                             >
                                                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                             </button>
                                        </div>
                                   </div>
                                   {error && (
                                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
                                             <span className="font-medium">Error:</span> {error}
                                        </div>
                                   )}
                              </CardContent>
                              <CardFooter>
                                   <Button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md transition-all hover:-translate-y-px"
                                        disabled={loading}
                                   >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Sign In to Dashboard
                                   </Button>
                              </CardFooter>
                         </form>
                    </Card>

                    <div className="text-center text-xs text-muted-foreground">
                         <p>&copy; {new Date().getFullYear()} PEMIRA IM STT Terpadu Nurul Fikri</p>
                    </div>
               </div>
          </div>
     );
}
