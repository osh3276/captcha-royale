import { useState } from "react";
import { useNavigate } from "react-router";
import "./App.css";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function App() {
	const navigate = useNavigate();
	const [username, setUsername] = useState("");

	const handleContinue = (e: React.FormEvent) => {
		e.preventDefault();
		if (username.trim()) {
			localStorage.setItem("username", username);
			navigate("/main-menu");
		}
	};

	// ping the root api for health check
	const pingApi = async () => {
		try {
			const response = await fetch("http://localhost:3001");
			if (response.ok) {
				console.log("API is healthy");
			} else {
				console.error("API is not healthy");
			}
		} catch (error) {
			console.error("API ping error:", error);
		}
	};

	return (
		<>
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="max-w-2xl w-full space-y-8">
					<div className="text-center space-y-4">
						<h1 className="text-4xl text-primary">
							Captcha Royale
						</h1>
						<div className="w-full flex justify-center">
							<Card className="w-full max-w-sm">
								<form onSubmit={handleContinue}>
									<CardHeader>
										<CardTitle>Enter a username</CardTitle>
										<CardDescription>
											Choose a username to start playing.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="grid gap-2">
											<Label htmlFor="username">
												Username
											</Label>
											<Input
												id="username"
												placeholder="cooldude42"
												value={username}
												onChange={(e) =>
													setUsername(e.target.value)
												}
												required
											/>
										</div>
									</CardContent>
									<CardFooter>
										<Button
											type="submit"
											className="w-full"
										>
											Continue
										</Button>
									</CardFooter>
								</form>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default App;
