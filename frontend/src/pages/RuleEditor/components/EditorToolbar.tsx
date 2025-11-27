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
    return (
        <Button
            icon={icon}
            disabled={disabled}
            onClick={onClick}
            type={type}
            className="editor-toolbar-button"
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
        <Panel position="top-right" className="editor-toolbar-panel">
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
