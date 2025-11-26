import { request } from '@umijs/max';

/** Get all system configs */
export async function getSysConfigs() {
    return request<API.Result<API.SysConfig[]>>('/api/sys/config/list', {
        method: 'GET',
    });
}

/** Get config by key */
export async function getSysConfig(key: string) {
    return request<API.Result<string>>(`/api/sys/config/${key}`, {
        method: 'GET',
    });
}

/** Save or update config */
export async function saveSysConfig(body: Partial<API.SysConfig>) {
    return request<API.Result<void>>('/api/sys/config', {
        method: 'POST',
        data: body,
    });
}

/** Delete config */
export async function deleteSysConfig(key: string) {
    return request<API.Result<void>>(`/api/sys/config/${key}`, {
        method: 'DELETE',
    });
}

