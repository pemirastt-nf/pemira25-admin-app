/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Table as TableIcon } from "lucide-react";
import { DailyVotesChart } from "@/components/charts/daily-votes-chart";
import {
     Table,
     TableBody,
     TableCell,
     TableHead,
     TableHeader,
     TableRow,
} from "@/components/ui/table";

interface DailyVotesSectionProps {
     data: any[];
}

export function DailyVotesSection({ data }: DailyVotesSectionProps) {
     const [view, setView] = useState<"chart" | "table">("chart");

     // Sort data by date descending for table view (latest first)
     const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

     return (
          <Card className="col-span-full shadow-sm border-border/50">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                         <CardTitle>Tren Voting Harian</CardTitle>
                         <CardDescription>
                              Statistik suara masuk per hari (Online & Offline).
                         </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 bg-muted/50 p-1 rounded-lg">
                         <Button
                              variant={view === "chart" ? "secondary" : "ghost"}
                              size="sm"
                              className="h-8 px-2 lg:px-3"
                              onClick={() => setView("chart")}
                         >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Grafik</span>
                         </Button>
                         <Button
                              variant={view === "table" ? "secondary" : "ghost"}
                              size="sm"
                              className="h-8 px-2 lg:px-3"
                              onClick={() => setView("table")}
                         >
                              <TableIcon className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Tabel</span>
                         </Button>
                    </div>
               </CardHeader>
               <CardContent className="pt-6">
                    {view === "chart" ? (
                         <div className="pl-2">
                              {data.length > 0 ? (
                                   <DailyVotesChart data={data} />
                              ) : (
                                   <div className="flex h-87.5 items-center justify-center text-muted-foreground">
                                        Data tidak tersedia
                                   </div>
                              )}
                         </div>
                    ) : (
                         <div className="rounded-md border">
                              <Table>
                                   <TableHeader>
                                        <TableRow>
                                             <TableHead>Tanggal</TableHead>
                                             <TableHead className="text-right">Online</TableHead>
                                             <TableHead className="text-right">Offline</TableHead>
                                             <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                        {sortedData.length === 0 ? (
                                             <TableRow>
                                                  <TableCell colSpan={4} className="h-24 text-center">
                                                       Data tidak tersedia
                                                  </TableCell>
                                             </TableRow>
                                        ) : (
                                             sortedData.map((item) => {
                                                  const total = (item.online || 0) + (item.offline || 0);
                                                  return (
                                                       <TableRow key={item.date}>
                                                            <TableCell className="font-medium">
                                                                 {new Date(item.date).toLocaleDateString("id-ID", {
                                                                      weekday: 'long',
                                                                      day: 'numeric',
                                                                      month: 'long',
                                                                      year: 'numeric'
                                                                 })}
                                                            </TableCell>
                                                            <TableCell className="text-right">{item.online}</TableCell>
                                                            <TableCell className="text-right">{item.offline}</TableCell>
                                                            <TableCell className="text-right font-bold">{total}</TableCell>
                                                       </TableRow>
                                                  );
                                             })
                                        )}
                                   </TableBody>
                              </Table>
                         </div>
                    )}
               </CardContent>
          </Card>
     );
}
