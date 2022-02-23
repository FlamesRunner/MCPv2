import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const SignIn = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [processing, setProcessing] = useState(false);
	const auth = useAuth();
    const [message, setMessage] = useState("");
	const navigate = useNavigate();

	const signIn = async () => {
		setProcessing(true);
		const resp = await auth.login(username, password);
		setTimeout(() => {
            if (!resp.isAuthenticated) {
                setMessage(resp.message || "");
            }
            setProcessing(false);
			navigate("/dashboard");
		}, 1000);
	};

	return (
		<div className="w-full full-page md:flex md:justify-center md:align-middle md:items-center bg-gray-100">
			<div className="md:rounded-md md:shadow-lg md:w-1/4 w-full bg-white h-full md:h-auto">
				<div className="p-8">
					<h1 className="text-2xl font-bold text-center">
						Sign in to MCP<sup>2</sup>
					</h1>
					<form className="mt-8">
                        {message && <div className="text-red-700 bg-red-300 p-2 font-bold rounded-md mb-4 text-center">{message}</div>}
						<div className="mb-4">
							<input
								type="text"
								className="rounded-md w-full p-2 bg-gray-100 focus:bg-gray-200 focus:border-1 focus:border-black"
								placeholder="Username or email address"
								name="username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
							/>
						</div>
						<div className="mb-4">
							<input
								type="password"
								className="rounded-md w-full p-2 bg-gray-100 focus:bg-gray-200 focus:border-1 focus:border-black"
								placeholder="Password"
								name="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						<div className="flex justify-between items-center">
							<button
								type="submit"
								disabled={processing}
								className={`rounded-md w-full p-2 bg-gray-100 focus:bg-gray-200 focus:border-1 focus:border-black ${
									processing ? "opacity-50 cursor-not-allowed" : ""
								}`}
								onClick={(e) => {
									e.preventDefault();
									signIn();
								}}
							>
								{processing ? "Please wait..." : "Sign in"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default SignIn;
