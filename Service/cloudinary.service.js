import { Cloudinary_Upload, Cloudanary_Read, Cloudanary_Delete } from '../Clouds/cloudanary.js'
import cloudinary from 'cloudinary'
import dotenv from 'dotenv'
import cloud_service from './cloud_service.js';
dotenv.config()

export class Cloudanary extends cloud_service{
    constructor(credentials) {
        super();
        cloudinary.config({
            cloud_name: credentials?.cloudinaryName || process.env.CLOUDINARY_NAME,
            api_key: credentials?.cloudinaryKey || process.env.CLOUDINARY_KEY,
            api_secret: credentials?.cloudinarySecret || process.env.CLOUDINARY_SECRET
        });
    }

    async fileUpload(filepath, socket, CompletedUploads, sessionId, TotalFile, emitter) {
        try {
            const response = await Cloudinary_Upload(
                filepath,
                socket,
                CompletedUploads,
                sessionId,
                TotalFile,
                emitter
            );
            return response;
        } catch (error) {
            throw error;
        }
    }

    async ReadFile(public_id, extention) {
        try {
            const responce = await Cloudanary_Read(public_id, extention)
            return responce
        } catch (error) {
            throw error
        }
    }

    async DeleteFile(public_id) {
        try {
            const responce = Cloudanary_Delete(public_id)
            return responce
        } catch (error) {
            throw error
        }
    }
}