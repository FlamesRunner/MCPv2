interface IUser {
    _id: String;
    username: String;
    email: String;
}

interface IAuthContext {
    user: IUser;
    token: string;
    expiresAt: Number;
    login: (user: string, token: string) => Promise<IAuthState>;
    signOut: () => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<IAuthState>;
    refreshToken: () => void;
    isAuthenticated: () => Promise<boolean>;
    updateUser: (email: string, password: string, confirmPassword: string) => Promise<boolean>;
}

interface IAuthState {
    isAuthenticated: boolean;
    message?: string;
}

export type {IUser, IAuthContext, IAuthState};