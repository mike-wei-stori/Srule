import { useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';

interface HistoryItem {
    nodes: Node[];
    edges: Edge[];
}

export const useUndoRedo = () => {
    const [past, setPast] = useState<HistoryItem[]>([]);
    const [future, setFuture] = useState<HistoryItem[]>([]);

    const takeSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
        setPast((old) => {
            // Limit history size to 50
            const newPast = [...old, { nodes, edges }];
            if (newPast.length > 50) {
                return newPast.slice(newPast.length - 50);
            }
            return newPast;
        });
        setFuture([]);
    }, []);

    const undo = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
        if (past.length === 0) return null;

        const newPast = [...past];
        const previousState = newPast.pop();

        if (previousState) {
            setPast(newPast);
            setFuture((old) => [{ nodes: currentNodes, edges: currentEdges }, ...old]);
            return previousState;
        }
        return null;
    }, [past]);

    const redo = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
        if (future.length === 0) return null;

        const newFuture = [...future];
        const nextState = newFuture.shift();

        if (nextState) {
            setFuture(newFuture);
            setPast((old) => [...old, { nodes: currentNodes, edges: currentEdges }]);
            return nextState;
        }
        return null;
    }, [future]);

    return {
        takeSnapshot,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        past,
        future
    };
};
