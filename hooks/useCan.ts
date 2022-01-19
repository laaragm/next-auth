import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

interface UseCanParams {
    permissions?: string[];
    roles?: string[];
}

export function useCan({ permissions, roles }: UseCanParams) {
    const { user, isAuthenticated } = useContext(AuthContext);

    if (!isAuthenticated) {
        return false;
    }

    // @ts-ignore
    if (permissions?.length > 0) {
        // @ts-ignore
        const hasAllPermissions = permissions.some((permission) => {
            return user.permissions.includes(permission);
        });

        if (!hasAllPermissions) {
            return false;
        }
    }

    // @ts-ignore
    if (roles?.length > 0) {
        // @ts-ignore
        const hasAllRoles = roles.some((role) => {
            return user.roles.includes(role);
        });

        if (!hasAllRoles) {
            return false;
        }
    }

    return true;
}
