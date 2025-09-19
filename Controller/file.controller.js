import fs from 'fs'
import path from 'path'
import MergeChunks from '../Utils/merge_chunk.js';
import CompressFile from '../Utils/compressfile.js';
// import Cloudanary from '../Service/cloudanary.service.js'

const ALLOWED_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'avi'];
const MAX_FILE_SIZE = 1024 * 1024 * 500
let CompletedUploads = {}

const FileUploadController = async (req, res) => {
    try {

        const provider = req.body.provider || process.env.CLOUD_PROVIDER
        const { default: ProviderService } = await import(`../Service/${provider}.service.js`)
        const service = ProviderService

        const socket = req.app.get('io')
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'File is Required!' })
        }

        const filesize = req.body.filesize
        if (filesize > MAX_FILE_SIZE) {
            return res.status(400).json({ message: "Only 50MB files are allowded!" })
        }

        const sessionId = req.body.sessionId
        if (!CompletedUploads[sessionId]) {
            CompletedUploads[sessionId] = {
                files: [],
                currentFileIndex: 0
            };
        }
        for (const file of req.files) {

            CompletedUploads[sessionId].currentFileIndex = CompletedUploads[sessionId].files.length;

            const extension = path.extname(req.body.filename || '').slice(1).toLowerCase();
            if (!ALLOWED_TYPES.includes(extension)) {
                fs.unlinkSync(file.path);
                return res.status(400).json({
                    message: `File extension not allowed: .${extension}`
                });
            }

            const filename = req.body.filename
            const chunkindex = parseInt(req.body.chunkindex, 10)
            const totalchunk = parseInt(req.body.totalchunk, 10)

            const TempDir = path.join('temp', filename)
            if (!fs.existsSync(TempDir)) fs.mkdirSync(TempDir, { recursive: true })

            const ChunkPath = path.join(TempDir, `chunk_${chunkindex}`)
            if (fs.existsSync(ChunkPath)) {
                console.log(`⚠️ Chunk ${chunkindex + 1}/${totalchunk} already exists, skipping...`);
            }

            if (!fs.existsSync(ChunkPath)) {
                fs.copyFileSync(file.path, ChunkPath)
                fs.unlinkSync(file.path)
            }

            const percent = (((chunkindex + 1) / totalchunk) * 30).toFixed(2);

            console.log(`✅ Stored chunk ${chunkindex + 1}/${totalchunk} (${percent}%)`);

            socket.emit('chunk-upload', {
                percent,
                currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
                TotalFile: parseInt(req.body.totalFiles)
            })

            const chunkFiles = fs.readdirSync(TempDir)
            if (chunkFiles.length === totalchunk) {
                console.log("All chunks received, merging:", filename)

                const uploadDir = path.join('upload')
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

                const finalpath = path.join(uploadDir, filename)

                await MergeChunks(
                    socket,
                    finalpath,
                    totalchunk,
                    TempDir,
                    CompletedUploads,
                    sessionId, parseInt(req.body.totalFiles)
                )

                const CompressedFIle = await CompressFile(
                    finalpath,
                    socket,
                    parseInt(req.body.totalFiles),
                    CompletedUploads,
                    sessionId
                )

                const { sign_url, extention, size, public_id, expiry, provider } = await service.fileUpload(
                    CompressedFIle,
                    socket,
                    CompletedUploads,
                    sessionId,
                    parseInt(req.body.totalFiles)
                );

                function FormatBytes(bytes, decimals = 2) {
                    if (bytes === 0) return '0 Bytes'
                    const k = 1024
                    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
                }

                CompletedUploads[sessionId].files.push({
                    filename,
                    sign_url,
                    extention,
                    size: FormatBytes(size),
                    public_id,
                    expiry,
                    provider
                });

                fs.unlinkSync(finalpath)
                if (CompressedFIle !== finalpath) {
                    fs.unlinkSync(CompressedFIle);
                }
                console.log(`File merged & uploaded: ${filename}`)
            }
        }

        if (CompletedUploads[sessionId].files.length === parseInt(req.body.totalFiles, 10)) {
            const result = CompletedUploads[sessionId]
            delete CompletedUploads[sessionId] // cleanup

            if (socket) socket.emit('all-files-complete', { sessionId, data: result });
            return res.status(200).json({
                message: "All files uploaded successfully",
                data: result
            })
        }

        return res.status(200).json({ message: `Chunk uploaded` })

    } catch (err) {
        console.error("❌ Upload error:", err)
        return res.status(500).json({ message: 'Something went wrong, try again!' })
    }
}

const ReadFile = async (req, res) => {
    try {
        const provider = req.body.provider
        console.log(provider)

        if (provider === 'cloudinary') {
            return Cloudanary.ReadFile(req, res)
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Something went wrong, try again!' })
    }
}

export {
    FileUploadController,
    ReadFile
}