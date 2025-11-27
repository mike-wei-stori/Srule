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
import PermissionGate from '@/components/PermissionGate';

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
            <Space size={16}>
                <Space.Compact>
                    <Tooltip title="Zoom In">
                        <ToolbarButton icon={<ZoomInOutlined />} onClick={onZoomIn} />
                    </Tooltip>
                    <Tooltip title="Zoom Out">
                        <ToolbarButton icon={<ZoomOutOutlined />} onClick={onZoomOut} />
                    </Tooltip>
                    <Tooltip title="Fit View">
                        <ToolbarButton icon={<CompressOutlined />} onClick={onFitView} />
                    </Tooltip>
                    <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                        <ToolbarButton
                            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                            onClick={toggleFullscreen}
                        />
                    </Tooltip>
                </Space.Compact>

                <Space.Compact>
                    <Tooltip title="Auto Layout (Ctrl+L)">
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
                </Space.Compact>

                <Space.Compact>
                    <Tooltip title="Undo (Ctrl+Z)">
                        <ToolbarButton icon={<UndoOutlined />} disabled={!canUndo} onClick={onUndo} />
                    </Tooltip>
                    <Tooltip title="Redo (Ctrl+Y)">
                        <ToolbarButton icon={<RedoOutlined />} disabled={!canRedo} onClick={onRedo} />
                    </Tooltip>
                </Space.Compact>

                <Space.Compact>
                    <PermissionGate permission="DEFINITION_SAVE">
                        <Tooltip title="Save (Ctrl+S)">
                            <ToolbarButton type="primary" icon={<SaveOutlined />} onClick={onSave} />
                        </Tooltip>
                    </PermissionGate>
                    <PermissionGate permission="PACKAGE_PUBLISH">
                        <Tooltip title="Publish">
                            <ToolbarButton icon={<CloudUploadOutlined />} onClick={onPublish} />
                        </Tooltip>
                    </PermissionGate>
                    <PermissionGate permission="PACKAGE_READ">
                        <Tooltip title="Versions">
                            <ToolbarButton icon={<HistoryOutlined />} onClick={onVersions} />
                        </Tooltip>
                    </PermissionGate>
                </Space.Compact>
            </Space>
        </Panel>
    );
};

export default EditorToolbar;
