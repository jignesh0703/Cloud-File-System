import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import sharp from "sharp";
import path from 'path'

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

async function CompressFile(filepath, socket, totalFiles, CompletedUploads, sessionId, emitter) {
    const ext = path.extname(filepath).slice(1).toLowerCase()
    const outputPath = filepath.replace(/(\.\w+)$/, '_compressed$1');
    emitter.emit('file-compress-start')

    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
        await sharp(filepath)
            .jpeg({ quality: 90 })
            .toFile(outputPath);
        return outputPath;
    }

    if (['mp4', 'webm', 'avi'].includes(ext)) {
        return new Promise((resolve, reject) => {
            if (socket && CompletedUploads[sessionId]) {
                socket.emit('compress-process', {
                    percent: 54,
                    currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
                    TotalFile: totalFiles
                });
            }

            ffmpeg(filepath)
                .outputOptions([
                    '-vcodec libx264',
                    '-crf 23',
                    '-preset fast',
                    '-acodec aac',
                    '-b:a 128k'
                ])
                .save(outputPath)
                .on('end', () => {
                    emitter.emit('file-compress-end')
                    if (socket && CompletedUploads[sessionId]) {
                        socket.emit('compress-process', {
                            percent: 60,
                            currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
                            TotalFile: totalFiles
                        });
                    }
                    resolve(outputPath)
                })
                .on('error', reject);
        });
    }
    return filepath;
}

export default CompressFile