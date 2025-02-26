export function corsHeaders(origin) {
    const allowedOrigins = [
        process.env.NEXT_PUBLIC_FRONTEND_URL,
        'https://farsight-frontend.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
    ].filter(Boolean);

    console.log("Request Origin:", origin);
    console.log("Allowed Origins:", allowedOrigins);

    const isAllowed = allowedOrigins.includes(origin);

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0] || 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };
}