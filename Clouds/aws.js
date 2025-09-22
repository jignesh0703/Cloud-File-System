import AWS from 'aws-sdk'
import fs from 'fs'

let s3

function initS3(credentials) {
    console.log('AWS works....')
    s3 = new AWS.S3({
        accessKeyId: credentials?.AccessKeyId || process.env.AWS_ACCESSKEYID,
        secretAccessKey: credentials?.SecretAccessKey || process.env.AWS_SECRETACCESSKEY,
        region: credentials?.Region || process.env.AWS_REGION
    });
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

async function UploadToAWS(filepath, socket, CompletedUploads, sessionId, TotalFile, bucket) {
    try {
        const fileContext = fs.readFileSync(filepath)
        const filename = Date.now() + '-' + filepath.split('/').pop()

        const params = {
            Bucket: bucket,
            Key: filename,
            Body: fileContext,
            ACL: 'private'
        }

        await s3.upload(params).promise()

        if (socket) socket.emit('cloud-upload-progress', {
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

async function Read_Aws(public_id, extention, bucket) {
    try {
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