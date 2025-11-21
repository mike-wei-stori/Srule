import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

const nodeWidth = 220;
const nodeHeight = 80;

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
        align: 'UL', // Align nodes to the top-left to respect edge order
        ranksep: isHorizontal ? 150 : 120, // Increased vertical/rank spacing
        nodesep: isHorizontal ? 60 : 100  // Increased horizontal/node spacing
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
    const nodeRankMap = new Map<string, number>();
    edges.forEach(edge => {
        const rank = getRank(edge);
        const currentRank = nodeRankMap.get(edge.target) || 999;
        if (rank < currentRank) {
            nodeRankMap.set(edge.target, rank);
        }
    });

    const sortedNodes = [...nodes].sort((a, b) => {
        const rankA = nodeRankMap.get(a.id) || 999;
        const rankB = nodeRankMap.get(b.id) || 999;
        return rankA - rankB;
    });

    sortedNodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    // Sort edges to ensure consistent layout (True above False)
    const sortedEdges = [...edges].sort((a, b) => {
        if (a.source !== b.source) {
            return a.source.localeCompare(b.source);
        }
        const rankDiff = getRank(a) - getRank(b);
        if (rankDiff !== 0) return rankDiff;
        return a.target.localeCompare(b.target);
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
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes: layoutedNodes, edges };
};
