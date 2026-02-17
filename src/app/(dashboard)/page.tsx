/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { ResultsChart } from "@/components/charts/results-chart";
import { DailyVotesSection } from "@/components/dashboard/daily-votes-section";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Users, Vote, UserCheck, Activity, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect } from "react";
import { socket } from "@/lib/socket";

export default function DashboardPage() {
     const api = useApi();
     const queryClient = useQueryClient();

     useEffect(() => {
          socket.connect();

          const onVoteUpdate = () => {
               queryClient.invalidateQueries({ queryKey: ['vote-stats'] });
               queryClient.invalidateQueries({ queryKey: ['vote-results'] });
               queryClient.invalidateQueries({ queryKey: ['vote-activity'] });
               queryClient.invalidateQueries({ queryKey: ['vote-daily'] });
          };

          socket.on('vote-update', onVoteUpdate);

          return () => {
               socket.off('vote-update', onVoteUpdate);
               socket.disconnect();
          };
     }, [queryClient]);

     const { data: statsData } = useQuery({
          queryKey: ['vote-stats'],
          queryFn: async () => {
               const res = await api.get('/votes/stats');
               return res.data;
          },
     });

     const { data: resultsData } = useQuery({
          queryKey: ['vote-results'],
          queryFn: async () => {
               const res = await api.get('/votes/results');
               return res.data;
          },
     });

     const { data: activityData } = useQuery({
          queryKey: ['vote-activity'],
          queryFn: async () => {
               const res = await api.get('/votes/activity');
               return res.data || [];
          },
     });

     const { data: dailyData } = useQuery({
          queryKey: ['vote-daily'],
          queryFn: async () => {
               const res = await api.get('/votes/daily');
               return res.data || [];
          },
     });

     const stats = {
          totalVoters: statsData?.totalVoters || 0,
          totalVotes: statsData?.votesCast || 0,
          onlineVotes: statsData?.onlineVotes || 0,
          offlineVotes: statsData?.offlineVotes || 0,
          turnout: statsData?.turnout || "0%",
          activeCandidates: resultsData?.length || 0,
     };

     const chartData = resultsData || [];

     const handleDownloadReport = () => {
          if (!resultsData || !statsData) {
               alert("Data is still loading, please wait.");
               return;
          }

          const timestamp = new Date().toLocaleString('id-ID');
          let csvContent = `sep=,\n\uFEFFLAPORAN HASIL PEMILIHAN RAYA (PEMIRA) STT NURUL FIKRI\n`;
          csvContent += `Dihasilkan pada:,${timestamp}\n\n`;

          csvContent += `--- STATISTIK PEMILIHAN ---\n`;
          csvContent += `Total Pemilih Terdaftar:,${stats.totalVoters}\n`;
          csvContent += `Total Suara Masuk:,${stats.totalVotes}\n`;
          csvContent += `Suara Online:,${stats.onlineVotes}\n`;
          csvContent += `Suara Offline (Manual):,${stats.offlineVotes}\n`;
          csvContent += `Partisipasi Pemilih:,${stats.turnout}\n\n`;

          csvContent += `--- PEROLEHAN SUARA KANDIDAT ---\n`;
          csvContent += `No Urut,Nama Kandidat,Suara Online,Suara Offline,Total Suara,Persentase\n`;

          resultsData.forEach((candidate: any) => {
               const percentage = stats.totalVotes > 0 ? (candidate.votes / stats.totalVotes) * 100 : 0;
               csvContent += `${candidate.orderNumber},"${candidate.name}",${candidate.onlineVotes},${candidate.offlineVotes},${candidate.votes},${percentage.toFixed(2)}%\n`;
          });

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `Laporan_PEMIRA_${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);

          link.click();
          document.body.removeChild(link);
     };

     return (
          <div className="space-y-6">
               <div className="flex items-center justify-between space-y-2">
                    <div>
                         <h2 className="text-3xl font-bold tracking-tight">Beranda</h2>
                         <p className="text-muted-foreground">Ringkasan hasil pemilihan secara real-time.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                         <Button size="sm" variant="outline" onClick={handleDownloadReport}>
                              <Download className="mr-2 h-4 w-4" />
                              Unduh Laporan
                         </Button>
                    </div>
               </div>

               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                         title="Total Pemilih"
                         value={stats.totalVoters}
                         icon={Users}
                         description="Mahasiswa terdaftar"
                    />
                    <StatsCard
                         title="Suara Masuk"
                         value={stats.totalVotes}
                         icon={Vote}
                         description="Total surat suara diterima"
                         trend=""
                    />
                    <StatsCard
                         title="Partisipasi"
                         value={stats.turnout}
                         icon={Activity}
                         description="Persentase mahasiswa memilih"
                    />
                    <StatsCard
                         title="Kandidat"
                         value={stats.activeCandidates}
                         icon={UserCheck}
                         description="Paslon aktif bertanding"
                    />
               </div>

               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4 shadow-sm border-border/50">
                         <CardHeader>
                              <CardTitle>Hasil Sementara</CardTitle>
                              <CardDescription>
                                   Distribusi perolehan suara per kandidat.
                              </CardDescription>
                         </CardHeader>
                         <CardContent className="pl-2">
                              <ResultsChart data={chartData} />
                         </CardContent>
                    </Card>

                    <Card className="col-span-4 md:col-span-3 shadow-sm border-border/50">
                         <CardHeader>
                              <CardTitle>Aktivitas Terbaru</CardTitle>
                              <CardDescription>
                                   5 aktivitas pemilihan terakhir.
                              </CardDescription>
                         </CardHeader>
                         <CardContent>
                              <div className="space-y-4">
                                   {activityData?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No activity yet.</p>}

                                   {activityData?.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                             <div className="flex items-center gap-4">
                                                  <Avatar className="h-9 w-9">
                                                       <AvatarImage src={`https://avatar.vercel.sh/${item.voterName}`} alt="Avatar" />
                                                       <AvatarFallback>{item.voterName?.[0] || "?"}</AvatarFallback>
                                                  </Avatar>
                                                  <div className="space-y-1">
                                                       <p className="text-sm font-medium leading-none">{item.voterName || "Anonim"}</p>
                                                       <p className="text-xs text-muted-foreground">
                                                            Telah menggunakan <span className="font-medium text-foreground">Hak Suara</span>
                                                       </p>
                                                  </div>
                                             </div>
                                             <div className="text-xs text-muted-foreground">
                                                  {new Date(item.timestamp).toLocaleTimeString()}
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         </CardContent>
                    </Card>
                    
                    <DailyVotesSection data={dailyData || []} />
               </div>
          </div>
     );
}
