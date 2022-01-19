import { useContext } from "react";
import { Can } from "../components/Can";

import { AuthContext } from "../contexts/AuthContext";
import { setupAPIClient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
    const { user, signOut } = useContext(AuthContext);

    const handleSignOut = () => {
        signOut();
    };

    return (
        <>
            <h1>Dashboard: {user?.email}</h1>
            <button onClick={handleSignOut}>Sign out</button>
            <Can permissions={["metrics.list"]}>
                <div>Metrics</div>
            </Can>
        </>
    );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
    const apiClient = setupAPIClient(ctx);

    return {
        props: {},
    };
});
