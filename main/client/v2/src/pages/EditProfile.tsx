import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const EditProfile = () => {
	const auth = useAuth();
	const navigate = useNavigate();
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [email, setEmail] = useState<string>(auth.user.email.toString());
	const [error, setError] = useState<string>("");

	useEffect(() => {
		auth.isAuthenticated().then((isAuthenticated) => {
			if (!isAuthenticated) {
				navigate("/");
			}
		});
	});

	return (
		<div className="profile">
			<div className="w-full p-8 py-6 bg-gray-100 full-page">
				<h1 className="text-4xl mb-2">Profile</h1>
				<h3 className="text-xl">
					Welcome back, {auth.user.username}. Make changes to your profile here.
				</h3>
				<h3 className="text-xl mb-4">
					If your changes are saved, you will be logged out.
				</h3>
				{/* Show the user's profile information in a form */}
				<form>
					<div className="flex flex-wrap mb-6">
						<div className="w-full md:w-1/2 mb-6 md:mb-0 bg-white p-6 shadow-md">
							{error && <p className="text-red-500 text-sm mb-4 font-bold">Error: {error}</p>}
							<label
								className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
								htmlFor="grid-user-name"
							>
								Email address
							</label>
							<input
								className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-5 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
								id="grid-email"
								type="email"
								required={true}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>

							<label
								className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
								htmlFor="grid-password"
							>
								Password
							</label>
							<input
								className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-5 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
								id="grid-password"
								type="password"
								autoComplete="new-password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>

							<label
								className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
								htmlFor="grid-password-confirm"
							>
								Confirm password
							</label>
							<input
								className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-5 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
								id="grid-password-confirm"
								type="password"
								autoComplete="new-password"
								value={passwordConfirm}
								onChange={(e) => setPasswordConfirm(e.target.value)}
							/>

							<button
								className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full md:w-auto md:float-right focus:outline-none focus:shadow-outline"
								type="submit"
								onClick={(e) => {
									e.preventDefault();
									auth
										.updateUser(email, password, passwordConfirm)
										.catch((e) => {
											setError(e);
										});
								}}
							>
								Update
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EditProfile;
