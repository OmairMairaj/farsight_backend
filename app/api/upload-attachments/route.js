import cloudinary from '@/config/cloudinary';
import { corsHeaders } from '@/config/cors';

export async function POST(req) {
    try {
        const contentType = req.headers.get('content-type') || '';

        if (!contentType.includes('multipart/form-data')) {
            return new Response(JSON.stringify({ message: 'Invalid content type. Must be multipart/form-data' }), {
                status: 400,
                headers: corsHeaders(),
            });
        }

        const formData = await req.formData();
        const files = formData.getAll('file');

        if (!files || files.length === 0) {
            return new Response(JSON.stringify({ message: 'No files uploaded' }), {
                status: 400,
                headers: corsHeaders(),
            });
        }

        const uploadedFiles = [];

        for (const file of files) {
            const fileBuffer = await file.arrayBuffer();
            const fileStream = Buffer.from(fileBuffer);

            console.log("File: ", file);

            let resourceType = "raw"; // Default: auto-detect type

            // ✅ If it's a PDF, set resource type to "auto" so it can be viewed
            if (file.type.includes("pdf")) {
                resourceType = "raw";
            } else if (file.type.includes("image")) {
                resourceType = "image";
            } else if (file.type.includes("msword") || file.type.includes("officedocument")) {
                resourceType = "raw"; // DOCX/DOC stays as raw
            }

            console.log(`Uploading ${file.name} as ${resourceType}`);

            const uploadPromise = new Promise((resolve, reject) => {
                // ✅ Extract filename without extension
                let fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, ""); // Removes file extension
                let fileExtension = file.name.split('.').pop(); // Extracts extension

                console.log(`Uploading ${file.name} as ${resourceType}`);

                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'stock_attachments',
                        resource_type: resourceType,
                        format: fileExtension,
                        public_id: fileNameWithoutExt, // Keep file name clean
                    },
                    async (error, result) => {
                        if (error) {
                            console.error(`❌ Cloudinary upload failed for ${file.name}:`, error);
                            reject(error);
                        } else {
                            console.log("Result:", result);
                            let previewUrl = null;

                            // ✅ If it's a PDF, use the direct URL for preview
                            if (file.type.includes("pdf")) {
                                previewUrl = result.secure_url.replace("/upload/", "/upload/w_300,h_400,pg_1/");
                            }
                            // ✅ If it's a DOCX/DOC, use a placeholder preview
                            else if (file.name.endsWith(".doc") || file.name.endsWith(".docx")) {
                                previewUrl = "https://cdn-icons-png.flaticon.com/512/337/337932.png";
                            }
                            // ✅ For images, use the uploaded URL itself as a preview
                            else if (file.type.includes("image")) {
                                previewUrl = result.secure_url;
                            }

                            uploadedFiles.push({
                                url: result.secure_url,
                                preview: previewUrl, // ✅ Store preview URL
                                type: file.type,
                                filename: fileNameWithoutExt, //✅ Ensure correct file extension
                                public_id: result.public_id
                            });

                            resolve(result.secure_url);
                        }
                    }
                );

                uploadStream.end(fileStream);
            });

            await uploadPromise;
        }

        console.log(uploadedFiles);

        return new Response(JSON.stringify({
            message: 'Files uploaded successfully',
            urls: uploadedFiles.map(file => file.url), // ✅ Return full file metadata
        }), {
            status: 201,
            headers: corsHeaders(),
        });

    } catch (error) {
        console.error('🚨 Upload Error:', error);
        return new Response(JSON.stringify({ message: 'Failed to upload files' }), {
            status: 500,
            headers: corsHeaders(),
        });
    }
}

// ✅ Handle CORS preflight requests
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(),
    });
}
