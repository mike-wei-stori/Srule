import { request } from '@umijs/max';

/** Get rule packages list */
export async function getPackages(
    params: API.PackageQueryParams,
    options?: { [key: string]: any },
) {
    return request<API.Result<API.RulePackage[]>>('/api/packages', {
        method: 'GET',
        params: {
            ...params,
        },
        ...(options || {}),
    });
}

/** Get rule package detail */
export async function getPackage(id: number) {
    return request<API.Result<API.RulePackage>>(`/api/packages/${id}`, {
        method: 'GET',
    });
}

/** Create rule package */
export async function createPackage(body: API.PackageDTO) {
    return request<API.Result<API.RulePackage>>('/api/packages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
    });
}

/** Update rule package */
export async function updatePackage(id: number, body: API.PackageDTO) {
    return request<API.Result<API.RulePackage>>(`/api/packages/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
    });
}

/** Delete rule package */
export async function deletePackage(id: number) {
    return request<API.Result<string>>(`/api/packages/${id}`, {
        method: 'DELETE',
    });
}

/** Load package graph */
export async function loadPackageGraph(packageId: number) {
    return request<API.Result<API.PackageGraphData>>(`/api/packages/loadGraph/${packageId}`, {
        method: 'GET',
    });
}

/** Save package graph */
export async function savePackageGraph(body: { packageId: number; graphData: API.PackageGraphData }) {
    return request<API.Result<string>>('/api/packages/saveGraph', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
    });
}

/** Publish package */
export async function publishPackage(id: number, description: string) {
    return request<API.Result<string>>(`/api/packages/${id}/publish`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: { description },
    });
}

/** Offline package */
export async function offlinePackage(id: number) {
    return request<API.Result<string>>(`/api/packages/${id}/offline`, {
        method: 'POST',
    });
}

/** Create package version */
export async function createPackageVersion(id: number, version: string, description: string, contentJson: string) {
    return request<API.Result<API.RulePackageVersion>>(`/api/packages/${id}/versions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: { version, description, contentJson },
    });
}

/** Get package versions */
export async function getPackageVersions(id: number) {
    return request<API.Result<API.RulePackageVersion[]>>(`/api/packages/${id}/versions`, {
        method: 'GET',
    });
}

/** Rollback package version */
export async function rollbackPackageVersion(packageId: number, versionId: number) {
    return request<API.Result<string>>(`/api/packages/${packageId}/versions/${versionId}/rollback`, {
        method: 'POST',
    });
}
