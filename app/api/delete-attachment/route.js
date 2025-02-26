import { NextResponse } from 'next/server';
import cloudinary from '@/config/cloudinary';
import { corsHeaders } from '@/config/cors';

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        let publicId = searchParams.get('public_id');

        console.log("🗑️ Received Public ID (Raw):", publicId);

        if (!publicId) {
            return new Response(JSON.stringify({ message: 'Missing public_id' }), {
                status: 400,
                headers: corsHeaders(),
            });
        }

        // ✅ Decode URL to handle spaces & special characters properly
        publicId = decodeURIComponent(publicId);
        console.log("🗑️ Normalized Public ID for Deletion:", publicId);

        // ✅ Determine resource type based on file extension
        let resourceType = "image"; // Default to image
        if (publicId.match(/\.(pdf|doc|docx)$/i)) {
            resourceType = "raw";
        }

        console.log(`🔍 Deleting as resource_type: ${resourceType}`);

        // ✅ Delete the file from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

        console.log("✅ Delete Result:", result);

        if (result.result !== 'ok') {
            return new Response(JSON.stringify({ message: 'Failed to delete file from Cloudinary' }), {
                status: 500,
                headers: corsHeaders(),
            });
        }

        return new Response(JSON.stringify({ message: 'File deleted successfully' }), {
            status: 200,
            headers: corsHeaders(),
        });

    } catch (error) {
        console.error('🚨 Delete File Error:', error);
        return new Response(JSON.stringify({ message: 'Failed to delete file' }), {
            status: 500,
            headers: corsHeaders(),
        });
    }
}

// ✅ Ensure CORS for preflight requests
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(),
    });
};
