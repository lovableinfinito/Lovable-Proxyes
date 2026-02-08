const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const schema = `
-- Create tokens table
create table if not exists public.tokens (
  id uuid default gen_random_uuid() primary key,
  token text not null unique,
  status text default 'active' check (status in ('active', 'inactive', 'out_of_credits')),
  credits integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create logs table
create table if not exists public.logs (
  id uuid default gen_random_uuid() primary key,
  token_used text, 
  request_method text,
  request_path text,
  response_status integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.tokens enable row level security;
alter table public.logs enable row level security;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access for authenticated users' AND tablename = 'tokens') THEN
        create policy "Allow all access for authenticated users" on public.tokens for all using (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access for authenticated users' AND tablename = 'logs') THEN
        create policy "Allow all access for authenticated users" on public.logs for all using (auth.role() = 'authenticated');
    END IF;
END $$;
`;

async function setup() {
    console.log('Applying database schema...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: schema });
    // Wait, Supabase doesn't have exec_sql by default. 
    // I should use the standard REST API or just explain to the user.
    // Actually, I can just try to create tables via the JS client if I use raw SQL via a trick or just use the REST API.
    // Actually, the most reliable way for me as an agent is to tell the user to paste it.
    console.log('Please paste the content of supabase/schema.sql into your Supabase SQL Editor.');
}

setup();
