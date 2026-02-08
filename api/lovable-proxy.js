/**
 * Vercel Serverless Function - API Lovable Proxy
 * Arquivo: api/lovable-proxy.js
 * Versão: 4.0 (Fix 404 & Red Edition)
 */
export default async function handler(req, res) {
    // Apenas POST permitido
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Apenas POST é permitido'
        });
    }
    try {
        const { projectId, token, message, files } = req.body;
        // Validar campos obrigatórios
        if (!projectId || !message) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: projectId, message'
            });
        }
        // Token Fallback (O que você me enviou por último)
        const FALLBACK_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjRiMTFjYjdhYjVmY2JlNDFlOTQ4MDk0ZTlkZjRjNWI1ZWNhMDAwOWUiLCJ0eXAiOiJKV1QifQ.eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwic291cmNlX3NpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9ncHQtZW5naW5lZXItMzkwNjA3IiwiYXVkIjoiZ3B0LWVuZ2luZWVyLTM5MDYwNyIsImF1dGhfdGltZSI6MTc3MDUwNzE4MSwidXNlcl9pZCI6Im9VVEx5U1VKYzFObUhKTGlnZjQzU25PSDVHOTIiLCJzdWIiOiJvVVRMeVNVSmMxTm1ISkxpZ2Y0M1NuT0g1RzkyIiwiaWF0IjoxNzcwNTMxNTEzLCJleHAiOjE3NzA1MzUxMTMsImVtYWlsIjoiaG91cm9mYWkrdHJ1ZW93bGJhbGNvbnlAaW1hZ2lsYWJzLmNvbSIsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiaG91cm9mYWkrdHJ1ZW93bGJhbGNvbnlAaW1hZ2lsYWJzLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6ImN1c3RvbSJ9fQ.O8zcWq6uaKyh8MI0wurtGWlXvMnjtGw6nrOX6rrWCvmBHoFzlvbGBAJbbZrkEHq-7j1y79e8NGhQtGb4q3nDJjf0iWDSsqG3tto7LfOFT3AtCwoP8A0e1gPfaiFe4rW5YgO29pOkZxxo0EFjLA9teely_hVgVwiUzeyjbkoqSTPs3brKN-INVK7VDq5ivyj0adT1QpYYgWuxe9HQ8ks3XEDncrjo78XHh831inxvKVx-3tdrg7Q0O8feODTZVqu1G5egQ8CLzuFw5fKsLyIDJFnLSDOZag7WIjyiLw0mQMbcldlQZmAVStOaD2odCfXZNApMuiDNnBEfWzsacUktBg';
        const finalToken = token || FALLBACK_TOKEN;
        if (!finalToken) {
            return res.status(401).json({
                success: false,
                error: 'Token não fornecido e nenhum fallback configurado no proxy'
            });
        }
        const cleanProjectId = projectId.trim();

        // Lista de endpoints para tentar (Fallback) - Fix para erro 404
        const endpoints = [
            'https://lovable.dev/api/gpt/chat',
            'https://lovable.dev/api/chat',
            'https://api.lovable.dev/chat'
        ];
        let lastError = null;
        console.log(`[Proxy] Tentando projeto: ${cleanProjectId}`);
        for (const url of endpoints) {
            try {
                const lovableResponse = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${finalToken}`,
                        'Content-Type': 'application/json',
                        'X-Project-Id': cleanProjectId,
                        'Origin': 'https://lovable.dev',
                        'Referer': 'https://lovable.dev/'
                    },
                    body: JSON.stringify({
                        projectId: cleanProjectId,
                        project_id: cleanProjectId,
                        message,
                        files: files || []
                    }),
                    timeout: 20000
                });
                const status = lovableResponse.status;
                const responseText = await lovableResponse.text();

                if (lovableResponse.ok) {
                    let responseData = {};
                    try { responseData = JSON.parse(responseText); } catch (e) { }

                    return res.status(200).json({
                        success: true,
                        content: responseData.content || responseData.reply || responseData.response || 'Sucesso'
                    });
                }
                console.error(`[Proxy] Falha no endpoint ${url}: ${status}`);
                lastError = { status, text: responseText };
                // Se o token for inválido, não adianta tentar outros caminhos
                if (status === 401 || status === 402) break;
            } catch (err) {
                lastError = { status: 500, text: err.message };
            }
        }
        // Se todos falharem, retornar o erro mais detalhado
        const finalStatus = lastError.status;
        const finalMsg = lastError.text;
        let resData = {};
        try { resData = JSON.parse(finalMsg); } catch (e) { }
        return res.status(finalStatus || 502).json({
            success: false,
            error: `Erro no Lovable (${finalStatus}): ` + (resData.error || finalMsg.substring(0, 100))
        });
    } catch (error) {
        console.error('[Proxy] Erro crítico:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro interno no servidor'
        });
    }
}
