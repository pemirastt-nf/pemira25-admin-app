/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Command } from "lucide-react";

export default function LoginPage() {
     const { login, user, loading: authLoading } = useAuth();
     const api = useApi();
     const [loading, setLoading] = useState(false);
     const [email, setEmail] = useState("");
     const [password, setPassword] = useState("");
     const [error, setError] = useState("");
     const router = useRouter();

     // If already authenticated, redirect to dashboard
     if (!authLoading && user) {
          console.log("LOGIN PAGE: User already authenticated, redirecting to /");
          router.push("/");
     }

     const handleLogin = async (e: React.FormEvent) => {
          e.preventDefault();
          console.log("LOGIN: Button clicked");
          setLoading(true);
          setError("");

          try {
               console.log("LOGIN: Attempting to post to /auth/admin-login");
               console.log("LOGIN: with email", email);
               console.log("LOGIN: API Base URL:", api.defaults.baseURL);

               const res = await api.post('/auth/admin-login', { email, password });

               console.log("LOGIN: Success", res.data);
               login(res.data.token, res.data.user);
          } catch (err: any) {
               console.error("LOGIN: Error caught", err);
               setError(err.response?.data?.message || err.message || "Login failed");
          } finally {
               setLoading(false);
          }
     };

     return (
          <div className="flex h-screen w-full items-center justify-center bg-muted/40 dark:bg-zinc-950">
               <Card className="w-full max-w-sm border-border/40 shadow-lg sm:w-100">
                    <CardHeader className="space-y-1 text-center">
                         <div className="flex justify-center mb-4">
                              <div className="rounded-full bg-primary/10 p-3">
                                   <Command className="h-6 w-6 text-primary" />
                              </div>
                         </div>
                         <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
                         <CardDescription>
                              Enter your credentials to access the dashboard.
                         </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                         <CardContent className="grid gap-4">
                              <div className="grid gap-2">
                                   <Label htmlFor="email">Email</Label>
                                   <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@pemira.id"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-background"
                                   />
                              </div>
                              <div className="grid gap-2">
                                   <Label htmlFor="password">Password</Label>
                                   <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-background"
                                   />
                              </div>
                              {error && (
                                   <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive dark:text-red-400">
                                        {error}
                                   </div>
                              )}
                         </CardContent>
                         <CardFooter>
                              <Button type="submit" className="w-full" disabled={loading}>
                                   {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                   Sign In
                              </Button>
                         </CardFooter>
                    </form>
               </Card>
          </div>
     );
}
