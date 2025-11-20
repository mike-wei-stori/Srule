// Condition type definitions for rich rule conditions

export type ConditionType =
    | 'COMPARISON'
    | 'RANGE'
    | 'IN_LIST'
    | 'STRING'
    | 'DATE'
    | 'EXISTENCE'
    | 'COMPOUND';

export type ComparisonOperator = '==' | '!=' | '>' | '<' | '>=' | '<=';
export type StringOperator = 'contains' | 'startsWith' | 'endsWith' | 'matches' | 'isEmpty' | 'isNotEmpty';
export type DateOperator = 'before' | 'after' | 'between' | 'today' | 'thisWeek' | 'thisMonth' | 'daysAgo';
export type ExistenceOperator = 'isNull' | 'isNotNull' | 'exists' | 'notExists';
export type LogicalOperator = 'AND' | 'OR' | 'NOT';

export interface BaseCondition {
    id?: string;
    type: ConditionType;
}

export interface ComparisonCondition extends BaseCondition {
    type: 'COMPARISON';
    variable: string;
    operator: ComparisonOperator;
    value: any;
}

export interface RangeCondition extends BaseCondition {
    type: 'RANGE';
    variable: string;
    min: number;
    max: number;
    includeMin: boolean;
    includeMax: boolean;
}

export interface ListCondition extends BaseCondition {
    type: 'IN_LIST';
    variable: string;
    values: any[];
    negate?: boolean; // NOT IN
}

export interface StringCondition extends BaseCondition {
    type: 'STRING';
    variable: string;
    operator: StringOperator;
    value?: string;
    caseSensitive?: boolean;
}

export interface DateCondition extends BaseCondition {
    type: 'DATE';
    variable: string;
    operator: DateOperator;
    value?: string | number;
    startDate?: string;
    endDate?: string;
}

export interface ExistenceCondition extends BaseCondition {
    type: 'EXISTENCE';
    variable: string;
    operator: ExistenceOperator;
}

export interface CompoundCondition extends BaseCondition {
    type: 'COMPOUND';
    operator: LogicalOperator;
    conditions: Condition[];
}

export type Condition =
    | ComparisonCondition
    | RangeCondition
    | ListCondition
    | StringCondition
    | DateCondition
    | ExistenceCondition
    | CompoundCondition;

// Operator metadata for UI display
export const COMPARISON_OPERATORS = [
    { value: '==', label: '等于', icon: '=' },
    { value: '!=', label: '不等于', icon: '≠' },
    { value: '>', label: '大于', icon: '>' },
    { value: '<', label: '小于', icon: '<' },
    { value: '>=', label: '大于等于', icon: '≥' },
    { value: '<=', label: '小于等于', icon: '≤' }
] as const;

export const STRING_OPERATORS = [
    { value: 'contains', label: '包含', icon: '⊃' },
    { value: 'startsWith', label: '开始于', icon: '↦' },
    { value: 'endsWith', label: '结束于', icon: '↤' },
    { value: 'matches', label: '匹配正则', icon: '~' },
    { value: 'isEmpty', label: '为空', icon: '∅' },
    { value: 'isNotEmpty', label: '非空', icon: '≠∅' }
] as const;

export const DATE_OPERATORS = [
    { value: 'before', label: '早于' },
    { value: 'after', label: '晚于' },
    { value: 'between', label: '介于' },
    { value: 'today', label: '今天' },
    { value: 'thisWeek', label: '本周' },
    { value: 'thisMonth', label: '本月' },
    { value: 'daysAgo', label: 'N天前' }
] as const;

export const EXISTENCE_OPERATORS = [
    { value: 'isNull', label: '为空' },
    { value: 'isNotNull', label: '非空' },
    { value: 'exists', label: '存在' },
    { value: 'notExists', label: '不存在' }
] as const;

export const LOGICAL_OPERATORS = [
    { value: 'AND', label: '并且', icon: '∧' },
    { value: 'OR', label: '或者', icon: '∨' },
    { value: 'NOT', label: '非', icon: '¬' }
] as const;

// Helper function to format condition for display
export function formatCondition(condition: Condition): string {
    switch (condition.type) {
        case 'COMPARISON':
            const compOp = COMPARISON_OPERATORS.find(o => o.value === condition.operator);
            return `${condition.variable} ${compOp?.icon || condition.operator} ${condition.value}`;

        case 'RANGE':
            const minBracket = condition.includeMin ? '[' : '(';
            const maxBracket = condition.includeMax ? ']' : ')';
            return `${condition.variable} ∈ ${minBracket}${condition.min}, ${condition.max}${maxBracket}`;

        case 'IN_LIST':
            const listOp = condition.negate ? '∉' : '∈';
            return `${condition.variable} ${listOp} {${condition.values.join(', ')}}`;

        case 'STRING':
            const strOp = STRING_OPERATORS.find(o => o.value === condition.operator);
            if (condition.operator === 'isEmpty' || condition.operator === 'isNotEmpty') {
                return `${condition.variable} ${strOp?.label}`;
            }
            return `${condition.variable} ${strOp?.label} "${condition.value}"`;

        case 'DATE':
            const dateOp = DATE_OPERATORS.find(o => o.value === condition.operator);
            if (condition.operator === 'between') {
                return `${condition.variable} ${dateOp?.label} ${condition.startDate} ~ ${condition.endDate}`;
            }
            if (['today', 'thisWeek', 'thisMonth'].includes(condition.operator)) {
                return `${condition.variable} = ${dateOp?.label}`;
            }
            return `${condition.variable} ${dateOp?.label} ${condition.value}`;

        case 'EXISTENCE':
            const existOp = EXISTENCE_OPERATORS.find(o => o.value === condition.operator);
            return `${condition.variable} ${existOp?.label}`;

        case 'COMPOUND':
            const logicOp = LOGICAL_OPERATORS.find(o => o.value === condition.operator);
            if (condition.operator === 'NOT') {
                return `${logicOp?.icon} (${formatCondition(condition.conditions[0])})`;
            }
            return condition.conditions
                .map(c => `(${formatCondition(c)})`)
                .join(` ${logicOp?.icon} `);

        default:
            return '';
    }
}

// Helper to get condition type label
export function getConditionTypeLabel(type: ConditionType): string {
    const labels: Record<ConditionType, string> = {
        'COMPARISON': '比较条件',
        'RANGE': '范围条件',
        'IN_LIST': '列表条件',
        'STRING': '字符串条件',
        'DATE': '日期条件',
        'EXISTENCE': '存在性条件',
        'COMPOUND': '复合条件'
    };
    return labels[type];
}
