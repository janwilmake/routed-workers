/**
 * @typedef {Object} Env
 * @property {KVNamespace} SESSIONS - KV store for user sessions
 * @property {KVNamespace} USERS - KV store for user data
 * @property {string} JWT_SECRET - Secret for JWT token signing
 * @property {string} BCRYPT_SALT - Salt for password hashing
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            if (path === '/auth/login' && request.method === 'POST') {
                const body = await request.json();
                const { email, password } = body;

                // Simulate user lookup
                const userKey = `user:${email}`;
                const userData = await env.USERS.get(userKey);
                
                if (!userData) {
                    return new Response(JSON.stringify({ error: 'User not found' }), {
                        status: 401,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                // In real app, verify password hash
                const sessionId = crypto.randomUUID();
                const sessionData = {
                    userId: email,
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
                };

                await env.SESSIONS.put(`session:${sessionId}`, JSON.stringify(sessionData), {
                    expirationTtl: 24 * 60 * 60 // 24 hours
                });

                return new Response(JSON.stringify({ 
                    sessionId, 
                    message: 'Login successful' 
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (path === '/auth/logout' && request.method === 'POST') {
                const authHeader = request.headers.get('Authorization');
                const sessionId = authHeader?.replace('Bearer ', '');

                if (sessionId) {
                    await env.SESSIONS.delete(`session:${sessionId}`);
                }

                return new Response(JSON.stringify({ message: 'Logged out' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (path === '/auth/me') {
                const authHeader = request.headers.get('Authorization');
                const sessionId = authHeader?.replace('Bearer ', '');

                if (!sessionId) {
                    return new Response(JSON.stringify({ error: 'No session' }), {
                        status: 401,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const sessionData = await env.SESSIONS.get(`session:${sessionId}`);
                if (!sessionData) {
                    return new Response(JSON.stringify({ error: 'Invalid session' }), {
                        status: 401,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const session = JSON.parse(sessionData);
                return new Response(JSON.stringify({ 
                    userId: session.userId,
                    authenticated: true 
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response('Auth endpoint not found', { 
                status: 404, 
                headers: corsHeaders 
            });

        } catch (error) {
            return new Response(`Auth Error: ${error.message}`, { 
                status: 500, 
                headers: corsHeaders 
            });
        }
    }
};