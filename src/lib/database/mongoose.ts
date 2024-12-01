// import { DataAPIClient } from "@datastax/astra-db-ts"
import mongoose from "mongoose"
import { driver, createAstraUri } from "stargate-mongoose"

export const connectToAstraDb = async (): Promise<void> => {
  try {
    const uri = createAstraUri(process.env.ASTRA_DB_API_END_POINT!, process.env.ASTRA_DB_APPLICATION_TOKEN!, process.env.ASTRA_DB_KEYSPACE!, process.env.ASTRA_DB_ID!)

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

/** using dataApiClient */
// export const connectToAstraDbUsingDataAPIClient = async (collectionName: string = "users") => {
//   try {
//     // Set up endpoint and keyspace separately
//     const endpoint = process.env.ASTRA_DB_API_END_POINT
//     const namespace = process.env.ASTRA_DB_KEYSPACE

//     if (!endpoint || !namespace) {
//       throw new Error("Astra DB endpoint or keyspace is not defined in environment variables.")
//     }

//     // Initialize the client with your Astra token
//     const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!)
//     const db = client.db(endpoint, { namespace })

//     // Reference the specified collection
//     const collection = db.collection(collectionName)

//     console.log(`Connected to AstraDB collection '${collectionName}' successfully using DataAPIClient.`)

//     return { client, db, collection }
//   } catch (error) {
//     console.error("Error connecting to AstraDB:", error)
//     throw error
//   }
// }
