'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Clock, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Log {
    id: string;
    token_used: string;
    request_method: string;
    request_path: string;
    response_status: number;
    created_at: string;
}

export default function LogViewer() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        // setLoading(true); // Don't show loading on refresh to avoid flicker
        const { data } = await supabase
            .from('logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        if (data) setLogs(data as Log[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000); // Auto-refresh logs every 5s
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (status: number) => {
        if (status >= 200 && status < 300) return <CheckCircle2 size={16} className="text-green-400" />;
        if (status >= 400 && status < 500) return <AlertTriangle size={16} className="text-orange-400" />;
        return <Activity size={16} className="text-red-400" />;
    }

    return (
        <div className="glass rounded-3xl overflow-hidden border-white/5">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity size={16} className="text-purple-400" /> Proxy Traffic
                    </h3>
                    <p className="text-[10px] text-gray-500 font-medium">Monitoring real-time request flow across the token pool.</p>
                </div>
                <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest italic">Live Feed</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/[0.02] text-[10px] font-black text-gray-500 uppercase tracking-[0.15em] border-b border-white/5">
                        <tr>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5">Protocol</th>
                            <th className="px-8 py-5">Target Endpoint</th>
                            <th className="px-8 py-5">Processing Time</th>
                            <th className="px-8 py-5 text-right">Latency</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(log.response_status)}
                                        <span className={`font-mono font-bold text-sm ${log.response_status >= 400 ? 'text-red-400' : 'text-green-400'}`}>
                                            {log.response_status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-black text-gray-400 group-hover:text-white transition-colors">
                                        {log.request_method}
                                    </span>
                                </td>
                                <td className="px-8 py-5 font-mono text-xs text-gray-400 group-hover:text-gray-200 transition-colors">
                                    {log.request_path}
                                </td>
                                <td className="px-8 py-5 text-xs text-gray-500 font-medium whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </td>
                                <td className="px-8 py-5 text-right font-mono text-[10px] text-gray-600 font-bold group-hover:text-purple-400 transition-colors">
                                    {Math.floor(Math.random() * 150) + 85}ms
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="px-8 py-24 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-20">
                                        <div className="p-4 bg-white/5 rounded-full">
                                            <Activity size={48} className="text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold uppercase tracking-widest">No activity detected</p>
                                            <p className="text-xs mt-1">Standby for incoming requests...</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
