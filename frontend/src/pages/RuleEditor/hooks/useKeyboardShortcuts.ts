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
            const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);

            if ((e.ctrlKey || e.metaKey) && ['s', 'l', 'd', 'c', 'v', 'z', 'y'].includes(e.key)) {
                // Allow default copy/paste/undo/redo in inputs
                if (isInput && ['c', 'v', 'z', 'y'].includes(e.key)) {
                    return;
                }
                e.preventDefault();
            }

            if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
                e.preventDefault(); // Prevent React Flow's native deletion
                const selectedNodes = nodes.filter(n => n.selected);

                if (selectedNodes.length > 0) {
                    const startNode = selectedNodes.find(n => n.type === 'START');
                    if (startNode) {
                        // If Start node is selected, we should warn, but still delete others?
                        // Or just block if Start is the ONLY selection?
                        // Let's block Start node deletion specifically.
                        // If multiple selected including Start, delete others but keep Start.
                        // But we should warn user.
                        // message.warning(intl.formatMessage({ id: 'pages.editor.cannotDeleteStart', defaultMessage: 'Cannot delete Start node' }));
                        // We can rely on onDelete to show warning if we call it for Start node?
                        // onMenuClick shows warning. So if we call onDelete(startNode.id), it warns.
                        // But we want to prevent default.
                    }

                    selectedNodes.forEach(node => {
                        if (node.type !== 'START') {
                            onDelete(node.id);
                        } else {
                            // Optional: Show warning only if it's the only one or once
                            // onDelete(node.id); // This would trigger the warning in onMenuClick
                        }
                    });

                    // If Start node was among selection, show warning manually or let onDelete handle it?
                    // onMenuClick has: if (parentNode.type === 'START') message.warning(...)
                    // So we can just call onDelete for all selected nodes!
                    // But wait, if we call onDelete for multiple nodes, we get multiple warnings?
                    // Better to filter here.

                    if (startNode) {
                        // message.warning is imported in useGraphOperations, not here.
                        // We can't show message here easily unless we import 'antd'.
                        // But onDelete calls onMenuClick which shows warning.
                        // Let's just call onDelete for all.
                        // BUT, onMenuClick does setNodes(nds => filter...).
                        // Calling it multiple times is fine.
                        // However, preventing default means we MUST handle deletion.

                        // Actually, let's just filter and delete non-start nodes.
                        // If start node is selected, we ignore it (it won't be deleted).
                    }
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

            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isInput) {
                const selectedNode = nodes.find(n => n.selected);
                if (selectedNode) {
                    onCopyNode(selectedNode.id);
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !isInput) {
                onPasteNode();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !isInput) {
                if (e.shiftKey) {
                    onRedo();
                } else {
                    onUndo();
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'y' && !isInput) {
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

