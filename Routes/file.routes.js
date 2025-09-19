import express from 'express'
import { DeleteFile, FileUploadController, ReadFile } from '../Controller/file.controller.js'
import { Upload } from '../middelware/multer.js'

const FileRoutes = express.Router()

FileRoutes.post('/upload', Upload.array('chunk', 5), FileUploadController)
FileRoutes.get('/read', ReadFile)
FileRoutes.delete('/delete', DeleteFile)

export default FileRoutes