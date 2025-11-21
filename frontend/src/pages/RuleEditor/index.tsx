import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    MarkerType,
    ReactFlowProvider,
    useReactFlow,
    Panel,
    BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PageContainer } from '@ant-design/pro-components';
import { Button, message, Tabs, Space, Tooltip } from 'antd';
import {
    SaveOutlined,
    LayoutOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    CompressOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    CopyOutlined,
    SnippetsOutlined
} from '@ant-design/icons';
import { useParams, request, useIntl } from '@umijs/max';
import { getPackages, loadPackageGraph, savePackageGraph } from '@/services/RulePackageController';
import StartNode from './components/nodes/StartNode';
import DecisionNode from './components/nodes/DecisionNode';
import ActionNode from './components/nodes/ActionNode';
import ScriptNode from './components/nodes/ScriptNode';
import LoopNode from './components/nodes/LoopNode';
import ParameterPanel from './components/ParameterPanel';
import TestPanel from './components/TestPanel';

// ... existing imports ...


import NodePalette from './components/NodePalette';
import CanvasContextMenu from './components/CanvasContextMenu';
import { getLayoutedElements } from './utils/layout';

const nodeTypes = {
    DECISION: DecisionNode,
    ACTION: ActionNode,
    START: StartNode,
    SCRIPT: ScriptNode,
    LOOP: LoopNode,
};

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'START',
        data: { label: 'Start', type: 'START' },
        position: { x: 0, y: 0 }
    },
];

const RuleEditorContent = () => {
    const { packageCode } = useParams<{ packageCode: string }>();
    const intl = useIntl();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [packageId, setPackageId] = useState<number | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [copiedNode, setCopiedNode] = useState<Node | null>(null);
    const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const reactFlowInstance = useReactFlow();
    const onPasteNodeRef = useRef<() => void>(() => { });

    // Fetch package ID
    useEffect(() => {
        const fetchPackage = async () => {
            try {
                const res = await getPackages({ code: packageCode });
                if (res.data && res.data.length > 0) {
                    setPackageId(res.data[0].id);
                }
            } catch (e) {
                message.error(intl.formatMessage({ id: 'pages.editor.loadFailed' }));
            }
        };
        if (packageCode) fetchPackage();
    }, [packageCode]);

    // Load graph when packageId is set
    useEffect(() => {
        const loadGraph = async () => {
            if (!packageId) return;

            try {
                const res = await loadPackageGraph(packageId);
                if (res.data && res.data.nodes && res.data.nodes.length > 0) {
                    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                        res.data.nodes,
                        res.data.edges || [],
                        'LR'
                    );
                    setNodes(layoutedNodes);
                    setEdges(layoutedEdges);

                    setTimeout(() => {
                        reactFlowInstance.fitView();
                    }, 100);

                    message.success(intl.formatMessage({ id: 'pages.editor.loadSuccess' }));
                }
            } catch (e) {
                console.error('Failed to load graph:', e);
            }
        };

        loadGraph();
    }, [packageId, setNodes, setEdges, reactFlowInstance]);

    // Fullscreen handling
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Auto Layout
    const onLayout = useCallback((direction = 'LR') => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges,
            direction
        );
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
        window.requestAnimationFrame(() => reactFlowInstance.fitView());
    }, [nodes, edges, setNodes, setEdges, reactFlowInstance]);

    // Zoom controls
    const onZoomIn = useCallback(() => {
        reactFlowInstance.zoomIn();
    }, [reactFlowInstance]);

    const onZoomOut = useCallback(() => {
        reactFlowInstance.zoomOut();
    }, [reactFlowInstance]);

    const onFitView = useCallback(() => {
        reactFlowInstance.fitView();
    }, [reactFlowInstance]);

    // Fullscreen toggle
    const toggleFullscreen = useCallback(() => {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                message.error(intl.formatMessage({ id: 'pages.editor.fullscreenRequestFailed' }));
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    // Copy/Paste functionality
    const onCopyNode = useCallback((nodeId: string) => {
        const currentNodes = reactFlowInstance.getNodes();
        const node = currentNodes.find(n => n.id === nodeId);
        if (node) {
            setCopiedNode(node);
            message.success(intl.formatMessage({ id: 'pages.editor.copyNode' }));
        }
    }, [reactFlowInstance]);

    // Validate Node Name (Rule Name)
    const validateNodeName = useCallback((name: string, nodeId: string) => {
        if (!name || !name.trim()) {
            return intl.formatMessage({ id: 'pages.editor.nameEmpty' });
        }
        const currentNodes = reactFlowInstance.getNodes();
        const isDuplicate = currentNodes.some(n => n.id !== nodeId && n.data.label === name.trim());
        if (isDuplicate) {
            return intl.formatMessage({ id: 'pages.editor.nameUnique' });
        }
        return null;
    }, [reactFlowInstance]);

    // Handle Node Data Change (Inline Editing)
    const onNodeDataChange = useCallback((id: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: newData };
                }
                return node;
            })
        );
    }, [setNodes]);

    // Handle Menu Actions (Defined before onPasteNode because onPasteNode uses it indirectly via onMenuClick if needed, but actually onPasteNode is independent)
    // But onMenuClick uses onCopyNode and onPasteNode, so onPasteNode must be defined before onMenuClick.



    // Move node up/down
    const onMoveNode = useCallback((nodeId: string, direction: 'up' | 'down') => {
        const currentNodes = reactFlowInstance.getNodes();
        const currentEdges = reactFlowInstance.getEdges();
        const node = currentNodes.find(n => n.id === nodeId);
        if (!node) return;

        const parentEdge = currentEdges.find(e => e.target === nodeId);
        if (!parentEdge) {
            message.warning(intl.formatMessage({ id: 'pages.editor.cannotMoveRoot' }));
            return;
        }

        // Find all edges from the same parent
        const siblingEdges = currentEdges.filter(e => e.source === parentEdge.source);

        // Sort sibling edges by their current order in the array (which dictates layout order)
        // or by some other property if we had one. But here we rely on array order.
        // Wait, we need to find the index of our edge in the siblingEdges list.
        const currentIndex = siblingEdges.findIndex(e => e.target === nodeId);

        if (currentIndex === -1) return;

        if (direction === 'up' && currentIndex === 0) {
            message.warning(intl.formatMessage({ id: 'pages.editor.alreadyTop' }));
            return;
        }
        if (direction === 'down' && currentIndex === siblingEdges.length - 1) {
            message.warning(intl.formatMessage({ id: 'pages.editor.alreadyBottom' }));
            return;
        }

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        // Swap edges in the main edges array
        const newEdges = [...currentEdges];
        const edgeA = siblingEdges[currentIndex];
        const edgeB = siblingEdges[targetIndex];

        const indexA = newEdges.findIndex(e => e.id === edgeA.id);
        const indexB = newEdges.findIndex(e => e.id === edgeB.id);

        if (indexA !== -1 && indexB !== -1) {
            // Swap
            [newEdges[indexA], newEdges[indexB]] = [newEdges[indexB], newEdges[indexA]];

            // Also swap labels/handles if they are decision branches to maintain logic consistency?
            // Actually, if we just swap the order, the layout will swap their positions.
            // But if one is True and one is False, we might want to swap their labels/handles too 
            // if the user intends to "swap branches". 
            // However, usually "move up/down" just means visual reordering. 
            // But for Decision nodes, visual order IS logical order (True vs False).
            // If we swap True and False branches visually, we should probably swap their logical meaning too?
            // Or maybe just swap the target nodes?
            // Let's assume visual reordering for now. But wait, our layout sorts by True/False!
            // If we sort by True/False in layout.ts, then reordering edges here won't affect layout 
            // UNLESS we also change the labels/handles.

            // Let's check if we are children of a Decision node.
            const parentNode = currentNodes.find(n => n.id === parentEdge.source);
            if (parentNode && parentNode.type === 'DECISION') {
                // Swap labels and handles
                const tempLabel = newEdges[indexA].label;
                const tempHandle = newEdges[indexA].sourceHandle;

                newEdges[indexA] = { ...newEdges[indexA], label: newEdges[indexB].label, sourceHandle: newEdges[indexB].sourceHandle };
                newEdges[indexB] = { ...newEdges[indexB], label: tempLabel, sourceHandle: tempHandle };
            }

            setEdges(newEdges);
            setTimeout(() => onLayout(), 50);
            message.success(direction === 'up' ? intl.formatMessage({ id: 'pages.editor.moveUp' }) : intl.formatMessage({ id: 'pages.editor.moveDown' }));
        }
    }, [reactFlowInstance, setEdges, onLayout]);

    // Generate Unique Node Name
    const generateNodeName = useCallback((type: string) => {
        const prefix = type.charAt(0) + type.slice(1).toLowerCase(); // e.g., "Decision", "Action"
        let index = 1;
        let name = `${prefix} ${index}`;
        const currentNodes = reactFlowInstance.getNodes();

        // Check for duplicates
        while (currentNodes.some(n => n.data.label === name)) {
            index++;
            name = `${prefix} ${index}`;
        }
        return name;
    }, [reactFlowInstance]);

    // Handle Menu Actions
    const onMenuClick = useCallback((action: string, parentNode: Node) => {
        if (!parentNode) return;

        if (action === 'copy') {
            onCopyNode(parentNode.id);
            return;
        } else if (action === 'paste') {
            onPasteNodeRef.current();
            return;
        } else if (action === 'moveUp') {
            onMoveNode(parentNode.id, 'up');
            return;
        } else if (action === 'moveDown') {
            onMoveNode(parentNode.id, 'down');
            return;
        }

        const newId = `node_${Date.now()}`;
        let newNode: Node | null = null;

        if (action === 'addCondition') {
            const label = generateNodeName('CONDITION');
            newNode = {
                id: newId,
                type: 'CONDITION',
                data: { label, type: 'CONDITION', operator: '==', value: '', packageId, onChange: onNodeDataChange, onMenuClick, validateNodeName },
                position: { x: parentNode.position.x + 250, y: parentNode.position.y },
            };
        } else if (action === 'addDecision' || action === 'addSubDecision') {
            const label = generateNodeName('DECISION');
            newNode = {
                id: newId,
                type: 'DECISION',
                data: { label, type: 'DECISION', parameter: '', packageId, onChange: onNodeDataChange, onMenuClick, validateNodeName },
                position: { x: parentNode.position.x + 250, y: parentNode.position.y },
            };
        } else if (action === 'addAction') {
            const label = generateNodeName('ACTION');
            newNode = {
                id: newId,
                type: 'ACTION',
                data: { label, type: 'ACTION', targetParameter: '', assignmentValue: '', packageId, onChange: onNodeDataChange, onMenuClick, validateNodeName },
                position: { x: parentNode.position.x + 250, y: parentNode.position.y },
            };
        } else if (action === 'addScript') {
            const label = generateNodeName('SCRIPT');
            newNode = {
                id: newId,
                type: 'SCRIPT',
                data: { label, type: 'SCRIPT', scriptType: 'GROOVY', scriptContent: '', packageId, onChange: onNodeDataChange, onMenuClick, validateNodeName },
                position: { x: parentNode.position.x + 250, y: parentNode.position.y },
            };
        } else if (action === 'addLoop') {
            const label = generateNodeName('LOOP');
            newNode = {
                id: newId,
                type: 'LOOP',
                data: { label, type: 'LOOP', collectionVariable: '', packageId, onChange: onNodeDataChange, onMenuClick, validateNodeName },
                position: { x: parentNode.position.x + 250, y: parentNode.position.y },
            };
        } else if (action === 'delete') {
            setNodes((nds) => nds.filter((node) => node.id !== parentNode.id));
            setEdges((eds) => eds.filter((edge) => edge.source !== parentNode.id && edge.target !== parentNode.id));
        }

        if (newNode) {
            setNodes((nds) => nds.concat(newNode!));
            setEdges((eds) => eds.concat({
                id: `e${parentNode.id}-${newId}`,
                source: parentNode.id,
                target: newId,
                type: 'smoothstep',
                label: action === 'addCondition' || action === 'addDecision' || action === 'addSubDecision' ? 'True' : undefined,
                markerEnd: { type: MarkerType.ArrowClosed },
            }));

            setTimeout(() => onLayout(), 50);
        }
    }, [packageId, onNodeDataChange, setNodes, setEdges, onLayout, onCopyNode, onMoveNode, validateNodeName, generateNodeName]);

    // Handle Paste Node
    const onPasteNode = useCallback(() => {
        if (!copiedNode || !packageId) return;

        const currentNodes = reactFlowInstance.getNodes();
        const newId = `node_${Date.now()}`;
        const position = {
            x: copiedNode.position.x + 50,
            y: copiedNode.position.y + 50,
        };

        // For pasted nodes, we might want to keep the name or generate a new one "Copy of ..."
        // But user asked for auto-generation on "New Node". 
        // Let's append "Copy" for paste to be safe and unique.
        let newLabel = `${copiedNode.data.label} Copy`;
        let copyIndex = 1;
        while (currentNodes.some(n => n.data.label === newLabel)) {
            newLabel = `${copiedNode.data.label} Copy ${copyIndex}`;
            copyIndex++;
        }

        const newNode: Node = {
            ...copiedNode,
            id: newId,
            position,
            data: {
                ...copiedNode.data,
                label: newLabel,
                packageId,
                onChange: onNodeDataChange,
                validateNodeName,
                onMenuClick // Explicitly assign onMenuClick
            }
        };

        setNodes((nds) => nds.concat(newNode));
        message.success(intl.formatMessage({ id: 'pages.editor.pasteNode' }));
    }, [copiedNode, packageId, setNodes, onNodeDataChange, validateNodeName, onMenuClick, reactFlowInstance]);

    // Sync onPasteNodeRef
    useEffect(() => {
        onPasteNodeRef.current = onPasteNode;
    }, [onPasteNode]);

    // Handle Drag and Drop
    const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
        setDraggedNodeType(nodeType);
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!draggedNodeType || !reactFlowInstance || !packageId) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNodeId = `node_${Date.now()}`;
            const label = generateNodeName(draggedNodeType);

            const newNode: Node = {
                id: newNodeId,
                type: draggedNodeType,
                position,
                data: {
                    label,
                    type: draggedNodeType,
                    packageId,
                    onChange: onNodeDataChange,
                    onMenuClick,
                    validateNodeName,
                },
            };

            setNodes((nds) => nds.concat(newNode));
            setDraggedNodeType(null);
            message.success(intl.formatMessage({ id: 'pages.editor.nodeCreated' }, { type: draggedNodeType }));
        },
        [draggedNodeType, reactFlowInstance, packageId, setNodes, onNodeDataChange, onMenuClick, validateNodeName, generateNodeName]
    );

    // Context Menu Handlers
    const onPaneContextMenu = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            setMenuVisible(true);
            setMenuPosition({ x: event.clientX, y: event.clientY });
        },
        [setMenuVisible, setMenuPosition]
    );

    const onPaneClick = useCallback(() => setMenuVisible(false), [setMenuVisible]);

    const onAddNodeFromMenu = useCallback((type: string) => {
        if (!reactFlowInstance || !packageId) return;

        const currentNodes = reactFlowInstance.getNodes();
        const id = `node_${Date.now()}`;
        const position = { x: 100 + currentNodes.length * 20, y: 100 + currentNodes.length * 20 };
        const label = generateNodeName(type);

        const newNode: Node = {
            id,
            type,
            position,
            data: {
                label,
                type,
                packageId,
                onChange: onNodeDataChange,
                onMenuClick,
                validateNodeName,
                ...(type === 'SCRIPT' ? { scriptType: 'GROOVY', scriptContent: '' } : {}),
                ...(type === 'LOOP' ? { collectionVariable: '' } : {}),
                ...(type === 'DECISION' ? { parameter: '', operator: '==', value: '' } : {}),
                ...(type === 'ACTION' ? { targetParameter: '', assignmentValue: '' } : {}),
            },
        };

        setNodes((nds) => nds.concat(newNode));
        message.success(intl.formatMessage({ id: 'pages.editor.nodeCreated' }, { type }));
    }, [reactFlowInstance, packageId, onNodeDataChange, onMenuClick, setNodes, validateNodeName, generateNodeName]);

    // Update nodes with handlers when loaded
    useEffect(() => {
        setNodes((nds) => nds.map(node => ({
            ...node,
            data: {
                ...node.data,
                packageId,
                onChange: onNodeDataChange,
                onMenuClick,
                validateNodeName
            }
        })));
    }, [packageId, onNodeDataChange, onMenuClick, setNodes, validateNodeName]);

    const onConnect = useCallback((params: Connection) => {
        const sourceNode = nodes.find(n => n.id === params.source);
        let label = '';

        // For DECISION nodes, use sourceHandle to determine label
        if (sourceNode && sourceNode.type === 'DECISION') {
            if (params.sourceHandle === 'true') {
                label = 'True';
            } else if (params.sourceHandle === 'false') {
                label = 'False';
            } else {
                // Fallback to old logic if sourceHandle is not set
                const existingEdges = edges.filter(e => e.source === params.source);
                label = existingEdges.length === 0 ? 'True' : 'False';
            }
        }

        setEdges((eds) => addEdge({
            ...params,
            type: 'smoothstep',
            label,
            markerEnd: { type: MarkerType.ArrowClosed }
        }, eds));
    }, [setEdges, nodes, edges]);

    const onSave = async () => {
        if (!packageId) return;
        try {
            const graphData = {
                nodes: nodes.map(n => ({
                    id: n.id,
                    type: n.type,
                    data: n.data,
                    position: { x: 0, y: 0 }
                })),
                edges: edges.map(e => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle, // Important for Decision node branches
                    label: e.label,
                    data: e.data
                }))
            };
            await savePackageGraph({
                packageId,
                graphData
            });
            message.success(intl.formatMessage({ id: 'pages.editor.saveSuccess' }));
        } catch (e) {
            message.error(intl.formatMessage({ id: 'pages.editor.saveFailed' }));
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && ['s', 'l', 'd', 'c', 'v'].includes(e.key)) {
                e.preventDefault();
            }

            if ((e.key === 'Delete' || e.key === 'Backspace') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                const selected = nodes.find(n => n.selected);
                if (selected && selected.type !== 'START') {
                    onMenuClick('delete', selected);
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                onSave();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                onLayout();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                const selected = nodes.find(n => n.selected);
                if (selected) {
                    onCopyNode(selected.id);
                    setTimeout(() => onPasteNode(), 50);
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                const selectedNode = nodes.find(n => n.selected);
                if (selectedNode) {
                    onCopyNode(selectedNode.id);
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                onPasteNode();
            }

            if (e.key === 'Escape') {
                setNodes((nds) => nds.map(n => ({ ...n, selected: false })));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes, onSave, onLayout, onCopyNode, onPasteNode, onMenuClick, setNodes]);

    const nodeColor = (node: Node) => {
        switch (node.type) {
            case 'DECISION': return '#1890ff';
            case 'CONDITION': return '#fa8c16';
            case 'ACTION': return '#52c41a';
            default: return '#d9d9d9';
        }
    };

    return (
        <div style={{ height: '80vh', width: '100%', border: '1px solid #f0f0f0', display: 'flex' }}>
            <NodePalette onDragStart={onDragStart} />
            <div style={{ flex: 1 }} onDrop={onDrop} onDragOver={onDragOver}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onPaneContextMenu={onPaneContextMenu}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    fitView
                    snapToGrid={true}
                    snapGrid={[15, 15]}
                >
                    <CanvasContextMenu
                        visible={menuVisible}
                        position={menuPosition}
                        onClose={() => setMenuVisible(false)}
                        onPaste={onPasteNode}
                        onAddNode={onAddNodeFromMenu}
                    />
                    <Controls />
                    <MiniMap
                        nodeColor={nodeColor}
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            border: '1px solid #ddd'
                        }}
                    />
                    <Background color="#aaa" gap={16} variant={BackgroundVariant.Dots} />
                    <Panel position="top-right">
                        <Space>
                            <Tooltip title="Zoom In">
                                <Button icon={<ZoomInOutlined />} onClick={onZoomIn} />
                            </Tooltip>
                            <Tooltip title="Zoom Out">
                                <Button icon={<ZoomOutOutlined />} onClick={onZoomOut} />
                            </Tooltip>
                            <Tooltip title="Fit View">
                                <Button icon={<CompressOutlined />} onClick={onFitView} />
                            </Tooltip>
                            <Tooltip title="Auto Layout">
                                <Button icon={<LayoutOutlined />} onClick={() => onLayout()} />
                            </Tooltip>
                            <Tooltip title="Copy Node (Ctrl+C)">
                                <Button icon={<CopyOutlined />} disabled={!nodes.some(n => n.selected)} onClick={() => {
                                    const selected = nodes.find(n => n.selected);
                                    if (selected) onCopyNode(selected.id);
                                }} />
                            </Tooltip>
                            <Tooltip title="Paste Node (Ctrl+V)">
                                <Button icon={<SnippetsOutlined />} disabled={!copiedNode} onClick={onPasteNode} />
                            </Tooltip>
                            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                                <Button
                                    icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                                    onClick={toggleFullscreen}
                                />
                            </Tooltip>
                            <Button type="primary" icon={<SaveOutlined />} onClick={onSave}>Save</Button>
                        </Space>
                    </Panel>
                </ReactFlow>
            </div>
        </div>
    );
};

const RuleEditor: React.FC = () => {
    const { packageCode } = useParams<{ packageCode: string }>();
    const intl = useIntl();
    const [packageId, setPackageId] = useState<number | null>(null);

    useEffect(() => {
        const fetchPackage = async () => {
            try {
                const res = await getPackages({ code: packageCode });
                if (res.data && res.data.length > 0) {
                    setPackageId(res.data[0].id);
                }
            } catch (e) {
                // Ignore
            }
        };
        if (packageCode) fetchPackage();
    }, [packageCode]);

    const editorTitle = intl.formatMessage({ id: 'menu.editor' }) + ': ' + packageCode;

    return (
        <PageContainer title={editorTitle}>
            <Tabs
                defaultActiveKey="visual"
                items={[
                    {
                        key: 'visual',
                        label: intl.formatMessage({ id: 'pages.editor.ruleTree' }),
                        children: (
                            <ReactFlowProvider>
                                <RuleEditorContent />
                            </ReactFlowProvider>
                        ),
                    },
                    {
                        key: 'parameters',
                        label: intl.formatMessage({ id: 'pages.editor.parameterConfig' }),
                        children: packageId ? <ParameterPanel packageId={packageId} /> : <div>Loading...</div>,
                    },
                    {
                        key: 'test',
                        label: intl.formatMessage({ id: 'pages.editor.testConsole' }),
                        children: packageId && packageCode ? <TestPanel packageId={packageId} packageCode={packageCode} /> : <div>Loading...</div>,
                    },
                ]}
            />
        </PageContainer>
    );
};

export default RuleEditor;
