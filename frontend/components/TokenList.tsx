'use client';
import { useState, useEffect } from 'react';
import { Trash2, AlertCircle, CheckCircle, Plus, Copy, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Token {
    id: string;
    token: string;
    status: 'active' | 'inactive' | 'out_of_credits';
    credits: number;
    created_at: string;
}

export default function TokenList() {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [newToken, setNewToken] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchTokens();
    }, []);

    const fetchTokens = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('tokens').select('*').order('created_at', { ascending: false });
        if (!error && data) setTokens(data as Token[]);
        setLoading(false);
    };

    const addToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newToken.trim()) return;
        setAdding(true);

        const { error } = await supabase.from('tokens').insert([{ token: newToken, status: 'active', credits: 100 }]); // Default credits logic

        if (error) {
            alert('Error adding token: ' + error.message);
        } else {
            setNewToken('');
            fetchTokens();
        }
        setAdding(false);
    };

    const deleteToken = async (id: string) => {
        if (!confirm('Are you sure you want to remove this token?')) return;
        const { error } = await supabase.from('tokens').delete().eq('id', id);
        if (!error) fetchTokens();
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        await supabase.from('tokens').update({ status: newStatus }).eq('id', id);
        fetchTokens();
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-400 border-green-400/20 bg-green-400/10';
            case 'inactive': return 'text-gray-400 border-gray-400/20 bg-gray-400/10';
            case 'out_of_credits': return 'text-red-400 border-red-400/20 bg-red-400/10';
            default: return 'text-gray-400';
        }
    };

    if (loading) return <div className="text-gray-400 text-center py-8">Loading tokens...</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Token Management</h2>
                    <p className="text-gray-500">Add or remove Lovable authentication tokens from the rotation pool.</p>
                </div>
                <form onSubmit={addToken} className="flex gap-2 w-full sm:w-auto p-1 bg-gray-900/50 rounded-xl border border-gray-800 focus-within:border-purple-500/50 transition-colors">
                    <input
                        type="text"
                        placeholder="Paste Lovable Token..."
                        className="bg-transparent px-4 py-2 text-sm text-white focus:outline-none w-full sm:w-64"
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={adding}
                        className="bg-white text-black px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    >
                        {adding ? 'Adding...' : <><Plus size={16} strokeWidth={3} /> Add Token</>}
                    </button>
                </form>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tokens.map((token) => (
                    <div key={token.id} className="glass rounded-2xl p-6 transition-all duration-300 hover:border-purple-500/30 group relative overflow-hidden active:scale-[0.99]">
                        <div className="absolute -inset-full h-[300%] w-[300%] rotate-45 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                        <div className="flex justify-between items-start mb-6">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border uppercase ${getStatusColor(token.status)}`}>
                                {token.status.replace(/_/g, ' ')}
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => toggleStatus(token.id, token.status)}
                                    className="text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                                    title={token.status === 'active' ? 'Disable' : 'Enable'}
                                >
                                    {token.status === 'active' ? <Activity size={18} /> : <CheckCircle size={18} />}
                                </button>
                                <button
                                    onClick={() => deleteToken(token.id)}
                                    className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10"
                                    title="Delete Token"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="font-mono text-sm text-gray-400 break-all mb-6 bg-black/40 p-4 rounded-xl border border-white/5 flex items-center justify-between group/code relative z-10">
                            <span className="opacity-70">{token.token.substring(0, 10)}...{token.token.substring(token.token.length - 4)}</span>
                            <button
                                onClick={() => navigator.clipboard.writeText(token.token)}
                                className="opacity-0 group-hover/code:opacity-100 p-2 hover:bg-white/5 rounded transition-all"
                            >
                                <Copy size={14} className="text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        <div className="flex justify-between items-center bg-white/[0.02] -mx-6 -mb-6 px-6 py-4 border-t border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-tighter font-bold">Credits Remaining</span>
                                <span className={`text-lg font-black ${token.credits > 20 ? 'text-white' : 'text-red-400'}`}>
                                    {token.credits}
                                </span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-gray-500 uppercase tracking-tighter font-bold">Health Score</span>
                                <span className="text-xs font-semibold text-gray-300">
                                    {token.status === 'active' ? 'EXCELLENT' : 'RESTRICTED'}
                                </span>
                            </div>
                        </div>

                        {token.status === 'out_of_credits' && (
                            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center backdrop-blur-[2px] z-20 p-6 text-center">
                                <div className="bg-red-500/20 p-3 rounded-full mb-3 text-red-500">
                                    <AlertCircle size={32} />
                                </div>
                                <div className="text-red-200 text-lg font-bold mb-1">Out of Credits</div>
                                <p className="text-red-400/60 text-xs mb-4">This token has been automatically deactivated.</p>
                                <button
                                    onClick={() => deleteToken(token.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                >
                                    Remove Invalid Token
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {tokens.length === 0 && (
                    <div className="col-span-full text-center py-24 text-gray-500 glass rounded-3xl border-dashed border-2 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                            <Plus size={32} className="text-gray-700" />
                        </div>
                        <div>
                            <h3 className="text-white font-medium">No tokens in pool</h3>
                            <p className="text-sm text-gray-500">Start by adding your first Lovable token to enable proxy rotation.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
