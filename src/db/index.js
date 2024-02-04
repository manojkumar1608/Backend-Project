import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"


const connectDB = async () =>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MONGODB HAS BEEN CONNECTED !! DB_HOST:${connectionInstance.connection.host}`)

        
    } catch (error) {
        console.error("MONGODB CONNECTION FAILED!! ERROR",error)
        process.exit(1)
        
    }
}
export default connectDB