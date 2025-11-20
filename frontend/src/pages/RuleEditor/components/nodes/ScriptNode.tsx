import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { Input, Space, Typography, Select } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import { BaseNode } from './BaseNode';

const { Text } = Typography;

const ScriptNode = (props: NodeProps) => {
    const { id, data } = props;

    const handleDataChange = (updates: any) => {
        data.onChange(id, { ...data, ...updates });
    };

    return (
        <BaseNode {...props} style={{ minWidth: 250 }}>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Space size={4} style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Space size={4}>
                        <CodeOutlined style={{ color: '#722ed1', fontSize: 14 }} />
                        <Text type="secondary" style={{ fontSize: 11 }}>SCRIPT</Text>
                    </Space>
                    <Select
                        className="nodrag"
                        value={data.scriptType || 'GROOVY'}
                        onChange={(value) => handleDataChange({ scriptType: value })}
                        size="small"
                        bordered={false}
                        style={{ width: 80, fontSize: 10 }}
                        options={[
                            { label: 'Groovy', value: 'GROOVY' },
                            { label: 'JS', value: 'JAVASCRIPT' }
                        ]}
                    />
                </Space>
                <Input.TextArea
                    className="nodrag"
                    value={data.scriptContent}
                    onChange={(e) => handleDataChange({ scriptContent: e.target.value })}
                    placeholder="// Write your script here..."
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    style={{
                        fontSize: 11,
                        fontFamily: 'monospace',
                        background: '#1e1e1e',
                        color: '#d4d4d4',
                        border: '1px solid #333',
                        borderRadius: 4
                    }}
                />
            </Space>
        </BaseNode>
    );
};

export default memo(ScriptNode);
