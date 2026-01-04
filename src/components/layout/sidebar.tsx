"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, UserCheck, Vote, Settings, LogOut, FileClock, UserCog, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Image from "next/image";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export const sidebarLinks = [
     { label: "Beranda", href: "/", icon: LayoutDashboard, roles: ["super_admin", "panitia", "viewer"] },
     { label: "Kandidat", href: "/candidates", icon: UserCheck, roles: ["super_admin", "panitia"] },
     { label: "Mahasiswa", href: "/students", icon: Users, roles: ["super_admin", "panitia"] },
     { label: "Suara (Votes)", href: "/votes", icon: Vote, roles: ["super_admin", "panitia"] },
     { label: "Panitia", href: "/committee", icon: UserCog, roles: ["super_admin"] },
     { label: "Broadcast", href: "/broadcast", icon: Mail, roles: ["super_admin"] },
     { label: "Activity Logs", href: "/logs", icon: FileClock, roles: ["super_admin"] },
     { label: "Pengaturan", href: "/settings", icon: Settings, roles: ["super_admin"] },
];

export function Sidebar() {
     const pathname = usePathname();
     const { user, logout } = useAuth();
     const userRole = user?.role || "viewer";

     return (
          <div className="hidden md:flex h-screen w-64 flex-col bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-r border-border sticky top-0">
               <div className="flex h-15 items-center px-6 border-b border-border/50">
                    <Image
                         src="/favicon.ico"
                         alt="Logo"
                         width={24}
                         height={24}
                         className="mr-3"
                    />
                    <div>
                         <h1 className="font-bold text-lg leading-tight tracking-tight">PEMIRA Admin</h1>
                         <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Dashboard</p>
                    </div>
               </div>

               <nav className="flex-1 overflow-auto py-6 px-3">
                    <div className="grid gap-1">
                         {sidebarLinks.map((link) => {
                              if (!link.roles.includes(userRole)) return null;

                              const Icon = link.icon;
                              const isActive = pathname === link.href;

                              return (
                                   <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                             "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                             isActive
                                                  ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                   >
                                        <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground/70")} />
                                        {link.label}
                                   </Link>
                              );
                         })}
                    </div>
               </nav>

               <div className="p-4 border-t border-border/50 bg-muted/20">
                    <div className="flex items-center gap-3 mb-4 rounded-lg bg-background p-3 border shadow-sm">
                         <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/10">
                              {user?.name?.[0]?.toUpperCase() || "A"}
                         </div>
                         <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-semibold truncate leading-none">{user?.name || "Admin"}</p>
                              <p className="text-[11px] text-muted-foreground truncate capitalize mt-1">{userRole.replace('_', ' ')}</p>
                         </div>
                    </div>
                    <Button
                         variant="ghost"
                         className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-9"
                         onClick={logout}
                    >
                         <LogOut className="h-4 w-4" />
                         Keluar
                    </Button>
               </div>
          </div>
     );
}

export function MobileSidebar() {
     const pathname = usePathname();
     const { user, logout } = useAuth();
     const userRole = user?.role || "viewer";

     return (
          <Sheet>
               <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                         <Menu className="h-5 w-5" />
                         <span className="sr-only">Toggle menu</span>
                    </Button>
               </SheetTrigger>
               <SheetContent side="left" className="p-0 w-64">
                    <VisuallyHidden>
                         <SheetTitle>Menu Navigasi</SheetTitle>
                    </VisuallyHidden>
                    <div className="flex h-full w-full flex-col bg-background">
                         <div className="flex h-15 items-center px-6 border-b border-border/50">
                              <Vote className="h-6 w-6 text-primary mr-3" />
                              <div>
                                   <h1 className="font-bold text-lg leading-tight tracking-tight">PEMIRA Admin</h1>
                                   <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Dashboard</p>
                              </div>
                         </div>

                         <nav className="flex-1 overflow-auto py-6 px-3">
                              <div className="grid gap-1">
                                   {sidebarLinks.map((link) => {
                                        if (!link.roles.includes(userRole)) return null;

                                        const Icon = link.icon;
                                        const isActive = pathname === link.href;

                                        return (
                                             <Link
                                                  key={link.href}
                                                  href={link.href}
                                                  className={cn(
                                                       "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                                       isActive
                                                            ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                  )}
                                             >
                                                  <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground/70")} />
                                                  {link.label}
                                             </Link>
                                        );
                                   })}
                              </div>
                         </nav>

                         <div className="p-4 border-t border-border/50 bg-muted/20">
                              <div className="flex items-center gap-3 mb-4 rounded-lg bg-background p-3 border shadow-sm">
                                   <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/10">
                                        {user?.name?.[0]?.toUpperCase() || "A"}
                                   </div>
                                   <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-semibold truncate leading-none">{user?.name || "Admin"}</p>
                                        <p className="text-[11px] text-muted-foreground truncate capitalize mt-1">{userRole.replace('_', ' ')}</p>
                                   </div>
                              </div>
                              <Button
                                   variant="ghost"
                                   className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-9"
                                   onClick={logout}
                              >
                                   <LogOut className="h-4 w-4" />
                                   Keluar
                              </Button>
                         </div>
                    </div>
               </SheetContent>
          </Sheet>
     );
}
