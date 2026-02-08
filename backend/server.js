const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory cache for tokens to reduce DB hits in high traffic (Simple implementation)
let tokenCache = [];
let lastCacheUpdate = 0;
const CACHE_TTL = 60000; // 1 minute

async function getActiveTokens() {
    const now = Date.now();
    if (now - lastCacheUpdate < CACHE_TTL && tokenCache.length > 0) {
        return tokenCache;
    }

    const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('status', 'active');

    if (error) {
        console.error('Error fetching tokens:', error);
        return [];
    }

    tokenCache = data;
    lastCacheUpdate = now;
    return data;
}

let currentTokenIndex = 0;

function getNextToken(tokens) {
    if (tokens.length === 0) return null;
    // Round-robin
    currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
    return tokens[currentTokenIndex];
}

async function markTokenInactive(id) {
    await supabase.from('tokens').update({ status: 'inactive' }).eq('id', id);
    // Invalidate cache
    lastCacheUpdate = 0;
}

// Proxy Endpoint (Handles any method)
app.all('/api/lovable-proxy', async (req, res) => {
    const tokens = await getActiveTokens();

    if (!tokens || tokens.length === 0) {
        return res.status(503).json({ error: 'No active tokens available' });
    }

    const tokenData = getNextToken(tokens);
    const token = tokenData.token;

    // Remove host header to avoid axios/target conflicts
    const headers = { ...req.headers };
    delete headers.host;
    headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await axios({
            method: req.method,
            url: 'https://api.lovable.dev/v1/chat/completions', // Set default or dynamic
            data: req.body,
            params: req.query,
            headers: headers,
            validateStatus: () => true // Allow handling all status codes
        });

        // Log transaction
        await supabase.from('logs').insert({
            token_used: token.substring(0, 10) + '...', // Mask for safety in logs
            request_method: req.method,
            request_path: req.url,
            response_status: response.status
        });

        // Check for credit failure codes
        if (response.status === 402 || response.status === 403) {
            console.log(`Token ${tokenData.id} marked as inactive due to status ${response.status}`);
            await markTokenInactive(tokenData.id);
        }

        res.status(response.status).json(response.data);

    } catch (error) {
        console.error('Proxy network error:', error.message);

        await supabase.from('logs').insert({
            token_used: token.substring(0, 10) + '...',
            request_method: req.method,
            request_path: req.url,
            response_status: 500
        });

        res.status(500).json({ error: 'Proxy encounterd a network error', details: error.message });
    }
});

// Management Endpoints (Internal use or secured via another method)
app.get('/api/tokens', async (req, res) => {
    const { data, error } = await supabase.from('tokens').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/tokens', async (req, res) => {
    const { token } = req.body;
    const { data, error } = await supabase.from('tokens').insert([{ token, status: 'active', credits: 100 }]); // Default credits
    if (error) return res.status(500).json({ error: error.message });
    lastCacheUpdate = 0; // Invalidate cache
    res.json(data);
});

app.delete('/api/tokens/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('tokens').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    lastCacheUpdate = 0;
    res.json({ message: 'Deleted' });
});

app.get('/api/logs', async (req, res) => {
    const { data, error } = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});


app.listen(port, () => {
    console.log(`Proxy server running on port ${port}`);
});
