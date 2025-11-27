import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    Node,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    MarkerType,
    useReactFlow,
    BackgroundVariant,
    ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { message } from 'antd';
import { useParams, useIntl } from '@umijs/max';
import { getPackages, loadPackageGraph, savePackageGraph } from '@/services/RulePackageController';
import StartNode from './nodes/StartNode';
import DecisionNode from './nodes/DecisionNode';
import ActionNode from './nodes/ActionNode';
import ScriptNode from './nodes/ScriptNode';
import LoopNode from './nodes/LoopNode';

import NodePalette from './NodePalette';
import CanvasContextMenu from './CanvasContextMenu';
import EditorToolbar from './EditorToolbar';
import PublishModal from './PublishModal';
import VersionListDrawer from './VersionListDrawer';

import { getLayoutedElements } from '../utils/layout';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { getDescendants, hasCycle } from '../utils/graph';
import { useGraphOperations } from '../hooks/useGraphOperations';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

import './EditorContent.less';

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

const EditorContent = () => {
    const { packageCode } = useParams<{ packageCode: string }>();
    const intl = useIntl();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [packageId, setPackageId] = useState<number | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [publishVisible, setPublishVisible] = useState(false);
    const [versionsVisible, setVersionsVisible] = useState(false);
    const [activeVersionId, setActiveVersionId] = useState<number | undefined>(undefined);
    const reactFlowInstance = useReactFlow();

    const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo();

    // Auto Layout
    const onLayout = useCallback((direction = 'LR', nodesOverride?: Node[], edgesOverride?: Edge[]) => {
        // takeSnapshot(nodes, edges); // Avoid depending on nodes state if possible, use getter?
        // But onLayout uses reactFlowInstance.getNodes(), so it's fine.
        // However, takeSnapshot inside needs current state.
        // Let's pass current state to takeSnapshot if needed.
        if (reactFlowInstance) {
            takeSnapshot(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());
        }

        const currentNodes = nodesOverride || reactFlowInstance.getNodes();
        const currentEdges = edgesOverride || reactFlowInstance.getEdges();
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            currentNodes,
            currentEdges,
            direction
        );
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
        window.requestAnimationFrame(() => reactFlowInstance.fitView());
    }, [reactFlowInstance, setNodes, setEdges, takeSnapshot]); // Removed nodes, edges from deps

    const {
        onCopyNode,
        onPasteNode,
        onMenuClick,
        onAddNodeFromMenu,
        generateNodeName,
        validateNodeName,
        onNodeDataChange,
        copiedSubgraph,
        setDraggedNodeType,
        draggedNodeType,
        onMoveNode
    } = useGraphOperations({
        reactFlowInstance,
        packageId,
        setNodes,
        setEdges,
        intl,
        takeSnapshot,
        onLayout
    });

    // Fetch package ID
    useEffect(() => {
        const fetchPackage = async () => {
            try {
                const res = await getPackages({ code: packageCode });
                if (res.data && res.data.length > 0) {
                    setPackageId(res.data[0].id);
                    setActiveVersionId(res.data[0].activeVersionId);
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
                    const styledEdges = (res.data.edges || []).map((edge: any) => ({
                        ...edge,
                        style: { strokeWidth: 2, stroke: '#b1b1b7' },
                        markerEnd: { type: MarkerType.ArrowClosed }
                    }));

                    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                        res.data.nodes,
                        styledEdges,
                        'LR'
                    );

                    // We need to inject handlers here initially to avoid flickering or missing handlers
                    // But we can't depend on them in dependency array.
                    // The trick is: use refs or just set them here, but don't include them in deps.
                    // However, react-hooks/exhaustive-deps will complain.
                    // Another way: define handlers in a ref?
                    // Or: trust that handlers from hook are stable enough (if they don't depend on changing state).
                    // Now that useGraphOperations handlers don't depend on 'nodes', they should be stable!

                    const nodesWithHandlers = layoutedNodes.map(node => ({
                        ...node,
                        data: {
                            ...node.data,
                            packageId,
                            onChange: onNodeDataChange,
                            onMenuClick,
                            validateNodeName
                        }
                    }));
                    setNodes(nodesWithHandlers);
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
    }, [packageId]); // Minimal dependencies for loading! 
    // We removed setNodes, setEdges, reactFlowInstance, handlers from deps to prevent loop.
    // Ideally setNodes/setEdges/reactFlowInstance are stable.
    // Handlers might change if intl changes, but intl usually stable.
    // If handlers change, the OTHER effect will update the nodes.

    // Update nodes with handlers when handlers change
    useEffect(() => {
        // This effect runs whenever handlers change (or packageId changes).
        // It updates existing nodes with new handlers.
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

    // Fullscreen handling
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = useCallback(() => {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                message.error(intl.formatMessage({ id: 'pages.editor.fullscreenRequestFailed' }));
            });
        } else {
            document.exitFullscreen();
        }
    }, [intl]);

    const onZoomIn = useCallback(() => {
        reactFlowInstance.zoomIn();
    }, [reactFlowInstance]);

    const onZoomOut = useCallback(() => {
        reactFlowInstance.zoomOut();
    }, [reactFlowInstance]);

    const onFitView = useCallback(() => {
        reactFlowInstance.fitView();
    }, [reactFlowInstance]);

    const onConnect = useCallback((params: Connection) => {
        // takeSnapshot(nodes, edges); // Avoid depending on nodes
        if (reactFlowInstance) {
            takeSnapshot(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());
        }

        // Logic for Decision nodes label
        let label = '';
        const sourceNode = reactFlowInstance.getNode(params.source!); // Use instance to get node

        if (sourceNode && sourceNode.type === 'DECISION') {
            if (params.sourceHandle === 'true') {
                label = 'True';
            } else if (params.sourceHandle === 'false') {
                label = 'False';
            } else {
                // Fallback: check existing edges count if handle not specific? 
                // Getting edges from instance
                const existingEdges = reactFlowInstance.getEdges().filter(e => e.source === params.source);
                label = existingEdges.length === 0 ? 'True' : 'False';
            }
        }

        // Check for cycles
        if (hasCycle(params, nodes, edges)) {
            message.warning(intl.formatMessage({ id: 'pages.editor.cycleDetected', defaultMessage: 'Cannot create a cycle' }));
            return;
        }

        // Determine edge style
        const val = (label || params.sourceHandle || '').trim().toLowerCase();
        let stroke = '#b1b1b7';
        if (val === 'true') stroke = '#52c41a';
        if (val === 'false') stroke = '#ff4d4f';

        setEdges((eds) => addEdge({
            ...params,
            type: 'default',
            label,
            style: { strokeWidth: 2, stroke },
            markerEnd: { type: MarkerType.ArrowClosed, color: stroke }
        }, eds));
    }, [setEdges, reactFlowInstance, takeSnapshot, nodes, edges, intl]);

    const getGraphData = () => {
        const currentNodes = nodes;
        const currentEdges = edges;

        // Sort edges by source, then by target node Y position
        const sortedEdges = [...currentEdges].sort((a, b) => {
            if (a.source !== b.source) {
                return a.source.localeCompare(b.source);
            }

            const nodeA = currentNodes.find(n => n.id === a.target);
            const nodeB = currentNodes.find(n => n.id === b.target);

            if (!nodeA || !nodeB) return 0;

            return nodeA.position.y - nodeB.position.y;
        });

        return {
            nodes: currentNodes.map(n => ({
                id: n.id,
                type: n.type,
                data: n.data,
                position: { x: 0, y: 0 }
            })),
            edges: sortedEdges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle,
                label: e.label,
                data: e.data
            }))
        };
    };

    const onSave = async () => {
        if (!packageId) return;
        try {
            const graphData = getGraphData();
            await savePackageGraph({
                packageId,
                graphData
            });
            message.success(intl.formatMessage({ id: 'pages.editor.saveSuccess' }));
        } catch (e) {
            message.error(intl.formatMessage({ id: 'pages.editor.saveFailed' }));
        }
    };

    const onPublish = () => {
        setPublishVisible(true);
    };

    const onVersions = () => {
        // Refresh active version when opening drawer
        getPackages({ code: packageCode }).then(res => {
            if (res.data && res.data.length > 0) {
                setActiveVersionId(res.data[0].activeVersionId);
            }
        });
        setVersionsVisible(true);
    };

    const onVersionChange = () => {
        // Refresh active version when version changed
        getPackages({ code: packageCode }).then(res => {
            if (res.data && res.data.length > 0) {
                setActiveVersionId(res.data[0].activeVersionId);
            }
        });
    };

    const onUndo = useCallback(() => {
        // pass nothing to undo(), it uses internal history stack? 
        // No, original useUndoRedo takes (nodes, edges) to push current state before undoing?
        // Or it returns the state to restore.
        // Let's check useUndoRedo implementation or usage. 
        // Original: const result = undo(nodes, edges);
        // If undo needs current state to maybe save it or compare? 
        // Let's assume it needs current state.

        // Actually, if we change nodes dependency here, we re-introduce dependency on state.
        // We can pass current state from instance?
        // But undo/redo might need to be pure or use refs.
        // Let's keep nodes/edges dependency for undo/redo for now, as they are user triggered actions, not auto-looping.
        const result = undo(nodes, edges);
        if (result) {
            setNodes(result.nodes);
            setEdges(result.edges);
        }
    }, [undo, nodes, edges, setNodes, setEdges]);

    const onRedo = useCallback(() => {
        const result = redo(nodes, edges);
        if (result) {
            setNodes(result.nodes);
            setEdges(result.edges);
        }
    }, [redo, nodes, edges, setNodes, setEdges]);

    const onNodesChangeWrapped = useCallback((changes: any) => {
        if (changes.some((c: any) => c.type === 'remove')) {
            if (reactFlowInstance) {
                takeSnapshot(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());
            }
        }
        onNodesChange(changes);
    }, [onNodesChange, takeSnapshot, reactFlowInstance]);

    const onEdgesChangeWrapped = useCallback((changes: any) => {
        if (changes.some((c: any) => c.type === 'remove')) {
            if (reactFlowInstance) {
                takeSnapshot(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());
            }
        }
        onEdgesChange(changes);
    }, [onEdgesChange, takeSnapshot, reactFlowInstance]);

    const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
        // takeSnapshot(nodes, edges);
        if (reactFlowInstance) {
            takeSnapshot(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());

            const subgraph = getDescendants(node.id, reactFlowInstance.getNodes(), reactFlowInstance.getEdges());
            const descendantIds = new Set(subgraph.nodes.map(n => n.id));
            const descendantEdgeIds = new Set(subgraph.edges.map(e => e.id));

            setNodes(nds => nds.map(n => ({
                ...n,
                selected: descendantIds.has(n.id) || n.selected
            })));

            setEdges(eds => eds.map(e => ({
                ...e,
                selected: descendantEdgeIds.has(e.id) || e.selected
            })));
        }
    }, [takeSnapshot, setNodes, setEdges, reactFlowInstance]);

    useKeyboardShortcuts({
        nodes,
        onSave,
        onLayout,
        onCopyNode,
        onPasteNode,
        onUndo,
        onRedo,
        onDelete: (id) => onMenuClick('delete', id),
        setNodes
    });

    // Drag and Drop
    const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
        setDraggedNodeType(nodeType);
        event.dataTransfer.effectAllowed = 'move';
    }, [setDraggedNodeType]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);


    const nodeColor = (node: Node) => {
        switch (node.type) {
            case 'DECISION': return '#1890ff';
            case 'CONDITION': return '#fa8c16';
            case 'ACTION': return '#52c41a';
            default: return '#d9d9d9';
        }
    };

    const onPaneContextMenu = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            setMenuVisible(true);
            setMenuPosition({ x: event.clientX, y: event.clientY });
        },
        [setMenuVisible, setMenuPosition]
    );

    const onPaneClick = useCallback(() => setMenuVisible(false), [setMenuVisible]);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!draggedNodeType || !reactFlowInstance || !packageId) {
                return;
            }

            takeSnapshot(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());

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
        [draggedNodeType, reactFlowInstance, packageId, setNodes, onNodeDataChange, onMenuClick, validateNodeName, generateNodeName, setDraggedNodeType, takeSnapshot]
    );


    return (
        <div style={{ height: '80vh', width: '100%', border: '1px solid #f0f0f0', display: 'flex' }}>
            <NodePalette onDragStart={onDragStart} />
            <div style={{ flex: 1 }} onDrop={onDrop} onDragOver={onDragOver}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChangeWrapped}
                    onEdgesChange={onEdgesChangeWrapped}
                    onConnect={onConnect}
                    onPaneContextMenu={onPaneContextMenu}
                    onNodeDragStart={onNodeDragStart}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    fitView
                    snapToGrid={true}
                    snapGrid={[15, 15]}
                    minZoom={0.1}
                    attributionPosition="bottom-right"
                    connectionLineType={ConnectionLineType.Bezier}
                    connectionLineStyle={{ strokeWidth: 2, stroke: '#b1b1b7' }}
                >
                    <CanvasContextMenu
                        visible={menuVisible}
                        position={menuPosition}
                        onClose={() => setMenuVisible(false)}
                        onPaste={onPasteNode}
                        onAddNode={(type, pos) => onAddNodeFromMenu(type, pos)}
                    />
                    <Controls />
                    <MiniMap
                        nodeColor={nodeColor}
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            border: 'var(--glass-border)'
                        }}
                        pannable
                        zoomable
                    />
                    <Background color="#888" gap={16} variant={BackgroundVariant.Dots} style={{ backgroundColor: 'var(--bg-color)' }} />
                    <EditorToolbar
                        onZoomIn={onZoomIn}
                        onZoomOut={onZoomOut}
                        onFitView={onFitView}
                        onLayout={() => onLayout()}
                        onCopy={() => {
                            const selected = nodes.find(n => n.selected);
                            if (selected) onCopyNode(selected.id);
                        }}
                        onPasteNode={() => onPasteNode()}
                        onUndo={onUndo}
                        onRedo={onRedo}
                        onSave={onSave}
                        onPublish={onPublish}
                        onVersions={onVersions}
                        toggleFullscreen={toggleFullscreen}
                        isFullscreen={isFullscreen}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        hasSelection={nodes.some(n => n.selected)}
                        hasCopiedContent={!!copiedSubgraph}
                    />
                </ReactFlow>
            </div>
            {packageId && (
                <>
                    <PublishModal
                        visible={publishVisible}
                        onCancel={() => setPublishVisible(false)}
                        onSuccess={() => setVersionsVisible(true)}
                        packageId={packageId}
                        contentJson={JSON.stringify(getGraphData())}
                    />
                    <VersionListDrawer
                        visible={versionsVisible}
                        onClose={() => setVersionsVisible(false)}
                        packageId={packageId}
                        activeVersionId={activeVersionId}
                        onVersionChange={onVersionChange}
                    />
                </>
            )}
        </div>
    );
};

export default EditorContent;
