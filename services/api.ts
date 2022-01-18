import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";
import { AuthTokenError } from "./errors/AuthTokenError";

let isRefreshing = false;
// @ts-ignore
let failedRequestsQueue = [];

export function setupAPIClient(ctx = undefined) {
    let cookies = parseCookies(undefined);

    const api = axios.create({
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
            // @ts-ignore
            const isUnauthorized = error.response.status === 401;
            const tokenHasExpired =
                // @ts-ignore
                error.response.data?.code === "token.expired";
            if (isUnauthorized) {
                if (tokenHasExpired) {
                    cookies = parseCookies(ctx);
                    const { "nextAuth.refreshToken": refreshToken } = cookies;
                    const originalConfig = error.config; // all info required to repeat a request
                    if (!isRefreshing) {
                        isRefreshing = true;

                        api.post("/refresh", {
                            refreshToken,
                        })
                            .then((response) => {
                                setCookie(
                                    ctx,
                                    "nextAuth.token",
                                    response.data.token,
                                    {
                                        maxAge: 60 * 60 * 24 * 30, // 30 days
                                        path: "/", // all routes have access to this cookie
                                    }
                                );
                                setCookie(
                                    ctx,
                                    "nextAuth.refreshToken",
                                    response.data.refreshToken,
                                    {
                                        maxAge: 60 * 60 * 24 * 30, // 30 days
                                        path: "/", // all routes have access to this cookie
                                    }
                                );
                                // @ts-ignore
                                api.defaults.headers[
                                    "Authorization"
                                ] = `Bearer ${response.data.token}`;

                                // @ts-ignore
                                failedRequestsQueue.forEach((request) =>
                                    request.onSuccess(response.data.token)
                                );
                                failedRequestsQueue = [];
                            })
                            .catch((error) => {
                                // @ts-ignore
                                failedRequestsQueue.forEach((request) =>
                                    request.onFailure(error)
                                );
                                failedRequestsQueue = [];

                                if (process.browser) {
                                    signOut();
                                }
                            })
                            .finally(() => {
                                isRefreshing = false;
                            });
                    }

                    return new Promise((resolve, reject) => {
                        failedRequestsQueue.push({
                            onSuccess: (token: string) => {
                                // @ts-ignore
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
                    if (process.browser) {
                        signOut();
                    } else {
                        return Promise.reject(new AuthTokenError());
                    }
                }
            }

            return Promise.reject(error); // let the error continue so whoever made the request will be able to handle it
        }
    );

    return api;
}
