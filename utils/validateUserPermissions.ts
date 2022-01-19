type User = {
    permissions: string[];
    roles: string[];
};

type ValidateUserPermissionsParams = {
    user: User;
    permissions?: string[];
    roles?: string[];
};

export function validateUserPermission({
    user,
    permissions,
    roles,
}: ValidateUserPermissionsParams) {
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
