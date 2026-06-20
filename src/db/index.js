import mongoose from "mongoose";

export default async function connectDB() {
  console.log("check the uri", process.env.MONGODB_URI);
  try {
    const connection = await mongoose.connect(`${process.env.MONGODB_URI}`);
    console.log(`Db connected successfully at ${process.env.MONGODB_URI}`);
  } catch (error) {
    console.log("DB connection failed", error);
    process.exit(1);
  }
}
