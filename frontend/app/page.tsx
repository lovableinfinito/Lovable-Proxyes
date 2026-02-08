'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import TokenList from '@/components/TokenList';
import LogViewer from '@/components/LogViewer';
import Stats from '@/components/Stats';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-purple-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        <section className="space-y-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">System Overview</h2>
            <p className="text-gray-500">Monitor your proxy performance and token health in real-time.</p>
          </div>
          <Stats />
        </section>

        <section className="space-y-8">
          <TokenList />
        </section>

        <section className="space-y-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">Traffic Analysis</h2>
            <p className="text-gray-500">Live stream of proxied API requests across all managed accounts.</p>
          </div>
          <LogViewer />
        </section>
      </main>
    </div>
  );
}
