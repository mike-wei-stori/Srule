import { request } from '@umijs/max';

/** Execute rule package */
export async function executeRule(body: API.RuleExecutionParams) {
    return request<API.Result<API.RuleExecutionResult>>('/api/execute/execute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
    });
}
