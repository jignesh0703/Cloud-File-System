import fs from 'fs'
import path from 'path'

function MergeChunks(socket, finalpath, totalchunk, TempDir, CompletedUploads, sessionId, TotalFiles, emitter) {
    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(finalpath);

        let mergedChunksPer = 0
        emitter.emit('file-merge-start')

        for (let i = 0; i < totalchunk; i++) {
            const chunkFile = path.join(TempDir, `chunk_${i}`);
            const data = fs.readFileSync(chunkFile);
            writeStream.write(data);
            fs.unlinkSync(chunkFile);

            mergedChunksPer++;
            const startPercent = 30; // already completed 30%
            const endPercent = 50;   // merge contributes up to 50%

            const mergePercent = (startPercent + ((mergedChunksPer / totalchunk) * (endPercent - startPercent))).toFixed(2);
            emitter.emit('file-merge-track', { mergePercent })

            if (socket) socket.emit('merge-process', {
                mergePercent,
                currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
                TotalFile: TotalFiles
            })
        }

        writeStream.end();
        writeStream.on("finish", () => {
            fs.rmSync(TempDir, { recursive: true, force: true })
            if (socket) socket.emit('merge-done', {
                currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
                message: 'Merging Completed!',
                TotalFile: TotalFiles
            })
            emitter.emit('file-merge-end')
            resolve();
        });

        writeStream.on("error", (err) => reject(err));
    });
}

export default MergeChunks