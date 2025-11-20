import { request } from '@umijs/max';

/** Get roles list */
export async function getRoles(
    params: API.RoleQueryParams,
    options?: { [key: string]: any },
) {
    return request<API.Result<API.Role[]>>('/api/roles', {
        method: 'GET',
        params: {
            ...params,
        },
        ...(options || {}),
    });
}

/** Get role detail */
export async function getRole(id: number) {
    return request<API.Result<API.Role>>(`/ api / roles / ${id} `, {
        method: 'GET',
    });
}

/** Create role */
export async function createRole(body: API.RoleDTO) {
    return request<API.Result<API.Role>>('/api/roles', {
        method: 'POST',
        data: body,
    });
}

/** Update role */
export async function updateRole(id: number, body: API.RoleDTO) {
    return request<API.Result<API.Role>>(`/ api / roles / ${id} `, {
        method: 'PUT',
        data: body,
    });
}

/** Delete role */
export async function deleteRole(id: number) {
    return request<API.Result<string>>(`/ api / roles / ${id} `, {
        method: 'DELETE',
    });
}
