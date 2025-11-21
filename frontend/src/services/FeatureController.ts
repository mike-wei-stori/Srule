import { request } from '@umijs/max';

/** Get features list */
export async function getFeatures(
    params: API.FeatureQueryParams,
    options?: { [key: string]: any },
) {
    return request<API.Result<API.Feature[]>>('/api/features', {
        method: 'GET',
        params: {
            ...params,
        },
        ...(options || {}),
    });
}

/** Get feature detail */
export async function getFeature(id: number) {
    return request<API.Result<API.Feature>>(`/api/features/${id}`, {
        method: 'GET',
    });
}

/** Create feature */
export async function createFeature(body: API.FeatureDTO) {
    return request<API.Result<API.Feature>>('/api/features', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
    });
}

/** Update feature */
export async function updateFeature(id: number, body: API.FeatureDTO) {
    return request<API.Result<API.Feature>>(`/api/features/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
    });
}

/** Delete feature */
export async function deleteFeature(id: number) {
    return request<API.Result<string>>(`/api/features/${id}`, {
        method: 'DELETE',
    });
}
/** Execute feature */
export async function executeFeature(id: number, context: Record<string, any>) {
    return request<API.Result<any>>(`/api/features/${id}/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: context,
    });
}
