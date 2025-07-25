// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl text-primary">Captcha Royale</h1>
            {/* <p className="text-muted-foreground">
              Compete with up to 99 players in real-time captcha challenges
            </p> */}
            <div className = "w-full flex justify-center">
              <Card className = "w-full max-w-sm">
                <CardHeader>
                  <CardTitle className = "text-left">Login to your account</CardTitle>
                  <CardDescription className = "text-left">
                    Enter your email below to login to your account
                  </CardDescription>
                  <CardAction>
                    <Button variant="link">Sign Up</Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <form>
                    <div className = "flex flex-col gap-6">
                      <div className = "grid gap-2">
                        <Label htmlFor = "email">Email</Label>
                        <Input
                          id = "email"
                          type = "email"
                          placeholder = "m@example.com"
                          required
                        />
                      </div>
                      <div className = "grid gap-2">
                        <div className = "flex items-center">
                          <Label htmlFor = "password">Password</Label>
                          <a
                            href = "#"
                            className = "ml-auto inline-block text-sm underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </a>
                        </div>
                          <Input id = "password" type = "password" required/>
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className = "flex-col gap-2">
                  <Button type = "submit" className = "w-full">Login</Button>
                  <Button variant = "outline" className = "w-full">Login with Google</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div> 
  
    </>
  )
}

export default App
