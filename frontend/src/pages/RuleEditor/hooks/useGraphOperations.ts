import { useState, useCallback, useRef } from 'react';
import { Node, Edge, ReactFlowInstance, MarkerType, addEdge } from 'reactflow';
import { message } from 'antd';
import { getDescendants, Subgraph } from '../utils/graph';

interface UseGraphOperationsProps {
    reactFlowInstance: ReactFlowInstance | null;
    packageId: number | null;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    intl: any;
    takeSnapshot: (nodes: Node[], edges: Edge[]) => void;
    onLayout: (direction?: string, nodes?: Node[], edges?: Edge[]) => void;
}

export const useGraphOperations = ({
    reactFlowInstance,
    packageId,
    setNodes,
    setEdges,
    intl,
    takeSnapshot,
    onLayout,
}: UseGraphOperationsProps) => {
    const [copiedSubgraph, setCopiedSubgraph] = useState<Subgraph | null>(null);
    const lastDataChangeTime = useRef<number>(0);
    const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);

    // Validate Node Name
    const validateNodeName = useCallback((name: string, nodeId: string) => {
        if (!name || !name.trim()) {
            return intl.formatMessage({ id: 'pages.editor.nameEmpty' });
        }
        // Always use instance if available
        const currentNodes = reactFlowInstance?.getNodes() || [];
        const isDuplicate = currentNodes.some(n => n.id !== nodeId && n.data.label === name.trim());
        if (isDuplicate) {
            return intl.formatMessage({ id: 'pages.editor.nameUnique' });
        }
        return null;
    }, [reactFlowInstance, intl]);

    // Handle Node Data Change
    const onNodeDataChange = useCallback((id: string, newData: any) => {
        const now = Date.now();
        // Since we don't have nodes/edges in dependency, we need to pass them to takeSnapshot if it needs them.
        // Or takeSnapshot should also not depend on them? 
        // takeSnapshot in useUndoRedo usually takes current state.
        // We can get current state from reactFlowInstance.

        if (reactFlowInstance) {
            if (now - lastDataChangeTime.current > 1000) {
                takeSnapshot(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());
            }
        }
        lastDataChangeTime.current = now;

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: newData };
                }
                return node;
            })
        );
    }, [setNodes, takeSnapshot, reactFlowInstance]);

    // Generate Unique Node Name
    const generateNodeName = useCallback((type: string) => {
        let prefix = '';
        switch (type) {
            case 'DECISION': prefix = intl.formatMessage({ id: 'pages.editor.node.defaultName.decision' }); break;
            case 'ACTION': prefix = intl.formatMessage({ id: 'pages.editor.node.defaultName.action' }); break;
            case 'SCRIPT': prefix = intl.formatMessage({ id: 'pages.editor.node.defaultName.script' }); break;
            case 'LOOP': prefix = intl.formatMessage({ id: 'pages.editor.node.defaultName.loop' }); break;
            case 'CONDITION': prefix = intl.formatMessage({ id: 'pages.editor.node.defaultName.condition' }); break;
            default: prefix = type.charAt(0) + type.slice(1).toLowerCase();
        }

        let index = 1;
        let name = `${prefix} ${index}`;
        const currentNodes = reactFlowInstance?.getNodes() || [];

        while (currentNodes.some(n => n.data.label === name)) {
            index++;
            name = `${prefix} ${index}`;
        }
        return name;
    }, [reactFlowInstance, intl]);

    // Copy Node
    const onCopyNode = useCallback((nodeId: string) => {
        if (!reactFlowInstance) return;
        const currentNodes = reactFlowInstance.getNodes();
        const currentEdges = reactFlowInstance.getEdges();
        const subgraph = getDescendants(nodeId, currentNodes, currentEdges);

        if (subgraph.nodes.length > 0) {
            setCopiedSubgraph(subgraph);
            message.success(intl.formatMessage({ id: 'pages.editor.copyNode' }));
        }
    }, [reactFlowInstance, intl]);

    // Paste Node
    const onPasteNode = useCallback((position?: { x: number; y: number }) => {
        if (!copiedSubgraph || !packageId || !reactFlowInstance) return;

        takeSnapshot(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());

        // Calculate offset
        let offsetX = 50;
        let offsetY = 50;

        const rootNode = copiedSubgraph.nodes[0];

        if (position) {
            const flowPos = reactFlowInstance.screenToFlowPosition(position);
            offsetX = flowPos.x - rootNode.position.x;
            offsetY = flowPos.y - rootNode.position.y;
        }

        const idMapping = new Map<string, string>();

        const newNodes = copiedSubgraph.nodes.map(node => {
            const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            idMapping.set(node.id, newId);

            let newLabel = node.data.label;
            if (node.id === rootNode.id) {
                newLabel = `${node.data.label} Copy`;
            }

            return {
                ...node,
                id: newId,
                position: {
                    x: node.position.x + offsetX,
                    y: node.position.y + offsetY
                },
                data: {
                    ...node.data,
                    label: newLabel,
                    packageId,
                    onChange: onNodeDataChange,
                    validateNodeName,
                },
                selected: false
            };
        });

        const newEdges = copiedSubgraph.edges.map(edge => {
            const val = (edge.label as string || edge.sourceHandle || '').trim().toLowerCase();
            let stroke = '#b1b1b7';
            if (val === 'true') stroke = '#52c41a';
            if (val === 'false') stroke = '#ff4d4f';

            return {
                ...edge,
                id: `e${idMapping.get(edge.source)}-${idMapping.get(edge.target)}`,
                source: idMapping.get(edge.source)!,
                target: idMapping.get(edge.target)!,
                selected: false,
                style: { strokeWidth: 2, stroke },
                markerEnd: { type: MarkerType.ArrowClosed, color: stroke }
            };
        });

        setNodes((nds) => nds.concat(newNodes));
        setEdges((eds) => eds.concat(newEdges));
        message.success(intl.formatMessage({ id: 'pages.editor.pasteNode' }));
    }, [copiedSubgraph, packageId, reactFlowInstance, takeSnapshot, setNodes, setEdges, intl, onNodeDataChange, validateNodeName]);

    // Move Node
    const onMoveNode = useCallback((nodeId: string, direction: 'up' | 'down') => {
        if (!reactFlowInstance) return;
        takeSnapshot(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());
        const currentNodes = reactFlowInstance.getNodes();
        const currentEdges = reactFlowInstance.getEdges();
        const node = currentNodes.find(n => n.id === nodeId);
        if (!node) return;

        const parentEdge = currentEdges.find(e => e.target === nodeId);
        if (!parentEdge) {
            message.warning(intl.formatMessage({ id: 'pages.editor.cannotMoveRoot' }));
            return;
        }

        // Helper to get rank (consistent with layout.ts)
        const getRank = (edge: Edge) => {
            const val = (edge.label as string || edge.sourceHandle || '').trim().toLowerCase();
            if (val === 'true' || val === '') return 1;
            if (val === 'false') return 2;
            return 3;
        };

        const parentRank = getRank(parentEdge);

        // Filter and deduplicate sibling edges
        const seenTargets = new Set<string>();
        const siblingEdges = currentEdges.filter(e => {
            // Must be same source
            if (e.source !== parentEdge.source) return false;

            // Must be same rank (same branch type)
            if (getRank(e) !== parentRank) return false;

            // Must point to an existing node (filter out ghost edges)
            const targetNodeExists = currentNodes.some(n => n.id === e.target);
            if (!targetNodeExists) return false;

            // Deduplicate targets (only keep first edge to a specific target)
            if (seenTargets.has(e.target)) return false;
            seenTargets.add(e.target);

            return true;
        });

        const currentIndex = siblingEdges.findIndex(e => e.target === nodeId);

        console.log('onMoveNode Debug:', {
            nodeId,
            direction,
            parentEdge,
            parentRank,
            allEdgesCount: currentEdges.length,
            siblingEdges: siblingEdges.map(e => ({ id: e.id, source: e.source, target: e.target, rank: getRank(e) })),
            currentIndex
        });

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
        const newEdges = [...currentEdges];
        const edgeA = siblingEdges[currentIndex];
        const edgeB = siblingEdges[targetIndex];

        const indexA = newEdges.findIndex(e => e.id === edgeA.id);
        const indexB = newEdges.findIndex(e => e.id === edgeB.id);

        if (indexA !== -1 && indexB !== -1) {
            console.log('onMoveNode: Swapping edges', {
                edgeA: newEdges[indexA].id,
                edgeB: newEdges[indexB].id,
                indexA,
                indexB
            });

            [newEdges[indexA], newEdges[indexB]] = [newEdges[indexB], newEdges[indexA]];

            console.log('onMoveNode: New edges order (slice)', newEdges.slice(Math.min(indexA, indexB), Math.max(indexA, indexB) + 1));

            setEdges(newEdges);
            onLayout(undefined, undefined, newEdges);
            message.success(direction === 'up' ? intl.formatMessage({ id: 'pages.editor.moveUp' }) : intl.formatMessage({ id: 'pages.editor.moveDown' }));
        }
    }, [reactFlowInstance, takeSnapshot, setEdges, onLayout, intl]);

    // Menu Click
    const onMenuClick = useCallback((action: string, nodeId: string, sourceHandle?: string) => {
        if (!reactFlowInstance) return;
        const currentNodes = reactFlowInstance.getNodes();
        const parentNode = currentNodes.find(n => n.id === nodeId);

        if (!parentNode) return;

        if (action === 'copy') {
            onCopyNode(parentNode.id);
            return;
        } else if (action === 'paste') {
            onPasteNode();
            return;
        } else if (action === 'moveUp') {
            onMoveNode(parentNode.id, 'up');
            return;
        } else if (action === 'moveDown') {
            onMoveNode(parentNode.id, 'down');
            return;
        }

        takeSnapshot(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());
        const newId = `node_${Date.now()}`;
        let newNode: Node | null = null;

        try {
            if (action === 'addCondition') {
                if (parentNode.type === 'DECISION') {
                    const currentConditions = parentNode.data.conditions || [];
                    let newConditions = [...currentConditions];
                    if (currentConditions.length === 0 && parentNode.data.parameter) {
                        newConditions.push({
                            id: 'true',
                            parameter: parentNode.data.parameter,
                            operator: parentNode.data.operator || '==',
                            value: parentNode.data.value || ''
                        });
                    }

                    const newCondition = {
                        id: `c_${Date.now()}`,
                        parameter: '',
                        operator: '==',
                        value: ''
                    };
                    newConditions.push(newCondition);
                    onNodeDataChange(parentNode.id, { ...parentNode.data, conditions: newConditions });
                    message.success(intl.formatMessage({ id: 'pages.editor.node.addCondition' }));
                    return;
                }

                const label = generateNodeName('CONDITION');
                newNode = {
                    id: newId,
                    type: 'CONDITION',
                    data: { label, type: 'CONDITION', operator: '==', value: '', packageId, onChange: onNodeDataChange, validateNodeName },
                    position: { x: parentNode.position.x + 250, y: parentNode.position.y },
                };
            } else if (action === 'addDecision' || action === 'addSubDecision') {
                const label = generateNodeName('DECISION');
                newNode = {
                    id: newId,
                    type: 'DECISION',
                    data: { label, type: 'DECISION', parameter: '', packageId, onChange: onNodeDataChange, validateNodeName },
                    position: { x: parentNode.position.x + 250, y: parentNode.position.y },
                };
            } else if (action === 'addAction') {
                const label = generateNodeName('ACTION');
                newNode = {
                    id: newId,
                    type: 'ACTION',
                    data: { label, type: 'ACTION', targetParameter: '', assignmentValue: '', packageId, onChange: onNodeDataChange, validateNodeName },
                    position: { x: parentNode.position.x + 250, y: parentNode.position.y },
                };
            } else if (action === 'addScript') {
                const label = generateNodeName('SCRIPT');
                newNode = {
                    id: newId,
                    type: 'SCRIPT',
                    data: { label, type: 'SCRIPT', scriptType: 'GROOVY', scriptContent: '', packageId, onChange: onNodeDataChange, validateNodeName },
                    position: { x: parentNode.position.x + 250, y: parentNode.position.y },
                };
            } else if (action === 'addLoop') {
                const label = generateNodeName('LOOP');
                newNode = {
                    id: newId,
                    type: 'LOOP',
                    data: { label, type: 'LOOP', collectionVariable: '', packageId, onChange: onNodeDataChange, validateNodeName },
                    position: { x: parentNode.position.x + 250, y: parentNode.position.y },
                };
            } else if (action === 'delete') {
                setNodes((nds) => nds.filter((node) => node.id !== parentNode.id));
                setEdges((eds) => eds.filter((edge) => edge.source !== parentNode.id && edge.target !== parentNode.id));
            }

            if (newNode) {
                setNodes((nds) => nds.concat(newNode!));

                // Determine source handle and label
                let edgeSourceHandle = sourceHandle;
                let edgeLabel = undefined;

                if (parentNode.type === 'DECISION') {
                    if (sourceHandle === 'true') {
                        edgeLabel = 'True';
                    } else if (sourceHandle === 'false') {
                        edgeLabel = 'False';
                    } else {
                        // Default to True if not specified for Decision node
                        edgeSourceHandle = 'true';
                        edgeLabel = 'True';
                    }
                } else if (action === 'addCondition') {
                    edgeLabel = 'True';
                }

                // Helper to determine edge style based on label/handle
                const getEdgeStyle = (label?: string, handle?: string) => {
                    const val = (label || handle || '').trim().toLowerCase();
                    if (val === 'true') return { strokeWidth: 2, stroke: '#52c41a' }; // Green
                    if (val === 'false') return { strokeWidth: 2, stroke: '#ff4d4f' }; // Red
                    return { strokeWidth: 2, stroke: '#b1b1b7' }; // Default Grey
                };

                const edgeStyle = getEdgeStyle(edgeLabel, edgeSourceHandle);

                setEdges((eds) => eds.concat({
                    id: `e${parentNode.id}-${newId}`,
                    source: parentNode.id,
                    target: newId,
                    sourceHandle: edgeSourceHandle,
                    type: 'default',
                    label: edgeLabel,
                    style: edgeStyle,
                    markerEnd: { type: MarkerType.ArrowClosed, color: edgeStyle.stroke },
                }));

                // Construct new state for layout
                const updatedNodes = currentNodes.concat(newNode!);
                const updatedEdges = reactFlowInstance.getEdges().concat({
                    id: `e${parentNode.id}-${newId}`,
                    source: parentNode.id,
                    target: newId,
                    sourceHandle: edgeSourceHandle,
                    type: 'default',
                    label: edgeLabel,
                    style: edgeStyle,
                    markerEnd: { type: MarkerType.ArrowClosed, color: edgeStyle.stroke },
                });



                onLayout(undefined, updatedNodes, updatedEdges);
            }
        } catch (e) {
            console.error('Error in onMenuClick:', e);
            message.error('Operation failed');
        }
    }, [reactFlowInstance, takeSnapshot, intl, onCopyNode, onPasteNode, onMoveNode, generateNodeName, onNodeDataChange, packageId, validateNodeName, setNodes, setEdges, onLayout]);

    const onAddNodeFromMenu = useCallback((type: string, position?: { x: number; y: number }) => {
        if (!reactFlowInstance || !packageId) return;

        takeSnapshot(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());

        const currentNodes = reactFlowInstance.getNodes();
        const id = `node_${Date.now()}`;

        let nodePosition = { x: 100 + currentNodes.length * 20, y: 100 + currentNodes.length * 20 };
        if (position) {
            nodePosition = reactFlowInstance.screenToFlowPosition(position);
        }

        const label = generateNodeName(type);

        const newNode: Node = {
            id,
            type,
            position: nodePosition,
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
    }, [reactFlowInstance, packageId, takeSnapshot, generateNodeName, onNodeDataChange, onMenuClick, validateNodeName, setNodes, intl]);

    return {
        onCopyNode,
        onPasteNode,
        onMoveNode,
        onMenuClick,
        onAddNodeFromMenu,
        generateNodeName,
        validateNodeName,
        onNodeDataChange,
        copiedSubgraph,
        setCopiedSubgraph,
        draggedNodeType,
        setDraggedNodeType
    };
};
