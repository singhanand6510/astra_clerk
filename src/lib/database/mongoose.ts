import mongoose from "mongoose"
import { driver } from "stargate-mongoose"

interface AstraConnectOptions extends mongoose.ConnectOptions {
  isAstra?: boolean
  applicationToken?: string
}

export const connectToAstraDb = async (): Promise<void> => {
  try {
    // Construct the URI manually following the format:
    // https://{ASTRA_DB_ID}-{ASTRA_DB_REGION}.apps.astra.datastax.com/{ASTRA_DB_KEYSPACE}
    const uri = `${process.env.ASTRA_DB_REGION}/api/rest/${process.env.ASTRA_DB_KEYSPACE}`

    // If already connected, disconnect before reconnecting
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      console.log("Disconnected previous Mongoose connection.")
    }

    // Set necessary Mongoose configurations
    mongoose.set("autoCreate", true)
    mongoose.setDriver(driver)

    // Establish the connection to AstraDB
    const options: AstraConnectOptions = {
      isAstra: true,
      applicationToken: process.env.ASTRA_DB_APPLICATION_TOKEN,
    }

    await mongoose.connect(uri, options)

    console.log("Connected to AstraDB successfully.")
  } catch (error) {
    console.error("Error connecting to AstraDB:", error)
    throw error
  }
}
