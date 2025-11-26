import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import { Panel } from 'reactflow';
import {
    SaveOutlined,
    LayoutOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    CompressOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    CopyOutlined,
    SnippetsOutlined,
    UndoOutlined,
    RedoOutlined
} from '@ant-design/icons';

interface EditorToolbarProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitView: () => void;
    onLayout: () => void;
    onCopy: () => void;
    onPasteNode: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onSave: () => void;
    toggleFullscreen: () => void;
    isFullscreen: boolean;
    canUndo: boolean;
    canRedo: boolean;
    hasSelection: boolean;
    hasCopiedContent: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
    onZoomIn,
    onZoomOut,
    onFitView,
    onLayout,
    onCopy,
    onPasteNode,
    onUndo,
    onRedo,
    onSave,
    toggleFullscreen,
    isFullscreen,
    canUndo,
    canRedo,
    hasSelection,
    hasCopiedContent,
}) => {
    return (
        <Panel position="top-right">
            <Space>
                <Tooltip title="Zoom In">
                    <Button icon={<ZoomInOutlined />} onClick={onZoomIn} />
                </Tooltip>
                <Tooltip title="Zoom Out">
                    <Button icon={<ZoomOutOutlined />} onClick={onZoomOut} />
                </Tooltip>
                <Tooltip title="Fit View">
                    <Button icon={<CompressOutlined />} onClick={onFitView} />
                </Tooltip>
                <Tooltip title="Auto Layout">
                    <Button icon={<LayoutOutlined />} onClick={onLayout} />
                </Tooltip>
                <Tooltip title="Copy Node (Ctrl+C)">
                    <Button 
                        icon={<CopyOutlined />} 
                        disabled={!hasSelection} 
                        onClick={onCopy}
                    />
                </Tooltip>
                <Tooltip title="Paste Node (Ctrl+V)">
                    <Button icon={<SnippetsOutlined />} disabled={!hasCopiedContent} onClick={onPasteNode} />
                </Tooltip>
                <Tooltip title="Undo (Ctrl+Z)">
                    <Button icon={<UndoOutlined />} disabled={!canUndo} onClick={onUndo} />
                </Tooltip>
                <Tooltip title="Redo (Ctrl+Y)">
                    <Button icon={<RedoOutlined />} disabled={!canRedo} onClick={onRedo} />
                </Tooltip>
                <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                    <Button
                        icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                        onClick={toggleFullscreen}
                    />
                </Tooltip>
                <Button type="primary" icon={<SaveOutlined />} onClick={onSave}>Save</Button>
            </Space>
        </Panel>
    );
};

export default EditorToolbar;
