import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestsQueue = [];

export const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
        Authorization: `Bearer ${cookies["nextAuth.token"]}`,
    },
});

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError) => {
        const isUnauthorized = error.response.status === 401;
        const tokenHasExpired = error.response.data?.code === "token.expired";
        if (isUnauthorized) {
            if (tokenHasExpired) {
                // refresh token
                cookies = parseCookies();
                const { "nextAuth.refreshToken": refreshToken } = cookies;
                const originalConfig = error.config; // all info required to repeat a request
                if (!isRefreshing) {
                    isRefreshing = true;

                    api.post("/refresh", {
                        refreshToken,
                    })
                        .then((response) => {
                            setCookie(
                                undefined,
                                "nextAuth.token",
                                response.data.token,
                                {
                                    maxAge: 60 * 60 * 24 * 30, // 30 days
                                    path: "/", // all routes have access to this cookie
                                }
                            );
                            setCookie(
                                undefined,
                                "nextAuth.refreshToken",
                                response.data.refreshToken,
                                {
                                    maxAge: 60 * 60 * 24 * 30, // 30 days
                                    path: "/", // all routes have access to this cookie
                                }
                            );
                            api.defaults.headers[
                                "Authorization"
                            ] = `Bearer ${response.data.token}`;

                            failedRequestsQueue.forEach((request) =>
                                request.onSuccess(response.data.token)
                            );
                            failedRequestsQueue = [];
                        })
                        .catch((error) => {
                            failedRequestsQueue.forEach((request) =>
                                request.onFailure(error)
                            );
                            failedRequestsQueue = [];
                        })
                        .finally(() => {
                            isRefreshing = false;
                        });
                }

                return new Promise((resolve, reject) => {
                    failedRequestsQueue.push({
                        onSuccess: (token: string) => {
                            originalConfig.headers[
                                "Authorization"
                            ] = `Bearer ${token}`;
                            resolve(api(originalConfig));
                        },
                        onFailure: (error: AxiosError) => {
                            reject(error);
                        },
                    });
                });
            } else {
                signOut();
            }
        }

        return Promise.reject(error); // let the error continue so whoever made the request will be able to handle it
    }
);
