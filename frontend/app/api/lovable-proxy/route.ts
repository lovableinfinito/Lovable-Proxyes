import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase admin client (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

let currentTokenIndex = 0;

async function getActiveTokens() {
    const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('status', 'active');

    if (error) {
        console.error('Error fetching tokens:', error);
        return [];
    }
    return data;
}

async function markTokenInactive(id: string) {
    await supabase.from('tokens').update({ status: 'inactive' }).eq('id', id);
}

export async function POST(req: NextRequest) {
    return handleProxy(req);
}

export async function GET(req: NextRequest) {
    return handleProxy(req);
}

export async function PUT(req: NextRequest) {
    return handleProxy(req);
}

export async function PATCH(req: NextRequest) {
    return handleProxy(req);
}

export async function DELETE(req: NextRequest) {
    return handleProxy(req);
}

async function handleProxy(req: NextRequest) {
    const tokens = await getActiveTokens();

    if (!tokens || tokens.length === 0) {
        return NextResponse.json({ error: 'No active tokens available in the pool' }, { status: 503 });
    }

    // Round-robin selection
    currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
    const tokenData = tokens[currentTokenIndex];
    const token = tokenData.token;

    // Get body if exists
    let body = null;
    try {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            body = await req.json();
        }
    } catch (e) {
        // Body might not be JSON or empty
    }

    // Forward headers (except host and authorization which we override)
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'authorization') {
            headers[key] = value;
        }
    });
    headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await axios({
            method: req.method,
            url: 'https://api.lovable.dev/v1/chat/completions', // Default target
            data: body,
            params: Object.fromEntries(req.nextUrl.searchParams),
            headers: headers,
            validateStatus: () => true
        });

        // Log the transaction in the background
        supabase.from('logs').insert({
            token_used: token.substring(0, 10) + '...',
            request_method: req.method,
            request_path: req.nextUrl.pathname,
            response_status: response.status
        }).then();

        // Auto-deactivation of tokens with status 402/403
        if (response.status === 402 || response.status === 403) {
            console.log(`Token ${tokenData.id} auto-deactivated due to status ${response.status}`);
            await markTokenInactive(tokenData.id);
        }

        return new NextResponse(JSON.stringify(response.data), {
            status: response.status,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error: any) {
        console.error('Proxy network error:', error.message);

        // Log the failure
        await supabase.from('logs').insert({
            token_used: token.substring(0, 10) + '...',
            request_method: req.method,
            request_path: req.nextUrl.pathname,
            response_status: 500
        });

        return NextResponse.json({
            error: 'Proxy encountered a network error',
            details: error.message
        }, { status: 500 });
    }
}
