import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher(["/login(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return
  }

  const { userId } = await auth()
  if (userId) {
    return
  }

  return NextResponse.redirect(new URL("/login", req.url))
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
}
