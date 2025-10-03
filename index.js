import express from 'express'
import dotenv from 'dotenv'
import FileRoutes from './Routes/file.routes.js'
import cors from 'cors'
import { Server } from 'socket.io'
import http from 'http'
import helmetmiddelware from './helmet/helmet.js'
dotenv.config()

const app = express()
const PORT = process.env.PORT

dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // replace with frontend URL in production
        methods: ["GET", "POST", "DELETE"]
    }
});

app.disable('x-powered-by')
app.use(helmetmiddelware())

app.set('io', io)
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api/file', FileRoutes)

io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    socket.on('disconnect', () => {
        console.log("❌ Client disconnected:", socket.id);
    })
})

server.listen(PORT, () => {
    console.log(`Server start at http://localhost:${PORT}`)
})