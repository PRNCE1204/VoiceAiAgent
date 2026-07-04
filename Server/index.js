import express from "express"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import connectDB from "./Configs/ConnectDB.js"
import authRouter from "./Routes/auth.route.js"
import cookieParser from "cookie-parser"
import http from "http"
import { Server } from "socket.io"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") })
import cors from "cors"
import userRouter from "./Routes/user.route.js"
import assistantRouter from "./Routes/assistant.route.js"
import billingRouter from "./Routes/billing.route.js"
import { handleSocketConnection } from "./Controllers/stream.controller.js"


const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const privateCors =
  cors({

    origin: [
      "http://localhost:5173",
      "http://localhost:5174"
    ],

    credentials: true

  });

  const publicCors =
  cors({
    origin: "*",
  });

app.use(express.json())
app.use(cookieParser())



app.get("/" , (req,res)=>{
    res.json("Hello from Server")
})

app.use("/api/auth",privateCors , authRouter)
app.use("/api/user",privateCors , userRouter)
app.use("/api/billing",privateCors , billingRouter)

app.use("/api/assistant",publicCors , assistantRouter)

io.on("connection", (socket) => {
    handleSocketConnection(socket, io);
});

const PORT = process.env.PORT
server.listen(PORT , ()=>{
    console.log(`Server Started on Port ${PORT}`)
    connectDB()
})