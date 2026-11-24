import prisma from "../src/prisma/db.ts";

async function connectDB() {
  try {
    await prisma.connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

export default connectDB;
