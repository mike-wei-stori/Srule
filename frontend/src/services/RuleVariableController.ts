import { request } from '@umijs/max';

/** Get variables by package ID */
export async function getVariablesByPackage(
    packageId: number,
    options?: { [key: string]: any },
) {
    return request<API.Result<API.RuleVariable[]>>('/api/variables/package/' + packageId, {
        method: 'GET',
        ...(options || {}),
    });
}

/** Create variable */
export async function createVariable(body: API.RuleVariableDTO) {
    return request<API.Result<API.RuleVariable>>('/api/variables', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
    });
}

/** Update variable */
export async function updateVariable(id: number, body: API.RuleVariableDTO) {
    return request<API.Result<API.RuleVariable>>(`/api/variables/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
    });
}

/** Delete variable */
export async function deleteVariable(id: number) {
    return request<API.Result<string>>(`/api/variables/${id}`, {
        method: 'DELETE',
    });
}
