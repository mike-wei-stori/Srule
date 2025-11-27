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

/**
 * Check if adding an edge would create a cycle
 */
export const hasCycle = (connection: { source: string | null; target: string | null }, nodes: Node[], edges: Edge[]): boolean => {
    const { source, target } = connection;
    if (!source || !target || source === target) return true;

    // Check if target can reach source
    const queue = [target];
    const visited = new Set<string>();
    visited.add(target);

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (currentId === source) return true;

        const outgoingEdges = edges.filter(e => e.source === currentId);
        for (const edge of outgoingEdges) {
            if (!visited.has(edge.target)) {
                visited.add(edge.target);
                queue.push(edge.target);
            }
        }
    }

    return false;
};
