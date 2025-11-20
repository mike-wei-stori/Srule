import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { Typography, Space } from 'antd';
import { BaseNode } from './BaseNode';

const { Text } = Typography;

const StartNode = (props: NodeProps) => {
    return (
        <BaseNode {...props}>
            <Space size={4}>
                <Text strong style={{ color: '#8c8c8c', fontSize: 16 }}>▼</Text>
                <Text strong>开始</Text>
            </Space>
        </BaseNode>
    );
};

export default memo(StartNode);
