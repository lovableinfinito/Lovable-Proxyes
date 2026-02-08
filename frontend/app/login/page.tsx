'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, Link2 } from 'lucide-react';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'password' | 'magic'>('password');
    const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        let result;
        if (mode === 'password') {
            result = await supabase.auth.signInWithPassword({
                email,
                password,
            });
        } else {
            result = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/`,
                },
            });
        }

        if (result.error) {
            if (result.error.message.includes('Invalid login credentials')) {
                setMessage({ text: 'Credenciais inválidas. Verifique seu e-mail e senha.', type: 'error' });
            } else {
                setMessage({ text: 'Erro: ' + result.error.message, type: 'error' });
            }
        } else {
            if (mode === 'password') {
                router.push('/');
            } else {
                setMessage({ text: 'Link enviado! Verifique seu e-mail.', type: 'success' });
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 selection:bg-purple-500/30 font-sans">
            {/* Efeito de Fundo Premium */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[15%] w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            <div className="w-full max-w-md glass border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative z-10 transition-all duration-500 hover:border-white/10">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl mx-auto flex items-center justify-center text-4xl font-black text-white mb-8 shadow-[0_0_40px_rgba(168,85,247,0.4)] transform hover:rotate-6 transition-transform">L</div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Lovable Infinity</h1>
                    <p className="text-gray-500 text-xs font-bold tracking-[0.2em] uppercase">Control Interface Alpha</p>
                </div>

                {/* Seletor de Modo */}
                <div className="flex p-1.5 bg-white/5 rounded-2xl mb-10 border border-white/5 backdrop-blur-md">
                    <button
                        type="button"
                        onClick={() => setMode('password')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'password' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Lock size={14} /> Password
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('magic')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'magic' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Link2 size={14} /> Magic Link
                    </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Operator ID</label>
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-purple-400 transition-colors" size={18} />
                            <input
                                type="email"
                                required
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white focus:outline-none focus:border-purple-500/40 transition-all font-semibold placeholder:text-gray-800 text-sm"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {mode === 'password' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Security Protocol</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-purple-400 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white focus:outline-none focus:border-purple-500/40 transition-all font-semibold placeholder:text-gray-800 text-sm"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl hover:bg-gray-100 transition-all disabled:opacity-50 active:scale-[0.97] shadow-[0_20px_40px_rgba(255,255,255,0.05)] flex items-center justify-center gap-3 mt-6"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Access Dashboard'}
                    </button>
                </form>

                {message && (
                    <div className={`mt-10 p-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center text-center animate-in zoom-in duration-300 border ${message.type === 'error' ? 'bg-red-500/5 text-red-500 border-red-500/10' : 'bg-green-500/5 text-green-500 border-green-500/10'}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}
