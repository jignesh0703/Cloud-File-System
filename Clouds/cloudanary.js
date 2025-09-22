import cloudinary from 'cloudinary';

async function Cloudinary_Upload(filepath, socket, CompletedUploads, sessionId, TotalFile, emitter) {
    try {
        emitter.emit('file-upload-start', { provider: 'cloudinary' })
        if (socket) socket.emit('cloud-upload-progress', {
            percent: 60,
            currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
            TotalFile
        });

        let fakePercent = 60;
        let interval;

        if (socket) {
            interval = setInterval(() => {
                fakePercent += Math.random() * 2;
                if (fakePercent >= 95) fakePercent = 95;
                socket.emit('cloud-upload-progress', {
                    percent: fakePercent.toFixed(2),
                    currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
                    TotalFile
                });
                emitter.emit('file-uploading-cloud-track', { percent: fakePercent.toFixed(2) })
            }, 500);
        }

        const result = await cloudinary.v2.uploader.upload(filepath, {
            folder: "uploads",
            resource_type: "auto",
            type: "authenticated"
        });

        if (interval) clearInterval(interval);

        const sign_url = cloudinary.v2.url(result.public_id + "." + result.format, {
            type: "authenticated",
            resource_type: result.resource_type,
            sign_url: true,
            secure: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600 // 1h
        });

        emitter.emit('upload-complete-end', { provider: 'cloudinary' })
        if (socket) socket.emit('cloud-upload-progress', {
            percent: 100,
            currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
            TotalFile: TotalFile
        });


        return {
            extention: result.format,
            size: result.bytes,
            sign_url,
            public_id: result.public_id,
            expiry: "1h",
            provider: 'cloudinary',
        };
    } catch (error) {
        throw error
    }
}

async function Cloudanary_Read(public_id, extention) {
    try {
        function getSignedUrl(public_id, resource_type = "auto", extention) {
            return cloudinary.v2.url(`${public_id}.${extention}`, {
                type: "authenticated",
                resource_type: resource_type,
                sign_url: true,
                secure: true,
                expires_at: Math.floor(Date.now() / 1000) + 3600
            });
        }
        const signedUrl = getSignedUrl(public_id, 'video', extention);
        return signedUrl

    } catch (error) {
        console.error(error);
        throw error
    }
}

async function Cloudanary_Delete(public_id) {
    try {
        const result = await cloudinary.v2.uploader.destroy(public_id, {
            type: 'authenticated',
            resource_type: 'video'
        })
        return result
    } catch (error) {
        throw error
    }
}

export {
    Cloudinary_Upload,
    Cloudanary_Read,
    Cloudanary_Delete
}