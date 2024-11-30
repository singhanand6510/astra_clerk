// import * as uuid from "uuid"

// import { v4 as uuidv4 } from 'uuid';
import { createUser } from "@/lib/database/actions/user.actions"
import { WebhookEvent, clerkClient } from "@clerk/nextjs/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { Webhook } from "svix"

// const uuidv4 = uuid.v4

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local")
  }

  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id!,
      "svix-timestamp": svix_timestamp!,
      "svix-signature": svix_signature!,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occurred", { status: 400 })
  }

  const id = evt.data.id as string
  const eventType = evt.type

  // CREATE User in AstraDB
  if (eventType === "user.created") {
    const { email_addresses, image_url, first_name, last_name, username } = evt.data

    try {
      const user = {
        // _id: uuidv4(), // UUID for _id
        clerkId: id,
        email: email_addresses[0].email_address,
        username: username || "",
        firstName: first_name || "",
        lastName: last_name || "",
        photo: image_url,
        createdAt: new Date(), // Optional creation date
      }

      const newUser = await createUser(user)

      console.log("User created:", newUser)

      await clerkClient.users.updateUserMetadata(id, {
        publicMetadata: {
          userId: newUser._id,
        },
      })

      return NextResponse.json({ message: "New user created", user: newUser })
    } catch (error) {
      console.error("Error creating user in AstraDB:", (error as Error).message)
      return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 })
    }
  }

  // UPDATE User in AstraDB
  // if (eventType === "user.updated") {
  //   const { image_url, first_name, last_name, username } = evt.data

  //   try {
  //     const user = {
  //       firstName: first_name || "",
  //       lastName: last_name || "",
  //       username: username || "",
  //       photo: image_url,
  //     }

  //     const updatedUser = await updateUser(id, user)

  //     return NextResponse.json({ message: "User updated", user: updatedUser })
  //   } catch (error) {
  //     console.error("Error updating user in AstraDB:", (error as Error).message)
  //     return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 })
  //   }
  // }

  // DELETE User from AstraDB
  // if (eventType === "user.deleted") {
  //   try {
  //     const deletedUser = await deleteUser(id)

  //     return NextResponse.json({ message: "User deleted", user: deletedUser })
  //   } catch (error) {
  //     console.error("Error deleting user in AstraDB:", (error as Error).message)
  //     return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 })
  //   }
  // }

  return new Response("", { status: 200 })
}
