import React from "react";
import axios, { AxiosError } from "axios";
import { AuthContext } from "../context/AuthContext";
import { IUser, IAuthState } from "../types/AuthTypes";
import { useState } from "react";
import { useNavigate } from "react-router";

type AuthResponse = {
	token: string;
	user: IUser;
	message: string;
	expiresAt: number;
};

type AuthProviderProps = {
	children: JSX.Element;
};

const AuthProvider = (props: AuthProviderProps) => {
	const [user, setUser] = useState<IUser>({
		_id: "",
		username: "",
		email: "",
	});

	const [token, setToken] = useState<string>("");

	const [expiry, setExpiry] = useState<number>(0);

	const [lastRefreshed, setLastRefreshed] = useState<number>(0);

	const [hasReadFromLocalStorage, setHasReadFromLocalStorage] =
		useState<boolean>(false);

	const navigate = useNavigate();

	const login = async (user: string, password: string) => {
		try {
			const response = await axios.post(
				`${process.env.REACT_APP_API_HOST}/api/v1/user/login`,
				{
					username: user,
					email: user,
					password,
				}
			);

			const authData: AuthResponse = response.data;
			setUser(authData.user);
			setToken(authData.token);
			setExpiry(authData.expiresAt);

			await saveToLocalStorage(
				authData.user,
				authData.token,
				authData.expiresAt
			);

			const authState = {
				message: "Successfully logged in",
				isAuthenticated: true,
			};
			return authState;
		} catch (error) {
			const authState = {
				message: "Invalid username or password",
				isAuthenticated: false,
			};
			return authState;
		}
	};

	const register = async (user: string, email: string, password: string) => {
		try {
			const response = await axios.post(
				`${process.env.REACT_APP_API_HOST}/api/v1/user/create`,
				{
					username: user,
					email: email,
					password,
				}
			);

			const authData: AuthResponse = response.data;
			setUser(authData.user);
			setToken(authData.token);
			setExpiry(authData.expiresAt);

			await saveToLocalStorage(
				authData.user,
				authData.token,
				authData.expiresAt
			);

			const authState = {
				message: "Account created successfully",
				isAuthenticated: true,
			};

			return authState;
		} catch (error: any) {
			const authState: IAuthState = {
				message: "Failed to create account",
				isAuthenticated: false,
			};
			return authState;
		}
	};

	const signOut = async () => {
		await localStorage.removeItem("user");
		await localStorage.removeItem("token");
		await localStorage.removeItem("expiresAt");
		setUser({
			_id: "",
			username: "",
			email: "",
		});
		setToken("");
		setExpiry(0);
		navigate("/");
	};

	const refreshToken = async () => {
		// If the token is within 5 minutes of expiring, refresh it
		// If the last time the token was refreshed is within five minutes, don't refresh it
		if (
			expiry - 5 * 60 * 1000 > Date.now() ||
			token === "" ||
			lastRefreshed + 5 * 60 * 1000 > Date.now() ||
			expiry < Date.now()
		) {
			return {
				user: user,
				token: token,
				expiresAt: expiry,
			};
		}
		setLastRefreshed(Date.now());
		try {
			const response = await axios.get(
				`${process.env.REACT_APP_API_HOST}/api/v1/user/refresh`,
				{
					headers: {
						Authorization: `${token}`,
					},
				}
			);

			if (response.status === 200) {
				const authData: AuthResponse = response.data;

				setUser(authData.user);
				setToken(authData.token);
				setExpiry(authData.expiresAt);

				await saveToLocalStorage(
					authData.user,
					authData.token,
					authData.expiresAt
				);
				return {
					user: authData.user,
					token: authData.token,
					expiresAt: authData.expiresAt
				};
			}
		} catch (error) {
			console.log(error);
		}
		return null;
	};

	const updateUser = async (
		email: string,
		password: string,
		confirmPassword: string
	) => {
		await axios
			.post(
				`${process.env.REACT_APP_API_HOST}/api/v1/user/update`,
				{
					email: email,
					password: password,
					confirmPassword: confirmPassword,
				},
				{
					headers: {
						Authorization: `${token}`,
					},
				}
			)
			.then((response) => {
				if (response.status === 200) {
					signOut();
					return true;
				}
			})
			.catch((error: AxiosError) => {
				throw error.response?.data?.message;
			});
		return false;
	};

	const readFromLocalStorage = async () => {
		if (hasReadFromLocalStorage) return;

		const user = await localStorage.getItem("user");
		const token = await localStorage.getItem("token");
		const expiresAt = await localStorage.getItem("expiresAt");

		if (user && token && expiresAt) {
			let userObj: IUser = {
				_id: "",
				username: "",
				email: "",
			};
			try {
				userObj = JSON.parse(user);
			} catch (error) {
				console.log(error);
			}
			setUser(userObj);
			setToken(token);
			setExpiry(parseInt(expiresAt));
			setHasReadFromLocalStorage(true);
			return;
		} else {
			setHasReadFromLocalStorage(true);
			return;
		}
	};

	const saveToLocalStorage = async (
		user: IUser,
		token: string,
		expiry: number
	) => {
		await localStorage.setItem("user", JSON.stringify(user));
		await localStorage.setItem("token", token);
		await localStorage.setItem("expiresAt", expiry.toString());
	};

	const isAuthenticated = async () => {
		await readFromLocalStorage();
		if (!hasReadFromLocalStorage) return true;
		const ret = await refreshToken();
		if (ret && ret.user && ret.token && ret.expiresAt) {
			return true;
		}
		return false;
	};

	return (
		<AuthContext.Provider
			value={{
				login,
				user,
				register,
				signOut,
				token: token,
				refreshToken,
				expiresAt: expiry,
				isAuthenticated,
				updateUser,
			}}
		>
			{props.children}
		</AuthContext.Provider>
	);
};

export default AuthProvider;
