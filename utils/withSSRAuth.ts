import {
    GetServerSideProps,
    GetServerSidePropsContext,
    GetServerSidePropsResult,
} from "next";
import decode from "jwt-decode";
import { destroyCookie, parseCookies } from "nookies";

import { AuthTokenError } from "../services/errors/AuthTokenError";
import { validateUserPermission } from "./validateUserPermissions";

type WithSSRAuthOptions = {
    permission?: string[];
    roles?: string[];
};

export function withSSRAuth<T>(
    fn: GetServerSideProps<T>,
    options?: WithSSRAuthOptions
): GetServerSideProps {
    return async (
        ctx: GetServerSidePropsContext
    ): Promise<GetServerSidePropsResult<T>> => {
        const cookies = parseCookies(ctx);
        const token = cookies["nextAuth.token"];

        if (!token) {
            return {
                redirect: {
                    destination: "/",
                    permanent: false,
                },
            };
        }

        if (options) {
            const user =
                decode<{ permissions: string[]; roles: string[] }>(token);
            const { permissions, roles } = options;
            const userHasValidPermissions = validateUserPermission({
                user,
                permissions,
                roles,
            });

            if (!userHasValidPermissions) {
                return {
                    redirect: {
                        destination: "/dashboard",
                        permanent: false,
                    },
                };
            }
        }

        try {
            return await fn(ctx);
        } catch (error) {
            if (error instanceof AuthTokenError) {
                destroyCookie(ctx, "nextAuth.token");
                destroyCookie(ctx, "nextAuth.refreshToken");

                return {
                    redirect: {
                        destination: "/",
                        permanent: false,
                    },
                };
            }
        }
    };
}
