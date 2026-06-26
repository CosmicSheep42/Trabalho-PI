"use client"

import { SignIn } from "@clerk/nextjs"
import { Leaf } from "lucide-react"
import { loginFeatures } from "@/data/mock"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-12 bg-card border-r border-border">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-semibold">Cookwise</span>
          </div>

          <h1 className="text-3xl font-bold mb-4 text-balance">
            Your kitchen companion for shopping and cooking
          </h1>
          <p className="text-muted-foreground mb-8">
            Organize your grocery lists and discover delicious recipes all in one place.
          </p>

          <div className="space-y-4">
            {loginFeatures.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <div className="flex items-center justify-center gap-2 lg:hidden">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold">Cookwise</span>
        </div>

        <SignIn
          path="/login"
          routing="path"
          signUpUrl="/login"
          forceRedirectUrl="/"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  )
}
