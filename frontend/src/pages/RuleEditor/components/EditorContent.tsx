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
    useReactFlow,
    BackgroundVariant,
    ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { message, Modal } from 'antd';
import { useParams, useIntl } from '@umijs/max';
import { getPackages, loadPackageGraph, savePackageGraph, updatePackage } from '@/services/RulePackageController';
import StartNode from './nodes/StartNode';
import DecisionNode from './nodes/DecisionNode';
import ActionNode from './nodes/ActionNode';
import ScriptNode from './nodes/ScriptNode';
import LoopNode from './nodes/LoopNode';
import SwitchNode from './nodes/SwitchNode';
import DecisionTableNode from './nodes/DecisionTableNode';
import RulePackageNode from './nodes/RulePackageNode';

import NodePalette from './NodePalette';
import CanvasContextMenu from './CanvasContextMenu';
import EditorToolbar from './EditorToolbar';
import PublishModal from './PublishModal';
import VersionListDrawer from './VersionListDrawer';
import RulePackageEditModal from './RulePackageEditModal';

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
    SWITCH: SwitchNode,
    DECISION_TABLE: DecisionTableNode,
    RULE_PACKAGE: RulePackageNode,
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
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [packageData, setPackageData] = useState<any>(null);
    const [activeVersionId, setActiveVersionId] = useState<number | undefined>(undefined);
    const [saveStatus, setSaveStatus] = useState<string>('');
    const reactFlowInstance = useReactFlow();
    const isDirty = useRef(false);
    const draftCheckResolved = useRef(false);

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
        window.requestAnimationFrame(() => reactFlowInstance.fitView({ padding: 0.2, maxZoom: 1 }));
    }, [reactFlowInstance, setNodes, setEdges, takeSnapshot]); // Removed nodes, edges from deps

    const setNodesDirty = useCallback((value: React.SetStateAction<Node[]>) => {
        isDirty.current = true;
        setNodes(value);
    }, [setNodes]);

    const setEdgesDirty = useCallback((value: React.SetStateAction<Edge[]>) => {
        isDirty.current = true;
        setEdges(value);
    }, [setEdges]);

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
        setNodes: setNodesDirty,
        setEdges: setEdgesDirty,
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
                    setPackageData(res.data[0]);
                }
            } catch (e) {
                message.error(intl.formatMessage({ id: 'pages.editor.loadFailed' }));
            }
        };
        if (packageCode) fetchPackage();
    }, [packageCode]);

    // Reset draft check lock when packageId changes
    useEffect(() => {
        draftCheckResolved.current = false;
    }, [packageId]);

    // Auto-save to local storage
    useEffect(() => {
        if (!packageId || nodes.length === 0 || !isDirty.current || !draftCheckResolved.current) {
            console.log('Auto-save skipped:', {
                packageId,
                nodesLength: nodes.length,
                isDirty: isDirty.current,
                draftCheckResolved: draftCheckResolved.current
            });
            return;
        }

        const saveToLocal = setTimeout(() => {
            const graphData = getGraphData();
            const storageKey = `srule_draft_${packageId}`;
            const draftData = {
                graphData,
                timestamp: Date.now()
            };
            console.log('Auto-saving to local storage:', storageKey, draftData);
            localStorage.setItem(storageKey, JSON.stringify(draftData));
            setSaveStatus(intl.formatMessage({ id: 'pages.editor.savedLocally', defaultMessage: 'Saved locally' }));
            setTimeout(() => setSaveStatus(''), 2000);
        }, 1000); // Debounce 1s

        return () => clearTimeout(saveToLocal);
    }, [nodes, edges, packageId]);

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

                    // Trigger auto-layout to ensure correct positioning and fit view
                    setTimeout(() => {
                        reactFlowInstance.fitView({ padding: 0.2, maxZoom: 1 });
                    }, 500);

                    message.success(intl.formatMessage({ id: 'pages.editor.loadSuccess' }));
                    // Reset dirty flag after loading
                    isDirty.current = false;
                }
            } catch (e) {
                console.error('Failed to load graph:', e);
            }
        };

        loadGraph();
    }, [packageId]); // Minimal dependencies for loading! 

    // Check for local draft after loading
    useEffect(() => {
        if (!packageId || !packageData) return;

        const checkDraft = () => {
            const storageKey = `srule_draft_${packageId}`;
            const savedDraft = localStorage.getItem(storageKey);
            console.log('Checking draft:', storageKey, savedDraft ? 'Found' : 'Not Found');
            console.log('Current packageData:', packageData);

            if (savedDraft) {
                try {
                    const draft = JSON.parse(savedDraft);
                    const draftTime = draft.timestamp;

                    let serverTimeStr = 'Unknown';
                    try {
                        // API returns updatedAt, but typings might say updateTime. Handle both.
                        const timeStr = packageData.updatedAt || packageData.updateTime;
                        const date = new Date(timeStr);
                        if (!isNaN(date.getTime())) {
                            serverTimeStr = date.toLocaleString();
                        } else {
                            serverTimeStr = String(timeStr || 'Unknown');
                        }
                    } catch (e) {
                        serverTimeStr = String(packageData.updatedAt || packageData.updateTime || 'Unknown');
                    }

                    // Always prompt if draft exists, letting user decide.
                    // This avoids timezone/clock skew issues.
                    Modal.confirm({
                        title: intl.formatMessage({ id: 'pages.editor.draftFound', defaultMessage: 'Local draft found' }),
                        content: (
                            <div>
                                <p>{intl.formatMessage({ id: 'pages.editor.draftFoundDesc', defaultMessage: 'A local draft was found. Do you want to restore it?' })}</p>
                                <p style={{ fontSize: 12, color: '#888' }}>
                                    {intl.formatMessage({ id: 'pages.editor.draftTime', defaultMessage: 'Draft Time' })}: {new Date(draftTime).toLocaleString()}
                                    <br />
                                    {intl.formatMessage({ id: 'pages.editor.serverTime', defaultMessage: 'Server Time' })}: {serverTimeStr}
                                </p>
                            </div>
                        ),
                        okText: intl.formatMessage({ id: 'pages.editor.restore', defaultMessage: 'Restore' }),
                        cancelText: intl.formatMessage({ id: 'pages.editor.discard', defaultMessage: 'Discard' }),
                        onOk: () => {
                            const { nodes: draftNodes, edges: draftEdges } = draft.graphData;
                            const nodesWithHandlers = draftNodes.map((node: any) => ({
                                ...node,
                                data: {
                                    ...node.data,
                                    packageId,
                                    onChange: onNodeDataChange,
                                    onMenuClick,
                                    validateNodeName
                                }
                            }));
                            const styledEdges = (draftEdges || []).map((edge: any) => ({
                                ...edge,
                                style: { strokeWidth: 2, stroke: '#b1b1b7' },
                                markerEnd: { type: MarkerType.ArrowClosed, color: '#b1b1b7' }
                            }));
                            setNodes(nodesWithHandlers);
                            setEdges(styledEdges);
                            isDirty.current = true;
                            draftCheckResolved.current = true;
                            message.success(intl.formatMessage({ id: 'pages.editor.restoreSuccess', defaultMessage: 'Restored from local draft' }));
                        },
                        onCancel: () => {
                            localStorage.removeItem(storageKey);
                            draftCheckResolved.current = true;
                            message.info(intl.formatMessage({ id: 'pages.editor.draftDiscarded', defaultMessage: 'Local draft discarded' }));
                        }
                    });
                } catch (e) {
                    console.error('Failed to parse draft', e);
                    draftCheckResolved.current = true;
                }
            } else {
                draftCheckResolved.current = true;
            }
        };

        // Delay slightly to ensure graph is loaded first? 
        // Actually this runs when packageData is available.
        // We should probably run this ONLY ONCE per package load.
        // But packageData might update on save.
        // Let's rely on packageId change effectively.
        checkDraft();

    }, [packageId, packageData]); // Run when package data loaded 
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
                const existingEdges = reactFlowInstance.getEdges().filter(e => e.source === params.source);
                label = existingEdges.length === 0 ? 'True' : 'False';
            }
        } else if (sourceNode && sourceNode.type === 'SWITCH') {
            if (params.sourceHandle === 'default') {
                label = 'Default';
            } else {
                const kase = sourceNode.data.cases?.find((c: any) => c.id === params.sourceHandle);
                if (kase) {
                    label = kase.value || 'Case';
                }
            }
        } else if (sourceNode && sourceNode.type === 'DECISION_TABLE') {
            const branch = sourceNode.data.branches?.find((b: any) => b.id === params.sourceHandle);
            if (branch) {
                if (branch.type === 'EXPRESSION') {
                    label = branch.expression || 'Expr';
                } else {
                    label = `${branch.operator || '=='} ${branch.value || ''}`;
                }
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
        if (sourceNode?.type === 'SWITCH') stroke = '#13c2c2';
        if (sourceNode?.type === 'DECISION_TABLE') stroke = '#722ed1';

        setEdges((eds) => addEdge({
            ...params,
            type: 'default',
            label,
            style: { strokeWidth: 2, stroke },
            markerEnd: { type: MarkerType.ArrowClosed, color: stroke }
        }, eds));
        isDirty.current = true;
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
                position: n.position
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
            // Clear local draft on save
            localStorage.removeItem(`srule_draft_${packageId}`);
            isDirty.current = false;
            // Update package data to reflect new update time (optimistic or fetch)
            const res = await getPackages({ code: packageCode });
            if (res.data && res.data.length > 0) {
                setPackageData(res.data[0]);
            }
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

    const onEdit = () => {
        setEditModalVisible(true);
    };

    const onEditOk = async (values: any) => {
        if (!packageId) return;
        try {
            await updatePackage(packageId, values);
            message.success('Package updated successfully');
            setEditModalVisible(false);
            // Refresh data
            const res = await getPackages({ code: packageCode });
            if (res.data && res.data.length > 0) {
                setPackageData(res.data[0]);
            }
        } catch (e) {
            message.error('Failed to update package');
        }
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
        isDirty.current = true;
        onNodesChange(changes);
    }, [onNodesChange, takeSnapshot, reactFlowInstance]);

    const onEdgesChangeWrapped = useCallback((changes: any) => {
        if (changes.some((c: any) => c.type === 'remove')) {
            if (reactFlowInstance) {
                takeSnapshot(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());
            }
        }
        isDirty.current = true;
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
        setNodes: setNodesDirty
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
            case 'SWITCH': return '#13c2c2';
            case 'DECISION_TABLE': return '#722ed1';
            case 'RULE_PACKAGE': return '#eb2f96';
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
                    deleteKeyCode={null}
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
                        onEdit={onEdit}
                        toggleFullscreen={toggleFullscreen}
                        isFullscreen={isFullscreen}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        hasSelection={nodes.some(n => n.selected)}
                        hasCopiedContent={!!copiedSubgraph}
                    />
                    {saveStatus && (
                        <div style={{
                            position: 'fixed',
                            top: 80,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '6px 12px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            color: '#52c41a',
                            borderRadius: 16,
                            fontSize: 12,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 2000,
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(82, 196, 26, 0.2)'
                        }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#52c41a' }} />
                            {saveStatus}
                        </div>
                    )}
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
                    <RulePackageEditModal
                        visible={editModalVisible}
                        onCancel={() => setEditModalVisible(false)}
                        onOk={onEditOk}
                        initialValues={packageData}
                    />
                </>
            )}
        </div>
    );
};

export default EditorContent;
