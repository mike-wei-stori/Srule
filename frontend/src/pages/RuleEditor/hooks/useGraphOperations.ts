import { useState, useCallback, useRef } from 'react';
import { Node, Edge, ReactFlowInstance, MarkerType, addEdge } from 'reactflow';
import { message } from 'antd';
import { IntlShape } from 'react-intl';
import { getDescendants, Subgraph } from '../utils/graph';

interface UseGraphOperationsProps {
    reactFlowInstance: ReactFlowInstance | null;
    packageId: number | null;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    intl: IntlShape;
    takeSnapshot: (nodes?: Node[], edges?: Edge[]) => void;
    onLayout: (direction?: string) => void;
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

        const newEdges = copiedSubgraph.edges.map(edge => ({
            ...edge,
            id: `e${idMapping.get(edge.source)}-${idMapping.get(edge.target)}`,
            source: idMapping.get(edge.source)!,
            target: idMapping.get(edge.target)!,
            selected: false
        }));

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

        const siblingEdges = currentEdges.filter(e => e.source === parentEdge.source);
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
        const newEdges = [...currentEdges];
        const edgeA = siblingEdges[currentIndex];
        const edgeB = siblingEdges[targetIndex];

        const indexA = newEdges.findIndex(e => e.id === edgeA.id);
        const indexB = newEdges.findIndex(e => e.id === edgeB.id);

        if (indexA !== -1 && indexB !== -1) {
            [newEdges[indexA], newEdges[indexB]] = [newEdges[indexB], newEdges[indexA]];

            const parentNode = currentNodes.find(n => n.id === parentEdge.source);
            if (parentNode && parentNode.type === 'DECISION') {
                const tempLabel = newEdges[indexA].label;
                const tempHandle = newEdges[indexA].sourceHandle;

                newEdges[indexA] = { ...newEdges[indexA], label: newEdges[indexB].label, sourceHandle: newEdges[indexB].sourceHandle };
                newEdges[indexB] = { ...newEdges[indexB], label: tempLabel, sourceHandle: tempHandle };
            }

            setEdges(newEdges);
            setTimeout(() => onLayout(), 50);
            message.success(direction === 'up' ? intl.formatMessage({ id: 'pages.editor.moveUp' }) : intl.formatMessage({ id: 'pages.editor.moveDown' }));
        }
    }, [reactFlowInstance, takeSnapshot, intl, setEdges, onLayout]);

    // Menu Click
    const onMenuClick = useCallback((action: string, nodeId: string) => {
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
                // Circular dependency handling: pass onMenuClick dynamically or update later.
                // We'll update handlers via useEffect in the parent, so this is fine.
                // But for immediate consistency we might need it.
                // Let's rely on parent's useEffect to update handlers for new nodes too.
                // But wait, the parent's useEffect depends on `nodes`. 
                // So when we call setNodes here, parent rerenders, useEffect runs, updates handlers.
                // That should be fine.
                
                // (newNode.data as any).onMenuClick = (a: string, id: string) => onMenuClick(a, id);

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
        } catch (e) {
            console.error('Error in onMenuClick:', e);
            message.error('Operation failed');
        }
    }, [reactFlowInstance, takeSnapshot, intl, onCopyNode, onPasteNode, onMoveNode, generateNodeName, onNodeDataChange, packageId, validateNodeName, setNodes, setEdges, onLayout]);

    const onAddNodeFromMenu = useCallback((type: string) => {
        if (!reactFlowInstance || !packageId) return;

        takeSnapshot(reactFlowInstance.getNodes(), reactFlowInstance.getEdges());

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
