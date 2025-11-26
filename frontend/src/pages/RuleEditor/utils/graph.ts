import { Node, Edge } from 'reactflow';

export interface Subgraph {
    nodes: Node[];
    edges: Edge[];
}

/**
 * Get all descendants of a node (including the node itself)
 */
export const getDescendants = (nodeId: string, nodes: Node[], edges: Edge[]): Subgraph => {
    const descendantNodeIds = new Set<string>();
    const descendantEdgeIds = new Set<string>();
    const queue = [nodeId];

    descendantNodeIds.add(nodeId);

    while (queue.length > 0) {
        const currentId = queue.shift()!;

        // Find outgoing edges from current node
        const outgoingEdges = edges.filter(e => e.source === currentId);

        outgoingEdges.forEach(edge => {
            descendantEdgeIds.add(edge.id);
            if (!descendantNodeIds.has(edge.target)) {
                descendantNodeIds.add(edge.target);
                queue.push(edge.target);
            }
        });
    }

    return {
        nodes: nodes.filter(n => descendantNodeIds.has(n.id)),
        edges: edges.filter(e => descendantEdgeIds.has(e.id))
    };
};
