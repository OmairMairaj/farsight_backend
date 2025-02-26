import cloudinary from '@/config/cloudinary';
import { corsHeaders } from '@/config/cors';

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const publicId = searchParams.get('public_id');

        if (!publicId) {
            return new Response(JSON.stringify({ message: 'Missing public_id' }), {
                status: 400,
                headers: corsHeaders(), // ✅ Ensure CORS headers are included
            });
        }

        // ✅ Delete the image from Cloudinary
        const result = await cloudinary.uploader.destroy(`categories/${publicId}`);

        if (result.result !== 'ok') {
            return new Response(JSON.stringify({ message: 'Failed to delete image from Cloudinary' }), {
                status: 500,
                headers: corsHeaders(),
            });
        }

        return new Response(JSON.stringify({ message: 'Image deleted successfully' }), {
            status: 200,
            headers: corsHeaders(), // ✅ Fix: Include CORS headers in the success response
        });

    } catch (error) {
        console.error('Delete Image Error:', error);
        return new Response(JSON.stringify({ message: 'Failed to delete image' }), {
            status: 500,
            headers: corsHeaders(), // ✅ Fix: Include CORS headers in the error response
        });
    }
}

// ✅ Ensure CORS for preflight requests
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(),
    });
}
