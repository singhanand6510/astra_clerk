import mongoose from "mongoose"
import { driver, createAstraUri } from "stargate-mongoose"

export const connectToAstraDb = async (): Promise<void> => {
  try {
    const uri = createAstraUri(process.env.ASTRA_DB_REGION!, process.env.ASTRA_DB_APPLICATION_TOKEN!, process.env.ASTRA_DB_KEYSPACE!, process.env.ASTRA_DB_ID!)

    // If already connected, disconnect before reconnecting
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      console.log("Disconnected previous Mongoose connection.")
    }

    // Set necessary Mongoose configurations
    mongoose.set("autoCreate", true)
    mongoose.setDriver(driver)

    // Establish the connection to AstraDB
    await mongoose.connect(uri, {
      isAstra: true,
    })

    console.log("Connected to AstraDB successfully.")
  } catch (error) {
    console.error("Error connecting to AstraDB:", error)
    throw error
  }
}

// import mongoose, { Mongoose } from "mongoose"

// const MONGODB_URL = process.env.MONGODB_URL!

// interface MongooseConnection {
//   conn: Mongoose | null
//   promise: Promise<Mongoose> | null
// }

// let cached: MongooseConnection = (global as any).mongoose

// if (!cached) {
//   cached = (global as any).mongoose = {
//     conn: null,
//     promise: null,
//   }
// }

// export const connectToDatabase = async () => {
//   if (cached.conn) return cached.conn

//   if (!MONGODB_URL) throw new Error("MONGODB_URL not Defined")

//   cached.promise =
//     cached.promise ||
//     mongoose.connect(MONGODB_URL, {
//       dbName: "ASK-YT_db",
//       bufferCommands: false,
//       connectTimeoutMS: 30000,
//     })

//   cached.conn = await cached.promise

//   return cached.conn
// }
