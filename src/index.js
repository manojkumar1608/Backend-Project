import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"


dotenv.config({
path:'./.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
    console.log(`*server is running at : ${process.env.PORT}`)
})
    app.on("error",(error)=>{
        console.log("404 not Found",error)
        throw error

    })

})
.catch((error)=>{
    console.error(`MONGODB CONNECTION FAILED`,error)

})
