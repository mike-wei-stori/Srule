import { request } from '@umijs/max';

/** Execute rule package (Production) */
export async function executeRule(body: API.RuleExecutionParams) {
    return request<API.Result<API.RuleExecutionResult>>('/api/execute/execute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
    });
}

/** Execute rule package (Draft/Test) */
export async function testRule(body: API.RuleExecutionParams) {
    return request<API.Result<API.RuleExecutionResult>>('/api/execute/test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
    });
}
