import React from "react";
import { useContext } from "react";
import { IAuthContext } from "../types/AuthTypes";

const AuthContext = React.createContext<IAuthContext>({
	user: {
		_id: "",
		username: "",
		email: "",
	},
	token: "",
	expiresAt: 0,
	login: async () => {
		return {
			isAuthenticated: false,
			message: "",
		};
	},
	signOut: async () => {},
	register: async () => {
		return {
			isAuthenticated: false,
			message: "",
		};
	},
	refreshToken: async () => {},
	isAuthenticated: async () => {
		return false;
	},
	updateUser: async () => {
		return false;
	},
});

const useAuth = () => useContext(AuthContext);

export { AuthContext, useAuth };
