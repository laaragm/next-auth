import { GetServerSideProps } from "next";
import { FormEvent, useContext, useState } from "react";
import { parseCookies } from "nookies";

import { AuthContext } from "../contexts/AuthContext";
import styles from "../styles/Home.module.css";
import { redirect } from "next/dist/server/api-utils";

export default function Home() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { signIn, isAuthenticated } = useContext(AuthContext);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const data = {
            email,
            password,
        };
        await signIn(data);
    }

    return (
        <form className={styles.container} onSubmit={handleSubmit}>
            <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
            />
            <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
            />
            <button type="submit">Sign In</button>
        </form>
    );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const cookies = parseCookies(ctx);

    if (!cookies["nextAuth.token"]) {
        return {
            redirect: {
                destination: "/dashboard",
                permanent: false,
            },
        };
    }

    return {
        props: {},
    };
};
