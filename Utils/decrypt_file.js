import crypto from "crypto";
import dotenv from 'dotenv'
import { PassThrough, Readable } from "stream";
dotenv.config()

const DecrptFile = async (sign_url, ivHex, emitter) => {
    emitter.emit('decrypt-start')
    const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex"); // 32 bytes
    const iv = Buffer.from(ivHex, "hex"); // 16 bytes

    const response = await fetch(sign_url);
    if (!response.ok) throw new Error("Failed to fetch encrypted file from AWS");

    // Convert Web ReadableStream → Node.js Readable
    const nodeStream = Readable.fromWeb(response.body);

    // Create decipher
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    // Pipe decryption
    const passthrough = new PassThrough();
    nodeStream.pipe(decipher).pipe(passthrough);

    emitter.emit('decrypt-finish')
    return passthrough; // Node.js stream back
};

export default DecrptFile