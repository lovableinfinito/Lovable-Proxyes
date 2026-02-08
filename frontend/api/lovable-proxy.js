/**
 * Vercel Serverless Function - API Lovable Proxy
 * Este arquivo deve estar em: /api/lovable-proxy.js
 */

export default async function handler(req, res) {
    // CORS configuration (Essential for Chrome Extensions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Apenas POST é permitido'
        });
    }

    try {
        const { projectId, token, message, files } = req.body;

        if (!projectId || !token || !message) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: projectId, token, message'
            });
        }

        console.log('[Proxy] Requisição recebida');

        // Chamar API do Lovable
        const lovableResponse = await fetch('https://api.lovable.dev/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projectId,
                message,
                files: files || []
            }),
            signal: AbortSignal.timeout(30000) // 30 seconds timeout
        });

        const responseText = await lovableResponse.text();
        let responseData = {};

        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            console.log('[Proxy] Resposta não é JSON');
        }

        if (!lovableResponse.ok) {
            if (lovableResponse.status === 401) {
                return res.status(401).json({ success: false, error: 'Token inválido ou expirado' });
            }
            if (lovableResponse.status === 402) {
                return res.status(402).json({ success: false, error: 'Créditos insuficientes' });
            }
            if (lovableResponse.status === 404) {
                return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
            }
            return res.status(502).json({ success: false, error: 'Erro ao processar no Lovable' });
        }

        return res.status(200).json({
            success: true,
            content: responseData.content || responseData.reply || responseData.response || 'Processado com sucesso'
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
