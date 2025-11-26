import { useEffect } from 'react';
import { Node } from 'reactflow';

interface UseKeyboardShortcutsProps {
    nodes: Node[];
    onSave: () => void;
    onLayout: () => void;
    onCopyNode: (id: string) => void;
    onPasteNode: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onDelete: (id: string) => void;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export const useKeyboardShortcuts = ({
    nodes,
    onSave,
    onLayout,
    onCopyNode,
    onPasteNode,
    onUndo,
    onRedo,
    onDelete,
    setNodes
}: UseKeyboardShortcutsProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && ['s', 'l', 'd', 'c', 'v', 'z', 'y'].includes(e.key)) {
                e.preventDefault();
            }

            if ((e.key === 'Delete' || e.key === 'Backspace') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                const selected = nodes.find(n => n.selected);
                if (selected && selected.type !== 'START') {
                    onDelete(selected.id);
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                onSave();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                onLayout();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                const selected = nodes.find(n => n.selected);
                if (selected) {
                    onCopyNode(selected.id);
                    setTimeout(() => onPasteNode(), 50);
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                const selectedNode = nodes.find(n => n.selected);
                if (selectedNode) {
                    onCopyNode(selectedNode.id);
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                onPasteNode();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) {
                    onRedo();
                } else {
                    onUndo();
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                onRedo();
            }

            if (e.key === 'Escape') {
                setNodes((nds) => nds.map(n => ({ ...n, selected: false })));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes, onSave, onLayout, onCopyNode, onPasteNode, onUndo, onRedo, onDelete, setNodes]);
};

