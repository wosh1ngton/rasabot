import mongoose from "mongoose";

async function conectar() {
    mongoose.connect(process.env.MONGODB_URI!);
    return mongoose.connection;
}

export default conectar;