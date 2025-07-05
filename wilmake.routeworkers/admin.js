/**
 * @typedef {Object} Env
 * @property {KVNamespace} ADMIN_SESSIONS - KV store for admin sessions
 * @property {KVNamespace} SITE_CONFIG - KV store for site configuration
 * @property {string} ADMIN_SECRET - Secret key for admin authentication
 * @property {string} WEBHOOK_SECRET - Secret for webhook validation
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Admin authentication check
            const isAuthenticated = async (request) => {
                const authHeader = request.headers.get('Authorization');
                if (!authHeader) return false;
                
                const token = authHeader.replace('Bearer ', '');
                const sessionData = await env.ADMIN_SESSIONS.get(`admin:${token}`);
                return !!sessionData;
            };

            if (path === '/admin/login' && request.method === 'POST') {
                const body = await request.json();
                const { password } = body;

                if (password === env.ADMIN_SECRET) {
                    const sessionToken = crypto.randomUUID();
                    const sessionData = {
                        createdAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
                    };

                    await env.ADMIN_SESSIONS.put(`admin:${sessionToken}`, JSON.stringify(sessionData), {
                        expirationTtl: 8 * 60 * 60 // 8 hours
                    });

                    return new Response(JSON.stringify({ 
                        token: sessionToken,
                        message: 'Admin login successful' 
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                return new Response('Invalid credentials', { status: 401 });
            }

            if (path === '/admin/config') {
                if (!(await isAuthenticated(request))) {
                    return new Response('Unauthorized', { status: 401 });
                }

                if (request.method === 'GET') {
                    const config = await env.SITE_CONFIG.get('config') || '{}';
                    return new Response(config, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                if (request.method === 'POST') {
                    const body = await request.json();
                    await env.SITE_CONFIG.put('config', JSON.stringify(body));
                    return new Response(JSON.stringify({ message: 'Config updated' }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            if (path === '/admin/stats') {
                if (!(await isAuthenticated(request))) {
                    return new Response('Unauthorized', { status: 401 });
                }

                // Mock stats data
                const stats = {
                    totalRequests: Math.floor(Math.random() * 10000),
                    activeUsers: Math.floor(Math.random() * 100),
                    storageUsed: Math.floor(Math.random() * 1000000),
                    lastUpdated: new Date().toISOString()
                };

                return new Response(JSON.stringify(stats), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (path === '/admin/webhook' && request.method === 'POST') {
                const signature = request.headers.get('X-Webhook-Signature');
                // In real app, verify webhook signature using env.WEBHOOK_SECRET
                
                const body = await request.json();
                console.log('Webhook received:', body);
                
                // Process webhook (e.g., deploy trigger, cache invalidation)
                return new Response(JSON.stringify({ message: 'Webhook processed' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Default admin interface
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Admin Dashboard</title>
                    <link rel="stylesheet" href="/styles.css">
                    <link rel="stylesheet" href="/admin/dashboard.css">
                </head>
                <body>
                    <h1>Admin Dashboard</h1>
                    <div class="admin-grid">
                        <div class="admin-card">
                            <h2>Site Statistics</h2>
                            <div id="stats">Loading...</div>
                        </div>
                        <div class="admin-card">
                            <h2>Configuration</h2>
                            <textarea id="config" placeholder="Site configuration JSON"></textarea>
                            <button onclick="updateConfig()">Update Config</button>
                        </div>
                    </div>
                    <script>
                        // Mock admin interface
                        const token = localStorage.getItem('adminToken');
                        if (!token) {
                            const password = prompt('Enter admin password:');
                            if (password) {
                                fetch('/admin/login', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ password })
                                })
                                .then(r => r.json())
                                .then(data => {
                                    localStorage.setItem('adminToken', data.token);
                                    location.reload();
                                });
                            }
                        }

                        function updateConfig() {
                            const config = document.getElementById('config').value;
                            fetch('/admin/config', {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
                                },
                                body: config
                            })
                            .then(r => r.json())
                            .then(data => alert(data.message));
                        }
                    </script>
                </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html' }
            });

        } catch (error) {
            return new Response(`Admin Error: ${error.message}`, { status: 500 });
        }
    }
};