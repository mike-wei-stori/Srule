import { request } from '@umijs/max';

/** Get versions for a package */
export async function getVersions(packageId: number) {
  return request<API.Result<API.RulePackageVersion[]>>(`/api/packages/${packageId}/versions`, {
    method: 'GET',
  });
}

/** Create a new version */
export async function createVersion(packageId: number, data: API.CreateVersionParams & { contentJson: string }) {
  return request<API.Result<API.RulePackageVersion>>(`/api/packages/${packageId}/versions`, {
    method: 'POST',
    data,
  });
}

/** Rollback to a version */
export async function rollbackVersion(packageId: number, versionId: number) {
  return request<API.Result<boolean>>(`/api/packages/${packageId}/versions/${versionId}/rollback`, {
    method: 'POST',
  });
}

/** Activate a version */
export async function activateVersion(packageId: number, versionId: number) {
  return request<API.Result<boolean>>(`/api/packages/${packageId}/versions/${versionId}/activate`, {
    method: 'POST',
  });
}

