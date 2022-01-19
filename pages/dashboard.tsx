import { useContext } from "react";

import { AuthContext } from "../contexts/AuthContext";
import { useCan } from "../hooks/useCan";
import { setupAPIClient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
    const { user, isAuthenticated } = useContext(AuthContext);

    const userCanSeeMetrics = useCan({
        permissions: ["metrics.list"],
        roles: ["administrator", "editor"],
    });

    return (
        <>
            <h1>Dashboard: {user?.email}</h1>
            {userCanSeeMetrics && <div>Metrics</div>}
        </>
    );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
    // @ts-ignore
    const apiClient = setupAPIClient(ctx);

    return {
        props: {},
    };
});
