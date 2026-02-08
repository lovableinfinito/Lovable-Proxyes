import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase admin client for logging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS Headers Configuration
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // For extensions, '*' is often needed or specific chrome-extension:// IDs
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { projectId, token, message, files } = body;

        // 1. Validate Input (PRD Rule)
        if (!projectId || !token || !message) {
            return NextResponse.json({
                success: false,
                error: 'Campos obrigatórios: projectId, token, message'
            }, { status: 400, headers: corsHeaders });
        }

        // 2. Prepare headers for Lovable API
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Lovable-Proxy-Infinity/1.0',
        };

        // 3. Logic: Call Lovable API
        // Using the PRD suggested endpoint (Note: endpoint might vary based on Lovable's actual internal API)
        const lovableEndpoint = 'https://api.lovable.dev/v1/chat/completions';

        try {
            const response = await axios({
                method: 'POST',
                url: lovableEndpoint,
                data: {
                    projectId,
                    message,
                    files: files || []
                },
                headers: headers,
                timeout: 30000, // 30s Timeout (PRD Rule)
                validateStatus: () => true // Handle all status codes
            });

            // 4. Log the transaction (Dashboard Sync)
            supabase.from('logs').insert({
                token_used: token.substring(0, 10) + '...',
                request_method: 'POST',
                request_path: '/api/lovable-proxy',
                response_status: response.status
            }).then();

            // 5. Error Mapping Based on PRD
            if (response.status === 401) {
                return NextResponse.json({ success: false, error: 'Token inválido ou expirado' }, { status: 401, headers: corsHeaders });
            }
            if (response.status === 402) {
                return NextResponse.json({ success: false, error: 'Créditos insuficientes na conta' }, { status: 402, headers: corsHeaders });
            }
            if (response.status === 404) {
                return NextResponse.json({ success: false, error: 'Projeto não encontrado' }, { status: 404, headers: corsHeaders });
            }
            if (response.status >= 500) {
                return NextResponse.json({ success: false, error: 'Erro ao processar no Lovable' }, { status: 502, headers: corsHeaders });
            }

            // 6. Success Response (PRD Formatted)
            return NextResponse.json({
                success: true,
                content: response.data.content || response.data.reply || response.data.response || 'No content returned',
                raw: response.data // Optional: keeping raw for debugging
            }, {
                status: response.status,
                headers: corsHeaders
            });

        } catch (apiError: any) {
            console.error('Lovable API Connection Error:', apiError.message);
            return NextResponse.json({
                success: false,
                error: 'Falha na conexão com a API do Lovable'
            }, { status: 502, headers: corsHeaders });
        }

    } catch (parseError) {
        return NextResponse.json({
            success: false,
            error: 'Erro ao processar corpo da requisição (JSON inválido)'
        }, { status: 400, headers: corsHeaders });
    }
}

// Support for other methods if needed, but PRD specifies POST
export async function GET() {
    return NextResponse.json({ success: false, error: 'Method not allowed. Use POST.' }, { status: 405, headers: corsHeaders });
}
