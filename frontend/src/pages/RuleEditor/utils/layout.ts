import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

const nodeWidth = 350; // Match BaseNode maxWidth

const getNodeHeight = (node: Node) => {
    const baseHeight = 50; // Header + Padding
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
            return baseHeight + 90; // Content + Tag
        case 'START':
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
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
        align: 'UL', // Align nodes to the top-left to respect edge order
        ranksep: isHorizontal ? 120 : 100, // Horizontal spacing between columns
        nodesep: isHorizontal ? 60 : 100   // Vertical spacing between nodes
    });

    // Helper to get rank of edge type
    const getRank = (edge: Edge) => {
        const val = (edge.label as string || edge.sourceHandle || '').toLowerCase();
        if (val === 'true' || val === '') return 1;
        if (val === 'false') return 2;
        return 3;
    };

    // Sort nodes by incoming edge rank to influence Dagre's initial layout
    // Nodes with incoming "True" edges should be processed first
    // We also include the edge index in the rank to respect the order of edges (for Move Up/Down)
    const nodeRankMap = new Map<string, number>();
    edges.forEach((edge, index) => {
        const rank = getRank(edge);
        // Composite score: Rank (primary) + Index (secondary)
        // Lower rank is better (True=1, False=2). Lower index is better (earlier in array).
        const score = rank * 100000 + index;

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
        const height = getNodeHeight(node);
        dagreGraph.setNode(node.id, { width: nodeWidth, height: height });
    });

    // Sort edges to ensure consistent layout (True above False)
    // We also want to respect the order of edges in the input array for same-rank edges
    // This allows "Move Up/Down" to work by changing the input array order
    const edgesWithIndex = edges.map((e, i) => ({ ...e, originalIndex: i }));

    const sortedEdges = [...edgesWithIndex].sort((a, b) => {
        if (a.source !== b.source) {
            return a.source.localeCompare(b.source);
        }
        const rankDiff = getRank(a) - getRank(b);
        if (rankDiff !== 0) return rankDiff;

        // If ranks are same (e.g. both False or both Action), use original index
        return a.originalIndex - b.originalIndex;
    });

    sortedEdges.forEach((edge) => {
        const rank = getRank(edge);
        // Higher weight for True/Unlabeled (Rank 1) to keep them straight/grouped
        const weight = rank === 1 ? 10 : 1;
        dagreGraph.setEdge(edge.source, edge.target, { weight });
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? Position.Left : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - (getNodeHeight(node) / 2),
        };

        return node;
    });

    return { nodes: layoutedNodes, edges };
};
