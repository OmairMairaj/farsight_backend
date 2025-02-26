import cloudinary from '@/config/cloudinary';
import { corsHeaders } from '@/config/cors';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return new Response(JSON.stringify({ message: 'No file uploaded' }), {
                status: 400,
                headers: corsHeaders(),
            });
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const base64File = Buffer.from(bytes).toString('base64');
        const dataUri = `data:${file.type};base64,${base64File}`;

        // Upload to Cloudinary
        const uploadRes = await cloudinary.uploader.upload(dataUri, {
            folder: 'categories',
            resource_type: 'image',
        });

        console.log(uploadRes);

        return new Response(JSON.stringify({
            message: 'Image uploaded successfully',
            url: uploadRes.secure_url,
        }), {
            status: 201,
            headers: corsHeaders(), // ✅ Ensure CORS headers are included
        });

    } catch (error) {
        console.error('Upload Error:', error);
        return new Response(JSON.stringify({ message: 'Failed to upload image' }), {
            status: 500,
            headers: corsHeaders(),
        });
    }
}

// ✅ Handle OPTIONS method for CORS preflight requests
export async function OPTIONS() {
    return new Response(null, {
        headers: corsHeaders(),
        status: 204,
    });
}
