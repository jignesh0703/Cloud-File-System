import EventEmitter from 'events'

const emitter = new EventEmitter()

emitter.on('start', ({ provider }) => {
    console.log(`🚀 Upload started → Provider: ${provider}`)
})

emitter.on('chunk-uplaod', ({ chunkindex, totalchunk, percent }) => {
    console.log(`📦 Chunk ${chunkindex + 1}/${totalchunk} stored (${percent}%)`)
})

emitter.on('file-merge-start', () => {
    console.log("🔗 File merging started...")
})

emitter.on('file-merge-track', ({ mergePercent }) => {
    console.log(`🔗 Merge progress → ${mergePercent}%`)
})

emitter.on('file-merge-end', () => {
    console.log("✅ File merging completed")
})

emitter.on('file-compress-start', () => {
    console.log("🗜️ Compression started...")
})

emitter.on('file-compress-end', () => {
    console.log("✅ Compression completed")
})

emitter.on('file-upload-start', ({ provider }) => {
    console.log(`☁️ Uploading file to ${provider}...`)
})

emitter.on('file-uploading-cloud-track', ({ percent }) => {
    console.log(`☁️ Upload progress: ${percent}%`);
})

emitter.on('upload-complete-end', ({ provider }) => {
    console.log(`✅ File successfully uploaded to ${provider}`)
})

emitter.on('finish-upload', () => {
    console.log("🎉 All files uploaded successfully!")
})

emitter.on('upload-error', ({ err }) => {
    console.log("❌ Upload failed:", err)
})

emitter.on('downloading-from-url', () => {
    console.log(`⬇️ Downloading file from URL...`)
})

emitter.on('downloading-from-url-done', () => {
    console.log(`✅ File downloaded from URL`)
})

emitter.on('fetch-file', ({ sign_url }) => {
    console.log(`File fetch from cloud succesfully, Sign URL : ${sign_url}`)
})

emitter.on('delete-file', () => {
    console.log('File deleted from cloud SUccesfully!')
})

emitter.on('fetch-deleted-file', () => {
    console.log('Fetch All deleted files')
})

emitter.on('restore-file', () => {
    console.log('Restore deleted file')
})

emitter.on('encrypt-start', () => {
    console.log(`🔐 Encryption started`);
});

emitter.on('encrypt-finish', () => {
    console.log(`✅ Encryption finished`);
});

emitter.on('decrypt-start', () => {
    console.log(`🔓 Decryption started`);
});

emitter.on('decrypt-finish', () => {
    console.log(`✅ Decryption finished`);
});

export default emitter