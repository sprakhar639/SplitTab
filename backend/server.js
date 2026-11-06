import app from './src/app.js'
import connectDB from './db/db.js'
import "./src/config/redis.js"

async function startServer(){
   await connectDB();

    app.listen(3000,()=>{
        console.log("Server running on Port 3000")
    })
}

startServer()