import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

interface FriendAvatarsRequestBody {
  clerkUserIds?: string[]
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json() as FriendAvatarsRequestBody
  const clerkUserIds = Array.from(
    new Set((body.clerkUserIds ?? []).map((value) => value.trim()).filter(Boolean))
  ).slice(0, 20)

  if (clerkUserIds.length === 0) {
    return NextResponse.json({ avatars: {} })
  }

  const client = await clerkClient()
  const users = await client.users.getUserList({ userId: clerkUserIds, limit: clerkUserIds.length })

  const avatars = users.data.reduce<Record<string, string>>((accumulator, user) => {
    if (user.imageUrl) {
      accumulator[user.id] = user.imageUrl
    }
    return accumulator
  }, {})

  return NextResponse.json({ avatars })
}
