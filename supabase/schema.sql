-- Create tokens table
create table public.tokens (
  id uuid default gen_random_uuid() primary key,
  token text not null unique,
  status text default 'active' check (status in ('active', 'inactive', 'out_of_credits')),
  credits integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create logs table
create table public.logs (
  id uuid default gen_random_uuid() primary key,
  token_used text, -- Store the token string or reference the ID if preferred, but string might be safer for history if token deleted
  request_method text,
  request_path text,
  response_status integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.tokens enable row level security;
alter table public.logs enable row level security;

-- Policies for local use (Public access)
-- Note: In production you would secure this, but for internal proxy tools on localhost this is fine.
create policy "Public access" on public.tokens
  for all using (true) with check (true);

create policy "Public access" on public.logs
  for all using (true) with check (true);
