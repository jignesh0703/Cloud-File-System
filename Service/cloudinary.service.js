import Cloudinary_Upload from '../Clouds/cloudanary.js'
import cloudinary from 'cloudinary'
import dotenv from 'dotenv'
dotenv.config()

class Cloudanary {
    constructor(credentials) {
        cloudinary.config({
            cloud_name: credentials?.cloudinaryName || process.env.CLOUDINARY_NAME,
            api_key: credentials?.cloudinaryKey || process.env.CLOUDINARY_KEY,
            api_secret: credentials?.cloudinarySecret || process.env.CLOUDINARY_SECRET
        });
    }

    async fileUpload(filepath, socket, CompletedUploads, sessionId, TotalFile) {
        try {
            const response = await Cloudinary_Upload(
                filepath,
                socket,
                CompletedUploads,
                sessionId,
                TotalFile
            );
            return response;
        } catch (error) {
            throw error;
        }
    }
}

export default new Cloudanary()