import React, { useEffect, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { PageContainer } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import { useParams, useIntl } from '@umijs/max';
import { getPackages } from '@/services/RulePackageController';
import ParameterPanel from './components/ParameterPanel';
import TestPanel from './components/TestPanel';
import EditorContent from './components/EditorContent';

const RuleEditor: React.FC = () => {
    const { packageCode } = useParams<{ packageCode: string }>();
    const intl = useIntl();
    const [packageId, setPackageId] = useState<number | null>(null);

    useEffect(() => {
        const fetchPackage = async () => {
            try {
                const res = await getPackages({ code: packageCode });
                if (res.data && res.data.length > 0) {
                    setPackageId(res.data[0].id);
                }
            } catch (e) {
                // Ignore
            }
        };
        if (packageCode) fetchPackage();
    }, [packageCode]);

    const editorTitle = intl.formatMessage({ id: 'menu.editor' }) + ': ' + packageCode;

    return (
        <PageContainer title={editorTitle}>
            <Tabs
                defaultActiveKey="visual"
                items={[
                    {
                        key: 'visual',
                        label: intl.formatMessage({ id: 'pages.editor.ruleTree' }),
                        children: (
                            <ReactFlowProvider>
                                <EditorContent />
                            </ReactFlowProvider>
                        ),
                    },
                    {
                        key: 'parameters',
                        label: intl.formatMessage({ id: 'pages.editor.parameterConfig' }),
                        children: packageId ? <ParameterPanel packageId={packageId} /> : <div>Loading...</div>,
                    },
                    {
                        key: 'test',
                        label: intl.formatMessage({ id: 'pages.editor.testConsole' }),
                        children: packageId && packageCode ? <TestPanel packageId={packageId} packageCode={packageCode} /> : <div>Loading...</div>,
                    },
                ]}
            />
        </PageContainer>
    );
};

export default RuleEditor;
