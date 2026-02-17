/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

export function DailyVotesChart({ data }: { data: any[] }) {
     // Format date for better readability if needed, e.g., '16 Feb'
     const formattedData = data.map(item => ({
          ...item,
          shortDate: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
     }));

     return (
          <ResponsiveContainer width="100%" height={350}>
               <BarChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                         dataKey="shortDate"
                         stroke="#888888"
                         fontSize={12}
                         tickLine={false}
                         axisLine={false}
                    />
                    <YAxis
                         stroke="#888888"
                         fontSize={12}
                         tickLine={false}
                         axisLine={false}
                         tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                         cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                         contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                         labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    {/* Stacked Bar Chart */}
                    <Bar dataKey="online" name="Online" stackId="day" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="offline" name="Offline" stackId="day" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
               </BarChart>
          </ResponsiveContainer>
     );
}
