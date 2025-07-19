import { useState } from 'react';
import { useNavigate } from 'react-router';
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
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Login successful:', data);
        localStorage.setItem('token', data.token); // Store the token
        navigate('http://localhost:3001/main-menu'); // Navigate to main menu
      } else {  
        console.error('Login failed:', data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Sign Up successful:', data);
        setIsSignUp(false); // Switch to login form
      } else {
        console.error('Sign Up failed:', data.error);
      }
    } catch (error) {
      console.error('Sign Up error:', error);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl text-primary">Captcha Royale</h1>
            <div className="w-full flex justify-center">
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle className="text-left">{isSignUp ? 'Create a new account' : 'Login to your account'}</CardTitle>
                  <CardDescription className="text-left">
                    Enter your {isSignUp ? 'details' : 'email'} below to {isSignUp ? 'create a new account' : 'login to your account'}
                  </CardDescription>
                  <CardAction>
                    <Button variant="link" onClick={() => setIsSignUp(!isSignUp)}>{isSignUp ? 'Back to Login' : 'Sign Up'}</Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
                    <div className="flex flex-col gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="m@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <CardFooter className="flex-col gap-2">
                      <Button type="submit" className="w-full">{isSignUp ? 'Sign Up' : 'Login'}</Button>
                      {!isSignUp && <Button variant="outline" className="w-full">Login with Google</Button>}
                    </CardFooter>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
