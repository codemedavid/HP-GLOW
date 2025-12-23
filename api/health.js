export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({
            status: 'error',
            message: 'Missing Supabase configuration'
        });
    }

    try {
        // Simple query to check database health - counts products
        const response = await fetch(`${supabaseUrl}/rest/v1/products?select=count`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'count=exact'
            }
        });

        if (!response.ok) {
            throw new Error(`Database responded with status: ${response.status}`);
        }

        const timestamp = new Date().toISOString();

        return res.status(200).json({
            status: 'healthy',
            message: 'Database is active and responding',
            timestamp,
            supabase_project: supabaseUrl.replace('https://', '').split('.')[0]
        });
    } catch (error) {
        console.error('Health check failed:', error);

        return res.status(503).json({
            status: 'unhealthy',
            message: 'Database health check failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
