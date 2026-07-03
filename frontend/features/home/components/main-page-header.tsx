"use client"

import { Bell, Leaf, LogOut, Settings, User, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { HomeScreenModel } from "@/features/home/model/types"

interface MainPageHeaderProps {
  screen: HomeScreenModel
}

export function MainPageHeader({ screen }: MainPageHeaderProps) {
  const { profile, session, shell, social } = screen
  const pendingNotifications = social.incomingFriendRequests.length

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Cookwise</span>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                aria-label={`Notifications${pendingNotifications > 0 ? `, ${pendingNotifications} pending` : ""}`}
              >
                <Bell className="h-5 w-5" />
                {pendingNotifications > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {pendingNotifications > 9 ? "9+" : pendingNotifications}
                  </span>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold">Notifications</p>
                <p className="text-xs text-muted-foreground">Friend requests waiting for your response.</p>
              </div>
              <DropdownMenuSeparator />
              {social.incomingFriendRequests.length > 0 ? (
                social.incomingFriendRequests.map((request) => (
                  <div key={request.id} className="px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={request.user.avatar ?? undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {request.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">@{request.user.username}</p>
                          <p className="text-xs text-muted-foreground">sent you a friend request</p>
                        </div>
                      </div>
                      <Badge variant="secondary">New</Badge>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => void social.acceptFriendRequest(request.id)}
                        disabled={social.isSavingFriendAction}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void social.declineFriendRequest(request.id)}
                        disabled={social.isSavingFriendAction}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No pending notifications.
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => shell.setFriendsOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Open friends
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.user.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => shell.setProfileOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shell.setFriendsOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Friends
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shell.setSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={session.logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
