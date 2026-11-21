import prisma from '../src/prisma/db.ts'

async function connectDB(){
    try{
        await prisma.connect();
        console.log("Database Connected");
    }
    catch(error){
        console.error("Database Connection failed",error);
        process.exit(1);
    }
}

export default connectDB;