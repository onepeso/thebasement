"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { MessageSquare, TrendingUp, Clock } from "lucide-react";

export function MessageStats() {
  const [stats, setStats] = useState<{
    chartData: { name: string; date: string; messages: number }[];
    totalMessages: number;
    todayMessages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const getDateString = (date: Date) => date.toISOString().split('T')[0];

  const fetchStats = useCallback(async () => {
    const now = new Date();
    const days: { name: string; date: string; messages: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({
        name: dayName,
        date: date.toISOString().split('T')[0],
        messages: 0,
      });
    }
    
    const startDate = days[0].date;
    const endDate = days[6].date;

    const { data: messages } = await supabase
      .from('messages')
      .select('created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    if (messages) {
      messages.forEach((msg: any) => {
        const msgDate = msg.created_at.split('T')[0];
        const dayIndex = days.findIndex(d => d.date === msgDate);
        if (dayIndex !== -1) {
          days[dayIndex].messages++;
        }
      });
    }

    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    setStats({
      chartData: days,
      totalMessages: totalMessages || 0,
      todayMessages: days[6].messages,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const channel = supabase
      .channel('messages-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          setStats(prev => {
            if (!prev) return prev;
            
            const now = new Date();
            const today = getDateString(now);
            const chartData = JSON.parse(JSON.stringify(prev.chartData)) as typeof prev.chartData;
            
            if (payload.eventType === 'INSERT') {
              const newMsg = JSON.parse(JSON.stringify(payload.new)) as any;
              if (!newMsg?.created_at) return prev;
              const msgDate = newMsg.created_at.split('T')[0];
              const dayIndex = chartData.findIndex(d => d.date === msgDate);
              
              if (dayIndex !== -1) {
                chartData[dayIndex].messages++;
              }
              if (msgDate === today) {
                return {
                  ...prev,
                  chartData,
                  totalMessages: prev.totalMessages + 1,
                  todayMessages: prev.todayMessages + 1,
                };
              }
              return {
                ...prev,
                chartData,
                totalMessages: prev.totalMessages + 1,
              };
            }
            
            if (payload.eventType === 'DELETE') {
              const deletedMsg = JSON.parse(JSON.stringify(payload.old)) as any;
              if (!deletedMsg?.created_at) return prev;
              const msgDate = deletedMsg.created_at.split('T')[0];
              const dayIndex = chartData.findIndex(d => d.date === msgDate);
              
              if (dayIndex !== -1 && chartData[dayIndex].messages > 0) {
                chartData[dayIndex].messages--;
              }
              if (msgDate === today) {
                return {
                  ...prev,
                  chartData,
                  totalMessages: Math.max(0, prev.totalMessages - 1),
                  todayMessages: Math.max(0, prev.todayMessages - 1),
                };
              }
              return {
                ...prev,
                chartData,
                totalMessages: Math.max(0, prev.totalMessages - 1),
              };
            }
            
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-4 border-t border-white/5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-zinc-800 rounded w-24" />
          <div className="h-20 bg-zinc-800/50 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-white/5 bg-gradient-to-b from-zinc-950/50 to-transparent">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={14} className="text-indigo-400" />
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Message Activity
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-zinc-900/50 rounded-lg p-2.5 border border-white/5">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare size={10} className="text-zinc-600" />
            <span className="text-[9px] text-zinc-500 uppercase">Total</span>
          </div>
          <p className="text-lg font-bold text-white">{stats.totalMessages}</p>
        </div>
        <div className="bg-zinc-900/50 rounded-lg p-2.5 border border-white/5">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={10} className="text-zinc-600" />
            <span className="text-[9px] text-zinc-500 uppercase">Today</span>
          </div>
          <p className="text-lg font-bold text-indigo-400">{stats.todayMessages}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-zinc-900/30 rounded-xl p-3 border border-white/5">
        <p className="text-[9px] text-zinc-600 uppercase mb-2 tracking-wider">Last 7 days</p>
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} barSize={8}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 8, fill: '#52525b' }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(24, 24, 27, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11px',
                }}
                labelStyle={{ color: '#a1a1aa' }}
                itemStyle={{ color: '#818cf8' }}
                formatter={(value: any) => [`${value} messages`, 'Count']}
              />
              <Bar 
                dataKey="messages" 
                fill="#6366f1" 
                radius={[4, 4, 0, 0]}
                fillOpacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
