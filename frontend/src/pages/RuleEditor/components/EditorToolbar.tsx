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
    RedoOutlined,
    CloudUploadOutlined,
    HistoryOutlined
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
    onPublish: () => void;
    onVersions: () => void;
    toggleFullscreen: () => void;
    isFullscreen: boolean;
    canUndo: boolean;
    canRedo: boolean;
    hasSelection: boolean;
    hasCopiedContent: boolean;
}

const ToolbarButton = ({ disabled, icon, onClick, type = 'default', ...rest }: any) => {
    const disabledStyle = disabled ? {
        color: 'rgba(255, 255, 255, 0.25)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)'
    } : {};

    return (
        <Button
            icon={icon}
            disabled={disabled}
            onClick={onClick}
            type={type}
            style={{ ...disabledStyle }}
            {...rest}
        />
    );
};

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
    onPublish,
    onVersions,
    toggleFullscreen,
    isFullscreen,
    canUndo,
    canRedo,
    hasSelection,
    hasCopiedContent,
}) => {
    return (
        <Panel position="top-right" style={{ 
            background: 'var(--bg-card)', 
            padding: 8, 
            borderRadius: 8, 
            border: 'var(--glass-border)',
            display: 'flex',
            gap: 8
        }}>
            <Space>
                <Tooltip title="Zoom In">
                    <ToolbarButton icon={<ZoomInOutlined />} onClick={onZoomIn} />
                </Tooltip>
                <Tooltip title="Zoom Out">
                    <ToolbarButton icon={<ZoomOutOutlined />} onClick={onZoomOut} />
                </Tooltip>
                <Tooltip title="Fit View">
                    <ToolbarButton icon={<CompressOutlined />} onClick={onFitView} />
                </Tooltip>
                <Tooltip title="Auto Layout">
                    <ToolbarButton icon={<LayoutOutlined />} onClick={onLayout} />
                </Tooltip>
                <Tooltip title="Copy Node (Ctrl+C)">
                    <ToolbarButton 
                        icon={<CopyOutlined />} 
                        disabled={!hasSelection} 
                        onClick={onCopy}
                    />
                </Tooltip>
                <Tooltip title="Paste Node (Ctrl+V)">
                    <ToolbarButton icon={<SnippetsOutlined />} disabled={!hasCopiedContent} onClick={onPasteNode} />
                </Tooltip>
                <Tooltip title="Undo (Ctrl+Z)">
                    <ToolbarButton icon={<UndoOutlined />} disabled={!canUndo} onClick={onUndo} />
                </Tooltip>
                <Tooltip title="Redo (Ctrl+Y)">
                    <ToolbarButton icon={<RedoOutlined />} disabled={!canRedo} onClick={onRedo} />
                </Tooltip>
                <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                    <ToolbarButton
                        icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                        onClick={toggleFullscreen}
                    />
                </Tooltip>
                <Button type="primary" icon={<SaveOutlined />} onClick={onSave}>Save</Button>
                <Button icon={<CloudUploadOutlined />} onClick={onPublish}>Publish</Button>
                <Button icon={<HistoryOutlined />} onClick={onVersions}>Versions</Button>
            </Space>
        </Panel>
    );
};

export default EditorToolbar;
