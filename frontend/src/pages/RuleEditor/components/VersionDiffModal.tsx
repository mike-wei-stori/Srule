import React, { useMemo, useState } from 'react';
import { Modal, Tabs, Descriptions, Tag, Typography, Empty, Badge, Card, List, Space } from 'antd';
import ReactFlow, { Node, Edge, Background, Controls, MiniMap, BackgroundVariant, MarkerType, ReactFlowProvider } from 'reactflow';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import 'reactflow/dist/style.css';
import dayjs from 'dayjs';

// Import Node Types
import StartNode from './nodes/StartNode';
import DecisionNode from './nodes/DecisionNode';
import ActionNode from './nodes/ActionNode';
import ScriptNode from './nodes/ScriptNode';
import LoopNode from './nodes/LoopNode';
import SwitchNode from './nodes/SwitchNode';
import DecisionTableNode from './nodes/DecisionTableNode';
import { getLayoutedElements } from '../utils/layout';

const { Text } = Typography;

interface VersionDiffModalProps {
    visible: boolean;
    onClose: () => void;
    baseVersion: API.RulePackageVersion | null;
    targetVersion: API.RulePackageVersion | null;
}

const nodeTypes = {
    DECISION: DecisionNode,
    ACTION: ActionNode,
    START: StartNode,
    SCRIPT: ScriptNode,
    LOOP: LoopNode,
    SWITCH: SwitchNode,
    DECISION_TABLE: DecisionTableNode,
};

const VersionDiffModal: React.FC<VersionDiffModalProps> = ({ visible, onClose, baseVersion, targetVersion }) => {
    const [activeTab, setActiveTab] = useState('overview');

    // --- Data Processing ---

    const parseJson = (data: any) => {
        if (!data) return {};
        if (typeof data === 'object') return data;

        const tryParse = (jsonString: string) => {
            try {
                const parsed = JSON.parse(jsonString);
                // Handle double-stringified JSON
                if (typeof parsed === 'string') {
                    try {
                        return JSON.parse(parsed);
                    } catch (e) {
                        return parsed;
                    }
                }
                return parsed;
            } catch (e) {
                return null;
            }
        };

        // 1. Try normal parse
        let result = tryParse(data);
        if (result) return result;

        // 2. Try fixing unquoted numeric keys (e.g. {1: {...}}) which FastJSON might produce for Maps
        try {
            // Regex to find {123: and replace with {"123":
            // We look for { followed by digits followed by :
            const fixedData = data.replace(/\{(\d+):/g, '{"$1":');
            result = tryParse(fixedData);
            if (result) return result;
        } catch (e) {
            // Ignore regex errors
        }

        console.error('JSON Parse Error: Failed to parse data even after fix attempts.');
        return {};
    };

    const baseGraph = useMemo(() => {
        const parsed = parseJson(baseVersion?.contentJson);
        return { nodes: [], edges: [], ...parsed };
    }, [baseVersion]);

    const targetGraph = useMemo(() => {
        const parsed = parseJson(targetVersion?.contentJson);
        return { nodes: [], edges: [], ...parsed };
    }, [targetVersion]);

    const baseSnapshot = useMemo(() => {
        return parseJson(baseVersion?.snapshotData);
    }, [baseVersion]);

    const targetSnapshot = useMemo(() => {
        return parseJson(targetVersion?.snapshotData);
    }, [targetVersion]);

    // --- Diff Logic ---

    // Helper to remove transient fields and sort keys for consistent stringify
    const sanitizeData = (data: any) => {
        if (!data) return {};
        const { onChange, onMenuClick, validateNodeName, packageId, ...rest } = data;
        // Sort keys
        return Object.keys(rest).sort().reduce((obj: any, key) => {
            obj[key] = rest[key];
            return obj;
        }, {});
    };

    const diffResult = useMemo(() => {
        const baseNodesMap = new Map(baseGraph.nodes.map((n: Node) => [n.id, n]));
        const targetNodesMap = new Map(targetGraph.nodes.map((n: Node) => [n.id, n]));

        const addedNodes: Node[] = [];
        const modifiedNodes: Node[] = [];
        const removedNodes: Node[] = [];
        const unchangedNodes: Node[] = [];

        // Check Target Nodes
        targetGraph.nodes.forEach((node: Node) => {
            if (!baseNodesMap.has(node.id)) {
                addedNodes.push(node);
            } else {
                const baseNode = baseNodesMap.get(node.id);

                // Simple data comparison
                const targetData = JSON.stringify(sanitizeData(node.data));
                const baseData = JSON.stringify(sanitizeData((baseNode as any)?.data));

                if (targetData !== baseData) {
                    console.log('Node Modified:', node.id);
                    console.log('Base Data:', baseData);
                    console.log('Target Data:', targetData);
                    modifiedNodes.push(node);
                } else {
                    unchangedNodes.push(node);
                }
            }
        });

        // Check Base Nodes for removals
        baseGraph.nodes.forEach((node: Node) => {
            if (!targetNodesMap.has(node.id)) {
                removedNodes.push(node);
            }
        });

        return { addedNodes, modifiedNodes, removedNodes, unchangedNodes };
    }, [baseGraph, targetGraph]);



    // Prepare Graph for Display (Target Graph with Highlights)
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
        if (!targetGraph.nodes.length) return { nodes: [], edges: [] };

        // Apply layout
        const { nodes, edges } = getLayoutedElements(
            targetGraph.nodes,
            targetGraph.edges,
            'LR'
        );

        return { nodes, edges };
    }, [targetGraph]);

    const displayNodes = useMemo(() => {
        return layoutedNodes.map((node: Node) => {
            let style = { ...node.style };

            if (diffResult.addedNodes.find(n => n.id === node.id)) {
                style = { ...style, border: '2px solid #52c41a', boxShadow: '0 0 10px rgba(82, 196, 26, 0.5)', borderRadius: '12px' };
            } else if (diffResult.modifiedNodes.find(n => n.id === node.id)) {
                style = { ...style, border: '2px solid #faad14', boxShadow: '0 0 10px rgba(250, 173, 20, 0.5)', borderRadius: '12px' };
            }

            return {
                ...node,
                data: { ...node.data, readonly: true }, // Inject readonly flag
                style,
                draggable: false,
                connectable: false,
                selectable: true,
            };
        });
    }, [layoutedNodes, diffResult]);

    const displayEdges = useMemo(() => {
        return layoutedEdges.map((edge: Edge) => ({
            ...edge,
            animated: false,
            style: { ...edge.style, stroke: '#b1b1b7' },
        }));
    }, [layoutedEdges]);

    // DRL Extraction
    const getDrlContent = (snapshot: any, rawData: any) => {
        console.log('getDrlContent snapshot:', snapshot);
        console.log('getDrlContent rawData:', rawData);

        if (!snapshot) {
            return `// Snapshot is null or undefined.\n// Raw Data Type: ${typeof rawData}\n// Raw Data Preview: ${JSON.stringify(rawData)?.slice(0, 500)}`;
        }
        if (!snapshot.ruleDefinitions || snapshot.ruleDefinitions.length === 0) {
            return `// No DRL content found in snapshot.\n// Snapshot keys: ${Object.keys(snapshot).join(', ')}\n// Raw Data Preview: ${JSON.stringify(rawData)?.slice(0, 1000)}`;
        }

        return snapshot.ruleDefinitions.map((def: any) => {
            const content = def.drlContent || def.drl; // Try both just in case
            if (!content) return `// Rule: ${def.name}\n// (No DRL generated for this rule)`;
            return `// Rule: ${def.name}\n${content}`;
        }).join('\n\n');
    };


    const baseDrl = getDrlContent(baseSnapshot, baseVersion?.snapshotData);
    const targetDrl = getDrlContent(targetSnapshot, targetVersion?.snapshotData);


    // --- Renderers ---

    const renderOverview = () => (
        <div style={{ padding: 20 }}>
            <Descriptions title="Version Comparison" bordered column={2}>
                <Descriptions.Item label="Base Version">
                    <Tag color="blue">{baseVersion?.version}</Tag>
                    <br />
                    <Text type="secondary">{dayjs(baseVersion?.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
                    <br />
                    <Text type="secondary">by {baseVersion?.createdBy}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Target Version">
                    <Tag color="green">{targetVersion?.version}</Tag>
                    <br />
                    <Text type="secondary">{dayjs(targetVersion?.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
                    <br />
                    <Text type="secondary">by {targetVersion?.createdBy}</Text>
                </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
                <Typography.Title level={5}>Changes Summary</Typography.Title>
                <Space size="large">
                    <Card size="small" title="Added Nodes" style={{ width: 200 }}>
                        <Typography.Title level={2} style={{ color: '#52c41a', margin: 0 }}>
                            {diffResult.addedNodes.length}
                        </Typography.Title>
                    </Card>
                    <Card size="small" title="Modified Nodes" style={{ width: 200 }}>
                        <Typography.Title level={2} style={{ color: '#faad14', margin: 0 }}>
                            {diffResult.modifiedNodes.length}
                        </Typography.Title>
                    </Card>
                    <Card size="small" title="Removed Nodes" style={{ width: 200 }}>
                        <Typography.Title level={2} style={{ color: '#ff4d4f', margin: 0 }}>
                            {diffResult.removedNodes.length}
                        </Typography.Title>
                    </Card>
                </Space>
            </div>

            {diffResult.removedNodes.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <Typography.Title level={5}>Removed Nodes Details</Typography.Title>
                    <List
                        size="small"
                        bordered
                        dataSource={diffResult.removedNodes}
                        renderItem={item => (
                            <List.Item>
                                <Tag color="red">REMOVED</Tag> {item.data.label} ({item.type})
                            </List.Item>
                        )}
                    />
                </div>
            )}
        </div>
    );

    const miniMapNodeColor = (node: Node) => {
        if (diffResult.addedNodes.find(n => n.id === node.id)) return '#52c41a';
        if (diffResult.modifiedNodes.find(n => n.id === node.id)) return '#faad14';
        return '#d9d9d9';
    };

    const renderGraphDiff = () => (
        <div style={{ height: '600px', width: '100%', border: '1px solid #f0f0f0' }}>
            <div style={{ position: 'absolute', zIndex: 10, padding: 10, background: 'rgba(255,255,255,0.8)' }}>
                <Space>
                    <Badge color="#52c41a" text="Added" />
                    <Badge color="#faad14" text="Modified" />
                    <Badge color="#d9d9d9" text="Unchanged" />
                </Space>
            </div>
            <ReactFlowProvider>
                <ReactFlow
                    nodes={displayNodes}
                    edges={displayEdges}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-right"
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={true}
                >
                    <Background color="#888" gap={16} variant={BackgroundVariant.Dots} />
                    <Controls />
                    <MiniMap
                        nodeColor={miniMapNodeColor}
                        pannable
                        zoomable
                    />
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );

    const renderDrlDiff = () => (
        <div style={{ height: '600px', overflow: 'auto' }}>
            <ReactDiffViewer
                oldValue={baseDrl}
                newValue={targetDrl}
                splitView={true}
                compareMethod={DiffMethod.WORDS}
                leftTitle={`Version ${baseVersion?.version}`}
                rightTitle={`Version ${targetVersion?.version}`}
            />
        </div>
    );



    return (
        <Modal
            title={`Compare Version ${baseVersion?.version} vs ${targetVersion?.version}`}
            open={visible}
            onCancel={onClose}
            width="90%"
            footer={null}
            style={{ top: 20 }}
            bodyStyle={{ padding: 0 }}
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: 'overview',
                        label: 'Overview',
                        children: renderOverview(),
                    },
                    {
                        key: 'graph',
                        label: 'Graph Comparison',
                        children: renderGraphDiff(),
                    },
                    {
                        key: 'drl',
                        label: 'DRL Comparison',
                        children: renderDrlDiff(),
                    }
                ]}
                tabBarStyle={{ paddingLeft: 20, marginBottom: 0 }}
            />
        </Modal>
    );
};

export default VersionDiffModal;
