import { createContext, ReactNode, useEffect, useState } from "react";
import Router from "next/router";
import { setCookie, parseCookies, destroyCookie } from "nookies";

import { api } from "../services/api";

type SignInCredentials = {
    email: string;
    password: string;
};

type AuthContextData = {
    isAuthenticated: boolean;
    user: User;
    signIn(credentials: SignInCredentials): Promise<void>;
};

export const AuthContext = createContext({} as AuthContextData);

type AuthContextProviderProps = {
    children: ReactNode;
};

type User = {
    email: string;
    permissions: string[];
    roles: string[];
};

export function signOut() {
    destroyCookie(undefined, "nextAuth.token");
    destroyCookie(undefined, "nextAuth.refreshToken");
    Router.push("/");
}

export function AuthContextProvider({ children }: AuthContextProviderProps) {
    const [user, setUser] = useState<User>();
    const isAuthenticated = !!user;

    useEffect(() => {
        const { "nextAuth.token": token } = parseCookies();
        if (token) {
            api.get("/me")
                .then((response) => {
                    const { email, permissions, roles } = response.data;
                    setUser({ email, permissions, roles });
                })
                .catch(() => {
                    signOut();
                });
        }
    }, []);

    async function signIn({ email, password }: SignInCredentials) {
        try {
            const response = await api.post("sessions", {
                email,
                password,
            });
            const { token, refreshToken, permissions, roles } = response.data;
            setCookie(undefined, "nextAuth.token", token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: "/", // all routes have access to this cookie
            });
            setCookie(undefined, "nextAuth.refreshToken", refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: "/", // all routes have access to this cookie
            });
            setUser({
                email,
                permissions,
                roles,
            });

            api.defaults.headers["Authorization"] = `Bearer ${token}`;

            Router.push("/dashboard");
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, signIn, user }}>
            {children}
        </AuthContext.Provider>
    );
}
