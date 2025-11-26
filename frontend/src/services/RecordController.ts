import { request } from '@umijs/max';

export async function listFeatureRecords(
    params: {
        current?: number;
        pageSize?: number;
        reqId?: string;
        featureName?: string;
    },
) {
    return request<API.Result<API.Page<API.FeatureRecord>>>('/api/records/features', {
        method: 'GET',
        params,
    });
}

export async function listRuleRecords(
    params: {
        current?: number;
        pageSize?: number;
        reqId?: string;
        packageCode?: string;
        status?: string;
    },
) {
    return request<API.Result<API.Page<API.RuleExecutionRecord>>>('/api/records/rules', {
        method: 'GET',
        params,
    });
}

export async function getRuleRecord(id: number) {
    return request<API.Result<API.RuleExecutionRecord>>(`/api/records/rules/${id}`, {
        method: 'GET',
    });
}
