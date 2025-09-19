import express from 'express'
import { FileUploadController, ReadFile } from '../Controller/file.controller.js'
import { Upload } from '../middelware/multer.js'

const FileRoutes = express.Router()

FileRoutes.post('/upload', Upload.array('chunk', 5), FileUploadController)
FileRoutes.get('/read', ReadFile)

export default FileRoutes