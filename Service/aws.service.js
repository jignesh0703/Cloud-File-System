import { Delete_AWS, FetchAllDeletedFile, initS3, Read_Aws, UploadToAWS, RestoreDeletedFile } from '../Clouds/aws.js';

class AWSService {
    constructor(credentials) {
        this.s3 = initS3(credentials)
        this.bucket = credentials?.bucket || process.env.AWS_BUCKET
    }

    async fileUpload(filepath, io, CompletedUploads, sessionId, TotalFile, emitter, clientSocketId, hash, iv) {
        try {
            const responce = await UploadToAWS(filepath, io, CompletedUploads, sessionId, TotalFile, emitter, this.bucket, clientSocketId, hash, iv)
            return responce
        } catch (error) {
            throw error
        }
    }

    async ReadFile(public_id, extention, password) {
        try {
            const responce = await Read_Aws(public_id, extention, this.bucket, password)
            return responce
        } catch (error) {
            throw error
        }
    }

    async DeleteFile(public_id) {
        try {
            const response = await Delete_AWS(public_id, this.bucket)
            return response
        } catch (error) {
            throw error
        }
    }

    async FetchAllDeletedFiles() {
        try {
            const responce = await FetchAllDeletedFile(this.bucket)
            return responce
        } catch (error) {
            throw error
        }
    }

    async RestoreDeleteFile(public_id, versionid) {
        try {
            const responce = await RestoreDeletedFile(this.bucket, public_id, versionid)
            return responce
        } catch (error) {
            throw error
        }
    }
}

export default new AWSService()