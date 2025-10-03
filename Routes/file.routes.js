import express from 'express'
import { DeleteFile, FetchAllDeletedFileController, FileUploadController, ReadFile, RestoreDeletedFileController } from '../Controller/file.controller.js'
import { Upload } from '../middelware/multer.js'
import { UploadLimit, RateLimit } from '../Ratelimit/ratelimit.js'

const FileRoutes = express.Router()

FileRoutes.use(RateLimit)

FileRoutes.post('/upload', UploadLimit, Upload.array('chunk', 5), FileUploadController)
FileRoutes.post('/read', ReadFile)
FileRoutes.delete('/delete', DeleteFile)
FileRoutes.get('/fetchdeletedfile', FetchAllDeletedFileController)
FileRoutes.post('/restoredeletefile', RestoreDeletedFileController)

export default FileRoutes