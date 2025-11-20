import { request } from '@umijs/max';

/** Get permissions list */
export async function getPermissions(
    params: API.PermissionQueryParams,
    options?: { [key: string]: any },
) {
    return request<API.Result<API.Permission[]>>('/api/permissions', {
        method: 'GET',
        params: {
            ...params,
        },
        ...(options || {}),
    });
}

/** Get permissions for a role */
export async function getRolePermissions(roleId: number) {
    return request<API.Result<API.Permission[]>>(`/api/permissions/role/${roleId}`, {
        method: 'GET',
    });
}

/** Assign permissions to a role */
export async function assignPermissions(roleId: number, permissionIds: number[]) {
    return request<API.Result<string>>(`/api/permissions/role/${roleId}/assign`, {
        method: 'POST',
        data: permissionIds,
    });
}
