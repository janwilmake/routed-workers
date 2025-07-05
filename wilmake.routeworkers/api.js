/**
 * @typedef {Object} Env
 * @property {KVNamespace} CACHE - KV store for caching API responses
 * @property {KVNamespace} SESSIONS - KV store for user sessions
 * @property {string} API_SECRET - Secret key for API authentication
 * @property {string} DATABASE_URL - Database connection string
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // CORS headers for browser requests
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            if (path === '/api/users') {
                // Check cache first
                const cached = await env.CACHE.get('users');
                if (cached) {
                    return new Response(cached, {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                // Simulate API response
                const users = [
                    { id: 1, name: 'John Doe', email: 'john@example.com' },
                    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
                ];
                
                const response = JSON.stringify(users);
                
                // Cache for 5 minutes
                await env.CACHE.put('users', response, { expirationTtl: 300 });
                
                return new Response(response, {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (path === '/api/health') {
                return new Response(JSON.stringify({ 
                    status: 'ok', 
                    timestamp: new Date().toISOString(),
                    secret_configured: !!env.API_SECRET
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response('API endpoint not found', { 
                status: 404, 
                headers: corsHeaders 
            });

        } catch (error) {
            return new Response(`API Error: ${error.message}`, { 
                status: 500, 
                headers: corsHeaders 
            });
        }
    }
};