import crypto from 'crypto'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
dotenv.config()

console.log(process.env.ENCRYPTION_KEY)
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
console.log('KEY', key)

const encryptFile = async (finalpath, emitter) => {
    emitter.emit('encrypt-start')
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)

    const encrytfiledir = path.join('encrytfile')
    if (!fs.existsSync(encrytfiledir)) fs.mkdirSync(encrytfiledir, { recursive: true });

    const encryptedFilePath = path.join(encrytfiledir, path.basename(finalpath));

    await new Promise((resolve, reject) => {
        const input = fs.createReadStream(finalpath)
        const output = fs.createWriteStream(encryptedFilePath)
        input.pipe(cipher).pipe(output)
        output.on('finish', resolve);
        output.on('error', reject);
    })

    emitter.emit('encrypt-finish')
    return { encryptedFilePath, iv: iv.toString('hex') };
}

export default encryptFile