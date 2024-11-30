import { Webhook } from "svix"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { createUser } from "@/lib/database/actions/user.actions"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local")
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occurred", {
      status: 400,
    })
  }

  const eventType = evt.type

  if (eventType === "user.created") {
    const { id, email_addresses, image_url, first_name, last_name, username } = evt.data

    try {
      // Find the primary email
      const primaryEmail = email_addresses.find((email) => email.id === evt.data.primary_email_address_id)

      if (!primaryEmail) {
        console.error("No primary email found")
        return new Response("No primary email found", { status: 400 })
      }

      // Create user with our schema
      const newUser = await createUser({
        clerkId: id,
        email: primaryEmail.email_address,
        username: username || id, // Use clerkId as fallback username
        photo: image_url || "https://example.com/default-avatar.png", // Provide a default avatar
        firstName: first_name || "",
        lastName: last_name || "",
      })

      return new Response(JSON.stringify(newUser), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      console.error("Error creating user:", error)
      return new Response("Error creating user", { status: 500 })
    }
  }

  return new Response("Webhook received", { status: 200 })
}
