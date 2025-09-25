import AWS from 'aws-sdk'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcrypt'

let s3

function initS3(credentials) {
    console.log('AWS works....')
    s3 = new AWS.S3({
        accessKeyId: credentials?.AccessKeyId || process.env.AWS_ACCESSKEYID,
        secretAccessKey: credentials?.SecretAccessKey || process.env.AWS_SECRETACCESSKEY,
        region: credentials?.Region || process.env.AWS_REGION
    });
    console.log()
    return s3
}

async function GetSign_url(filename, bucket, expiresIn = 3600) {
    const params = {
        Bucket: bucket,
        Key: filename,
        Expires: expiresIn
    }
    const url = s3.getSignedUrl('getObject', params)
    return url
}

async function UploadToAWS(filepath, io, CompletedUploads, sessionId, TotalFile, emitter, bucket, clientSocketId, hash) {
    try {
        if (io && clientSocketId) io.to(clientSocketId).emit('cloud-upload-progress', {
            percent: 60,
            currentFileIndex: CompletedUploads[sessionId]?.currentFileIndex,
            TotalFile
        });
        const fileContext = fs.readFileSync(filepath)
        const filename = Date.now() + '-' + path.basename(filepath)

        const params = {
            Bucket: bucket,
            Key: filename,
            Body: fileContext,
            ACL: 'private',
            Metadata: {
                passwordHash: hash
            }
        }

        let fakePercent = 60;
        let interval;
        if (io && clientSocketId) {
            interval = setInterval(() => {
                fakePercent += Math.random() * 2;
                if (fakePercent >= 95) fakePercent = 95;
                io.to(clientSocketId).emit('cloud-upload-progress', {
                    percent: fakePercent.toFixed(2),
                    currentFileIndex: CompletedUploads[sessionId]?.currentFileIndex,
                    TotalFile
                });
                emitter.emit('file-uploading-cloud-track', { percent: fakePercent.toFixed(2) })
            }, 500);
        }

        await s3.upload(params).promise()
        if (interval) clearInterval(interval);

        if (io && clientSocketId) io.to(clientSocketId).emit('cloud-upload-progress', {
            percent: 100,
            currentFileIndex: CompletedUploads[sessionId].currentFileIndex,
            TotalFile: TotalFile
        });

        return {
            extention: filename.split('.').pop(),
            size: fileContext.length,
            sign_url: await GetSign_url(filename, bucket),
            public_id: filename,
            expiry: "1h",
            provider: 'aws',
        };
    } catch (error) {
        throw error
    }
}

async function Read_Aws(public_id, extention, bucket, password) {
    try {
        const head = await s3.headObject({
            Bucket: bucket,
            Key: public_id
        }).promise()

        const storehashpass = head.Metadata.passwordhash

        const isMatch = await bcrypt.compare(password, storehashpass)
        if (!isMatch) throw new Error('Incorrect password!')

        const Sign_url = await GetSign_url(public_id, bucket)
        return Sign_url
    } catch (error) {
        throw error
    }
}

async function Delete_AWS(public_id, bucket) {
    try {
        const params = {
            Bucket: bucket,
            Key: public_id
        }
        await s3.deleteObject(params).promise()
        return { message: `File ${public_id} deleted successfully`, public_id };
    } catch (error) {
        throw error
    }
}

async function FetchAllDeletedFile(bucket, prefix = '') {
    try {
        const param = {
            Bucket: bucket,
            Prefix: prefix
        }
        const AllFile = await s3.listObjectVersions(param).promise()
        return AllFile
    } catch (error) {
        throw error
    }
}

async function RestoreDeletedFile(bucket, key, versionid) {
    try {
        const param = {
            Bucket: bucket,
            Key: key,
            VersionId: versionid
        }
        await s3.deleteObject(param).promise()
        return { message: `File ${key} deleted successfully` }
    } catch (error) {
        throw error
    }
}

export {
    initS3,
    UploadToAWS,
    Read_Aws,
    Delete_AWS,
    FetchAllDeletedFile,
    RestoreDeletedFile
}