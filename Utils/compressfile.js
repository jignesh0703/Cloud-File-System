import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import sharp from "sharp";
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

async function CompressFile(filepath, io, totalFiles, CompletedUploads, sessionId, emitter, clientSocketId) {
    const ext = path.extname(filepath).slice(1).toLowerCase();
    const outputPath = filepath.replace(/(\.\w+)$/, '_compressed$1');
    emitter.emit('file-compress-start');

    // Image compression
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
        await sharp(filepath)
            .jpeg({ quality: 90 })
            .toFile(outputPath);

        emitter.emit('file-compress-end');
        if (io && clientSocketId && CompletedUploads[sessionId]) {
            io.to(clientSocketId).emit('compress-process', {
                percent: 60,
                currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
                TotalFile: totalFiles
            });
        }
        return outputPath;
    }

    // Video compression
    if (['mp4', 'webm', 'avi'].includes(ext)) {
        let videoOptions = [];
        // Choose codec based on extension
        if (ext === 'mp4' || ext === 'avi') {
            videoOptions = ['-vcodec libx264', '-crf 23', '-preset fast', '-acodec libmp3lame', '-b:a 128k'];
        } else if (ext === 'webm') {
            videoOptions = ['-vcodec libvpx', '-crf 23', '-b:v 1M', '-acodec libvorbis', '-b:a 128k'];
        }

        return new Promise((resolve, reject) => {
            if (io && clientSocketId && CompletedUploads[sessionId]) {
                io.to(clientSocketId).emit('compress-process', {
                    percent: 54,
                    currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
                    TotalFile: totalFiles
                });
            }

            ffmpeg(filepath)
                .outputOptions(videoOptions)
                .save(outputPath)
                .on('end', () => {
                    emitter.emit('file-compress-end');
                    if (io && clientSocketId && CompletedUploads[sessionId]) {
                        io.to(clientSocketId).emit('compress-process', {
                            percent: 60,
                            currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
                            TotalFile: totalFiles
                        });
                    }
                    resolve(outputPath);
                })
                .on('error', reject);
        });
    }

    return filepath;
}

export default CompressFile;