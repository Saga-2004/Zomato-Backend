import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "zomato",
    });
    console.log(
      `MongoDB Connected: ${conn.connection.host}, DB name:${conn.connection.name}`,
    );
  } catch (error) {
    console.log("Error in db Connection: ", error.message);
    process.exit(1);
  }
};

export default connectDB;
