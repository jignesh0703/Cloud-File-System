import fs from 'fs'
import path from 'path'
import MergeChunks from '../Utils/merge_chunk.js';
import CompressFile from '../Utils/compressfile.js';
import axios from 'axios';
import emitter from '../Emitter/emiiter.js';

const ALLOWED_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'avi'];
const MAX_FILE_SIZE = 1024 * 1024 * 500
let CompletedUploads = {}

const FileUploadController = async (req, res) => {
    try {
        const provider = req.body.provider || process.env.CLOUD_PROVIDER
        const totalFiles = parseInt(req.body.totalFiles) || 1;
        const { default: ProviderService } = await import(`../Service/${provider}.service.js`)
        const service = ProviderService

        emitter.emit('start', { provider })

        const sessionId = req.body.sessionId
        if (!CompletedUploads[sessionId]) {
            CompletedUploads[sessionId] = {
                files: [],
                currentFileIndex: 0
            };
        }

        const io = req.app.get('io')
        const clientSocketId = req.body.socketId;

        if (req.body.fileURL) {
            console.log('Processing via URL...')

            const fileUrl = req.body.fileURL
            const headcheck = await axios.head(fileUrl)
            const MAX_FILE_SIZE = 50 * 1024 * 1024;
            const contentLength = parseInt(headcheck.headers['content-length'], 10)
            if (contentLength && contentLength > MAX_FILE_SIZE) {
                return res.status(400).json({ message: 'File size exceeds 50MB limit' })
            }

            const filename = `file_${Date.now()}${path.extname(fileUrl).split('?')[0]}`
            const filepath = path.join('upload', filename)
            fs.mkdirSync(path.dirname(filepath), { recursive: true })

            const socketProgress = () => {
                io.to(clientSocketId)?.emit('chunk-upload', {
                    percent: 20,
                    currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
                    TotalFile: totalFiles
                })
            }

            try {
                emitter.emit('downloading-from-url')
                const response = await axios.get(fileUrl, { responseType: 'stream' })
                emitter.emit('downloading-from-url-done')
                await new Promise((resolve, reject) => {
                    const writer = fs.createWriteStream(filepath)
                    response.data.pipe(writer)
                    writer.on('finish', resolve)
                    writer.on('error', reject)
                })

                socketProgress()

                const compressedFile = await CompressFile(
                    filepath,
                    io,
                    totalFiles,
                    CompletedUploads,
                    sessionId,
                    emitter,
                    clientSocketId
                )

                const { sign_url, extention, size, public_id, expiry, provider } = await service.fileUpload(
                    compressedFile,
                    io,
                    CompletedUploads,
                    sessionId,
                    totalFiles,
                    emitter,
                    clientSocketId
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

                // clean up
                fs.unlinkSync(filepath)
                if (compressedFile !== filepath) fs.unlinkSync(compressedFile)

                if (clientSocketId) {
                    io.to(clientSocketId)?.emit('all-files-complete', { sessionId, data: CompletedUploads[sessionId] })
                }

                return res.status(200).json({
                    message: "File uploaded successfully from URL",
                    data: CompletedUploads[sessionId]
                })

            } catch (err) {
                emitter.emit('upload-error', { err })
                return res.status(500).json({ message: "Failed to upload file from URL", error: err })
            }
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'File is Required!' })
        }

        const filesize = req.body.filesize
        if (filesize > MAX_FILE_SIZE) {
            return res.status(400).json({ message: "Only 500MB files are allowded!" })
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
            const filesize = req.body.filesize
            const lastModified = req.body.lastModified
            const chunkindex = parseInt(req.body.chunkindex, 10)
            const totalchunk = parseInt(req.body.totalchunk, 10)

            const TempDirName = `${filename}-${filesize}-${lastModified}`.replace(/[^a-zA-Z0-9-_\.]/g, '_');
            const TempDir = path.join('temp', TempDirName)
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

            emitter.emit('chunk-uplaod', { chunkindex, totalchunk, percent })
            if (clientSocketId) {
                io.to(clientSocketId).emit('chunk-upload', {
                    percent,
                    currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
                    TotalFile: totalFiles
                })
            }

            const chunkFiles = fs.readdirSync(TempDir)
            if (chunkFiles.length === totalchunk) {

                const uploadDir = path.join('upload')
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

                const finalpath = path.join(uploadDir, filename) /// add UUID or timestramp

                await MergeChunks(
                    io,
                    finalpath,
                    totalchunk,
                    TempDir,
                    CompletedUploads,
                    sessionId,
                    totalFiles,
                    emitter,
                    clientSocketId
                )

                const CompressedFile = await CompressFile(
                    finalpath,
                    io,
                    totalFiles,
                    CompletedUploads,
                    sessionId,
                    emitter,
                    clientSocketId
                )

                const { sign_url, extention, size, public_id, expiry, provider } = await service.fileUpload(
                    CompressedFile,
                    io,
                    CompletedUploads,
                    sessionId,
                    totalFiles,
                    emitter,
                    clientSocketId
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


                // also update thus part 
                try {
                    if (fs.existsSync(finalpath)) {
                        fs.unlinkSync(finalpath)
                    }
                } catch (err) {
                    console.warn('Could not delete file (maybe busy):', finalpath)
                }
                if (CompressedFile !== finalpath) {
                    fs.unlinkSync(CompressedFile);
                }
            }
        }

        if (CompletedUploads[sessionId].files.length === totalFiles) {
            const result = CompletedUploads[sessionId]
            delete CompletedUploads[sessionId] // cleanup
            if (clientSocketId) {
                io.to(clientSocketId).emit('all-files-complete', { sessionId, data: result });
            }
            emitter.emit('finish-upload')
            return res.status(200).json({
                message: "All files uploaded successfully",
                data: result
            })
        }

        return res.status(200).json({ message: `Chunk uploaded` })

    } catch (err) {
        emitter.emit('upload-error', { err })
        return res.status(500).json({ message: 'Something went wrong, try again!' })
    }
}

const ReadFile = async (req, res) => {
    try {
        const provider = req.body.provider || process.env.CLOUD_PROVIDER
        const { default: ProviderService } = await import(`../Service/${provider}.service.js`)
        const service = ProviderService

        const extention = req.body.extention
        const public_id = req.body.public_id
        if (!public_id) {
            return res.status(400).json({ message: 'Public id id required!' })
        }

        const responce = await service.ReadFile(public_id, extention)
        emitter.emit('fetch-file', { sign_url: responce })
        return res.status(200).json({
            message: 'File Fetch Succesfully!',
            data: {
                sign_url: responce
            }
        })

    } catch (error) {
        emitter.emit('upload-error', { err })
        return res.status(500).json({ message: 'Something went wrong, try again!' })
    }
}

const DeleteFile = async (req, res) => {
    try {
        const provider = req.body.provider || process.env.CLOUD_PROVIDER
        const { default: ProviderService } = await import(`../Service/${provider}.service.js`)
        const service = ProviderService

        const public_id = req.body.public_id
        if (!public_id) {
            return res.status(400).json({ message: 'Public id id required!' })
        }

        const responce = await service.DeleteFile(public_id)
        emitter.emit('delete-file')
        return res.status(200).json({
            message: 'File Delete Succesfully!',
            data: {
                responce
            }
        })

    } catch (error) {
        emitter.emit('upload-error', { err })
        return res.status(500).json({ message: 'Something went wrong, try again!' })
    }
}

const FetchAllDeletedFileController = async (req, res) => {
    try {
        const provider = req.body.provider || process.env.CLOUD_PROVIDER
        const { default: ProviderService } = await import(`../Service/${provider}.service.js`)
        const service = ProviderService

        const responce = await service.FetchAllDeletedFiles()
        emitter.emit('fetch-deleted-file')
        return res.status(200).json({
            message: 'Deleted file fetch Succesfully!',
            data: {
                responce
            }
        })

    } catch (error) {
        emitter.emit('upload-error', { error })
        console.log(error)
        return res.status(500).json({ message: 'Somthinkg went wrong, try again!' })
    }
}

const RestoreDeletedFileController = async (req, res) => {
    try {
        const provider = req.body.provider
        const { default: ProviderService } = await import(`../Service/${provider}.service.js`)
        const service = ProviderService

        const { public_id, versionid } = req.body

        const responce = await service.RestoreDeleteFile(public_id, versionid)
        emitter.emit('restore-file')
        return res.status(200).json({
            message: 'Deleted File Restore Succesfully!',
            data: {
                responce
            }
        })

    } catch (err) {
        emitter.emit('upload-error', { err })
        return res.status(500).json({ message: 'Somthinkg went wrong, try again!' })
    }
}

export {
    FileUploadController,
    ReadFile,
    DeleteFile,
    FetchAllDeletedFileController,
    RestoreDeletedFileController
}