import { request } from '@umijs/max';

/** Login */
export async function login(body: API.LoginParams) {
    return request<API.Result<API.LoginResult>>('/api/auth/login', {
        method: 'POST',
        data: body,
    });
}

/** Register */
export async function register(body: API.RegisterParams) {
    return request<API.Result<API.User>>('/api/auth/register', {
        method: 'POST',
        data: body,
    });
}
