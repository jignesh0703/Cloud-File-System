import { Delete_AWS, initS3, Read_Aws, UploadToAWS } from '../Clouds/aws.js';

class AWSService {
    constructor(credentials) {
        this.s3 = initS3(credentials)
        this.bucket = credentials?.bucket || process.env.AWS_BUCKET
    }

    async fileUpload(filepath, socket, CompletedUploads, sessionId, TotalFile) {
        try {
            const responce = await UploadToAWS(filepath, socket, CompletedUploads, sessionId, TotalFile, this.bucket)
            return responce
        } catch (error) {
            throw error
        }
    }

    async ReadFile(public_id, extention) {
        try {
            const responce = await Read_Aws(public_id, extention, this.bucket)
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
}

export default new AWSService()