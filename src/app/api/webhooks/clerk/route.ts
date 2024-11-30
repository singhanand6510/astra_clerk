/* eslint-disable no-unused-vars */

// import * as uuid from "uuid"
import { createUser, deleteUser, updateUser } from "@/lib/database/actions/user.actions"
import { WebhookEvent, clerkClient } from "@clerk/nextjs/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { Webhook } from "svix"

// const uuidv4 = uuid.v4

export async function POST(req: Request) {
  // Get the webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local")
  }

  // Get the headers
  const headersList = await headers()
  const svix_id = headersList.get("svix-id")
  const svix_timestamp = headersList.get("svix-timestamp")
  const svix_signature = headersList.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ success: false, message: "Error occurred -- no svix headers" }, { status: 400 })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with the secret
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return NextResponse.json({ success: false, message: "Error verifying webhook" }, { status: 400 })
  }

  const eventType = evt.type
  const { id } = evt.data

  // Handle user creation
  if (eventType === "user.created") {
    if (!id) {
      return NextResponse.json({ success: false, message: "No user ID provided" }, { status: 400 })
    }

    const { email_addresses, image_url, first_name, last_name, username } = evt.data

    try {
      const user = {
        clerkId: id,
        email: email_addresses[0].email_address,
        username: username || email_addresses[0].email_address.split("@")[0],
        firstName: first_name || "",
        lastName: last_name || "",
        photo: image_url || "https://example.com/placeholder.jpg",
        planId: 1,
        creditBalance: 3,
      } as const

      const newUser = await createUser(user)

      if (!newUser) {
        throw new Error("Failed to create user in database")
      }

      // Update Clerk user metadata with database user ID
      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(id, {
        publicMetadata: {
          userId: newUser._id,
        },
      })

      return NextResponse.json({ success: true, message: "User created successfully", user: newUser })
    } catch (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ success: false, message: "Error creating user" }, { status: 500 })
    }
  }

  // Handle user updates
  if (eventType === "user.updated") {
    if (!id) {
      return NextResponse.json({ success: false, message: "No user ID provided" }, { status: 400 })
    }

    const { image_url, first_name, last_name, username } = evt.data

    try {
      const updateData = {
        firstName: first_name || "",
        lastName: last_name || "",
        username: username || "",
        photo: image_url || "https://example.com/placeholder.jpg",
      }

      const updatedUser = await updateUser(id, updateData)

      if (!updatedUser) {
        throw new Error("Failed to update user in database")
      }

      return NextResponse.json({ success: true, message: "User updated successfully", user: updatedUser })
    } catch (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ success: false, message: "Error updating user" }, { status: 500 })
    }
  }

  // Handle user deletion
  if (eventType === "user.deleted") {
    if (!id) {
      return NextResponse.json({ success: false, message: "No user ID provided" }, { status: 400 })
    }

    try {
      const deletedUser = await deleteUser(id)

      if (!deletedUser) {
        throw new Error("Failed to delete user from database")
      }

      return NextResponse.json({ success: true, message: "User deleted successfully", user: deletedUser })
    } catch (error) {
      console.error("Error deleting user:", error)
      return NextResponse.json({ success: false, message: "Error deleting user" }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, message: "Webhook processed successfully" })
}
