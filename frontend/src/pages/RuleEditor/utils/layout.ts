import dagre from 'dagre';
import { Node, Edge, Position, MarkerType } from 'reactflow';

const nodeWidth = 350; // Match BaseNode maxWidth

const getNodeWidth = (node: Node) => {
    if ((node as any).measured?.width) return (node as any).measured.width;
    if (node.width) return node.width;
    switch (node.type) {
        case 'ACTION': return 450; // Wider for Action nodes with builders
        case 'DECISION': return 350;
        case 'START': return 450; // Start node can be wide with actions
        default: return 300;
    }
};

const getNodeHeight = (node: Node) => {
    const baseHeight = 50; // Header + Padding

    // Use actual height if available (from React Flow)
    if ((node as any).measured?.height) return (node as any).measured.height;
    if (node.height) return node.height;

    switch (node.type) {
        case 'DECISION':
            const logicType = node.data.logicType || 'CONDITION';
            if (logicType === 'EXPRESSION') {
                return baseHeight + 30 + 80; // Type + TextArea
            }
            // CONDITION
            const conditions = node.data.conditions || [];
            // Type(30) + Logic(30) + Conditions(45 * n)
            // If no conditions, it might have empty state or 1 empty condition
            const count = Math.max(conditions.length, 1);
            return baseHeight + 30 + 30 + (count * 48) + 20;
        case 'ACTION':
            // Header(50) + (Actions * 40) + AddButton(40) + Padding(20)
            const actionCount = Math.max((node.data.actions || []).length, 1);
            // Estimate height: Header + Actions + Button + Padding
            // Each action row is approx 32px + 4px gap = 36px. 
            // Add Button is 24px + gap.
            // Let's be generous.
            return baseHeight + (actionCount * 45) + 40 + 20;
        case 'START':
            // Header(60) + (Actions * 40) + AddButton(40) + Padding(20)
            const startActionCount = (node.data.actions || []).length;
            if (startActionCount > 0) {
                return 60 + (startActionCount * 45) + 40 + 20;
            }
            return 60;
        case 'SCRIPT':
            return 120;
        case 'LOOP':
            return 100;
        default:
            return 80;
    }
};

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    // Filter out edges connected to non-existent nodes (ghost edges)
    const validNodeIds = new Set(nodes.map(n => n.id));
    const validEdges = edges.filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target));

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
        align: 'UL', // Align nodes to the top-left to respect edge order
        ranksep: isHorizontal ? 250 : 150, // Compact Horizontal spacing
        nodesep: isHorizontal ? 80 : 100   // Compact Vertical spacing
    });

    // Helper to get rank of edge type
    const getRank = (edge: Edge) => {
        const val = (edge.label as string || edge.sourceHandle || '').trim().toLowerCase();
        if (val === 'true' || val === '') return 1;
        if (val === 'false') return 2;
        return 3;
    };

    // Sort nodes by incoming edge rank to influence Dagre's initial layout
    // We prioritize the edge index to respect the order of edges (for Move Up/Down)
    const nodeRankMap = new Map<string, number>();

    console.log('Layout Debug: validEdges order:', validEdges.map(e => ({ id: e.id, source: e.source, target: e.target, rank: getRank(e) })));

    validEdges.forEach((edge, index) => {
        // Use index as the primary score to respect array order
        const score = index;

        const currentScore = nodeRankMap.get(edge.target) || Number.MAX_SAFE_INTEGER;
        if (score < currentScore) {
            nodeRankMap.set(edge.target, score);
        }
    });

    const sortedNodes = [...nodes].sort((a, b) => {
        const rankA = nodeRankMap.get(a.id) || Number.MAX_SAFE_INTEGER;
        const rankB = nodeRankMap.get(b.id) || Number.MAX_SAFE_INTEGER;
        return rankA - rankB;
    });

    sortedNodes.forEach((node) => {
        const width = getNodeWidth(node);
        const height = getNodeHeight(node);
        dagreGraph.setNode(node.id, { width: width, height: height });
    });

    // Sort edges to ensure consistent layout
    // We respect the order of edges in the input array
    const edgesWithIndex = validEdges.map((e, i) => ({ ...e, originalIndex: i }));

    const sortedEdges = [...edgesWithIndex].sort((a, b) => {
        if (a.source !== b.source) {
            return a.source.localeCompare(b.source);
        }

        // Prioritize Rank (True < False) to enforce strict branch order
        const rankDiff = getRank(a) - getRank(b);
        if (rankDiff !== 0) return rankDiff;

        // Respect original index for same-rank edges (within the same branch)
        return a.originalIndex - b.originalIndex;
    });

    sortedEdges.forEach((edge) => {
        const rank = getRank(edge);
        // Higher weight for True/Unlabeled (Rank 1) to keep them straight/grouped
        const weight = rank === 1 ? 10 : 1;
        dagreGraph.setEdge(edge.source, edge.target, { weight });
    });

    dagre.layout(dagreGraph);

    // Helper to get all descendants of a node
    const getSubtreeNodes = (rootId: string): string[] => {
        const descendants: string[] = [rootId];
        const queue = [rootId];
        const visited = new Set<string>([rootId]);

        while (queue.length > 0) {
            const current = queue.shift()!;
            const children = validEdges
                .filter(e => e.source === current)
                .map(e => e.target)
                .filter(id => !visited.has(id));

            children.forEach(child => {
                visited.add(child);
                descendants.push(child);
                queue.push(child);
            });
        }
        return descendants;
    };

    // Helper to move a subtree vertically
    const moveSubtree = (rootId: string, deltaY: number) => {
        const descendants = getSubtreeNodes(rootId);
        descendants.forEach(id => {
            const node = dagreGraph.node(id);
            if (node) {
                node.y += deltaY;
            }
        });
    };

    // Helper to get bounds of a subtree
    const getSubtreeBounds = (rootId: string) => {
        const descendants = getSubtreeNodes(rootId);
        let minY = Infinity;
        let maxY = -Infinity;
        descendants.forEach(id => {
            const node = dagreGraph.node(id);
            if (node) {
                minY = Math.min(minY, node.y - node.height / 2);
                maxY = Math.max(maxY, node.y + node.height / 2);
            }
        });
        return { minY, maxY, height: maxY - minY };
    };

    // Post-processing: Enforce vertical order based on edge index
    const siblingsMap = new Map<string, Edge[]>();
    sortedEdges.forEach(edge => {
        const key = edge.source;
        if (!siblingsMap.has(key)) {
            siblingsMap.set(key, []);
        }
        siblingsMap.get(key)?.push(edge);
    });

    siblingsMap.forEach((siblingEdges) => {
        if (siblingEdges.length <= 1) return;

        // Calculate bounds for each sibling's subtree
        const siblingBounds = siblingEdges.map(e => ({
            id: e.target,
            bounds: getSubtreeBounds(e.target)
        }));

        // Find the starting Y position (top-most of the group)
        const startY = Math.min(...siblingBounds.map(b => b.bounds.minY));
        let currentY = startY;

        // Stack siblings vertically
        siblingEdges.forEach(edge => {
            const targetId = edge.target;
            const bounds = getSubtreeBounds(targetId);

            // Calculate how much to shift this subtree to place it at currentY
            const shift = currentY - bounds.minY;

            moveSubtree(targetId, shift);

            // Advance currentY by the height of this subtree + spacing
            currentY += bounds.height + (isHorizontal ? 80 : 100); // Use nodesep (matched with layout config)
        });
    });



    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? Position.Left : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        const width = getNodeWidth(node);
        node.position = {
            x: nodeWithPosition.x - width / 2,
            y: nodeWithPosition.y - (getNodeHeight(node) / 2),
        };

        return node;
    });

    // Apply colors to edges based on rank/label
    const coloredEdges = edges.map(edge => {
        const val = (edge.label as string || edge.sourceHandle || '').trim().toLowerCase();
        let stroke = '#b1b1b7';
        if (val === 'true') stroke = '#52c41a';
        if (val === 'false') stroke = '#ff4d4f';

        return {
            ...edge,
            style: { ...edge.style, strokeWidth: 2, stroke },
            markerEnd: { type: MarkerType.ArrowClosed, color: stroke }
        };
    });

    return { nodes: layoutedNodes, edges: coloredEdges };
};
