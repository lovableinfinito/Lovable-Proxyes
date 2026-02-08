'use client';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <nav className="glass sticky top-0 z-50 border-white/5 bg-black/40 px-8 py-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-transform group-hover:scale-110">
                    L
                </div>
                <div className="flex flex-col">
                    <h1 className="text-lg font-black tracking-tighter gradient-text uppercase">Lovable Infinity</h1>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest -mt-1">Proxy Intelligence</span>
                </div>
            </div>

        </nav>
    );
}
