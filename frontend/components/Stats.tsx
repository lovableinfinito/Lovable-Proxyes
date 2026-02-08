'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Shield, Activity, Zap } from 'lucide-react';

export default function Stats() {
    const [stats, setStats] = useState({
        totalTokens: 0,
        activeTokens: 0,
        requestsToday: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const { data: tokens } = await supabase.from('tokens').select('status');

            // Get today's logs count
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: logCount } = await supabase
                .from('logs')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            if (tokens) {
                setStats({
                    totalTokens: tokens.length,
                    activeTokens: tokens.filter(t => t.status === 'active').length,
                    requestsToday: logCount || 0
                });
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield size={48} className="text-purple-400" />
                </div>
                <div className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">Total Tokens</div>
                <div className="text-3xl font-bold text-white">{stats.totalTokens}</div>
                <div className="mt-2 text-xs text-gray-500">Registered accounts pool</div>
            </div>

            <div className="glass p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={48} className="text-green-400" />
                </div>
                <div className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">Active Tokens</div>
                <div className="text-3xl font-bold text-green-400 flex items-center gap-2">
                    {stats.activeTokens}
                    {stats.activeTokens > 0 && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>}
                </div>
                <div className="mt-2 text-xs text-gray-500">Ready to handle requests</div>
            </div>

            <div className="glass p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap size={48} className="text-blue-400" />
                </div>
                <div className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">Today's Traffic</div>
                <div className="text-3xl font-bold text-blue-400">{stats.requestsToday}</div>
                <div className="mt-2 text-xs text-gray-500">API calls proxied today</div>
            </div>
        </div>
    );
}
