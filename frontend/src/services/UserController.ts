import { request } from '@umijs/max';

/** Get current user profile */
export async function getProfile() {
    return request<API.Result<API.User>>('/api/users/profile', {
        method: 'GET',
    });
}

/** Update current user profile */
export async function updateProfile(body: API.UserUpdateDTO) {
    return request<API.Result<API.User>>('/api/users/profile', {
        method: 'PUT',
        data: body,
    });
}

/** Get users list */
export async function getUsers(
    params: API.UserQueryParams,
    options?: { [key: string]: any },
) {
    return request<API.Result<API.User[]>>('/api/users', {
        method: 'GET',
        params: {
            ...params,
        },
        ...(options || {}),
    });
}

/** Create new user */
export async function createUser(body: API.RegisterParams) {
    return request<API.Result<API.User>>('/api/users', {
        method: 'POST',
        data: body,
    });
}

/** Update user */
export async function updateUser(id: number, body: API.UserUpdateDTO) {
    return request<API.Result<API.User>>(`/api/users/${id}`, {
        method: 'PUT',
        data: body,
    });
}

/** Delete user */
export async function deleteUser(id: number) {
    return request<API.Result<string>>(`/api/users/${id}`, {
        method: 'DELETE',
    });
}
