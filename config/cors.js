export function corsHeaders(origin) {
    const allowedOrigins = [
        process.env.NEXT_PUBLIC_FRONTEND_URL,  // ✅ Your frontend URL from .env
        'http://localhost:3000',              // ✅ Local frontend
        'http://localhost:3001'               // ✅ Alternate localhost port
    ].filter(Boolean); // ✅ Removes undefined values

    return {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };
}