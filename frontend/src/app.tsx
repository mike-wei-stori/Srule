import React from 'react';
import { history, SelectLang, useIntl, getIntl } from '@umijs/max';
import { message, Dropdown, Select } from 'antd';
import { LogoutOutlined, UserOutlined, GlobalOutlined } from '@ant-design/icons';

import { getProfile } from '@/services/UserController';

// 初始化状态
export async function getInitialState(): Promise<{
    name?: string;
    theme?: 'dark' | 'light';
    currentUser?: {
        id?: number;
        username?: string;
        nickname?: string;
        email?: string;
        avatar?: string;
        permissions?: string[];
    };
}> {
    const token = localStorage.getItem('token');
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    const theme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light';

    // Set initial theme attribute
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
    }

    let currentUser;
    if (token) {
        try {
            const response = await getProfile();
            if (response && response.data) {
                currentUser = response.data;
            }
        } catch (e) {
            console.error('Failed to fetch user info:', e);
        }
    }

    return {
        name: 'Rule Engine',
        theme,
        currentUser
    };
}

import '@/global.less';

// Layout 配置
export const layout = ({ initialState, setInitialState }: any) => {
    const intl = useIntl();
    const theme = initialState?.theme || 'light';
    const isDark = theme === 'dark';

    // Ensure data-theme attribute is updated when state changes
    React.useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        setInitialState((s: any) => ({ ...s, theme: newTheme }));
    };

    return {
        logo: 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
        title: 'Stori Rule Engine',
        menu: {
            locale: true,
        },
        layout: 'mix',
        navTheme: isDark ? 'realDark' : 'light',
        primaryColor: isDark ? '#00f3ff' : '#1890ff',
        fixedHeader: false,
        fixSiderbar: true,
        colorWeak: false,
        splitMenus: false,
        token: isDark ? {
            colorBgApp: '#050b14',
            colorBgLayout: '#050b14',
            colorTextAppListIconHover: 'rgba(0, 243, 255, 0.9)',
            colorTextAppListIcon: 'rgba(255, 255, 255, 0.85)',
            sider: {
                colorMenuBackground: '#0a192f',
                colorMenuItemDivider: 'rgba(255, 255, 255, 0.15)',
                colorBgMenuItemHover: 'rgba(0, 243, 255, 0.1)',
                colorTextMenu: '#8892b0',
                colorTextMenuSelected: '#00f3ff',
                colorTextMenuItemHover: '#00f3ff',
            },
            header: {
                colorBgHeader: 'rgba(5, 11, 20, 0.8)',
                colorHeaderTitle: '#e6f1ff',
                colorTextMenu: '#e6f1ff',
                colorTextMenuSecondary: '#8892b0',
                colorBgMenuItemHover: 'rgba(0, 243, 255, 0.1)',
            }
        } : {},

        actionsRender: (props: any) => {
            if (props.isMobile) return [];
            return [
                <SelectLang key="SelectLang" />,
                <div
                    key="theme"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: '0 12px',
                        fontSize: '18px'
                    }}
                    onClick={toggleTheme}
                >
                    {isDark ? '🌙' : '☀️'}
                </div>,
                <div key="tenant" style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                    <GlobalOutlined style={{ marginRight: 8, color: isDark ? '#e6f1ff' : 'inherit' }} />
                    <Select
                        defaultValue={localStorage.getItem('tenantId') || 'DEFAULT'}
                        style={{ width: 120 }}
                        onChange={(value) => {
                            localStorage.setItem('tenantId', value);
                            window.location.reload();
                        }}
                        options={[
                            { value: 'DEFAULT', label: 'Default' }
                        ]}
                    />
                </div>
            ];
        },

        // 右上角头像配置
        avatarProps: {
            src: initialState?.currentUser?.avatar || 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
            title: initialState?.currentUser?.nickname || initialState?.currentUser?.username || '未登录',
            size: 'small',
            render: (props: any, dom: React.ReactNode) => {
                if (!initialState?.currentUser) {
                    return dom;
                }

                return (
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'profile',
                                    icon: <UserOutlined />,
                                    label: intl.formatMessage({ id: 'menu.profile', defaultMessage: '个人中心' }),
                                    onClick: () => {
                                        history.push('/profile');
                                    },
                                },
                                {
                                    type: 'divider',
                                },
                                {
                                    key: 'logout',
                                    icon: <LogoutOutlined />,
                                    label: intl.formatMessage({ id: 'user.logout', defaultMessage: '退出登录' }),
                                    danger: true,
                                    onClick: () => {
                                        localStorage.removeItem('token');
                                        setInitialState((s: any) => ({ ...s, currentUser: undefined }));
                                        message.success(intl.formatMessage({ id: 'user.logout.success', defaultMessage: '已退出登录' }));
                                        history.push('/login');
                                    },
                                },
                            ],
                        }}
                    >
                        {dom}
                    </Dropdown>
                );
            },
        },

        // 页脚配置
        footerRender: () => {
            return (
                <div style={{ textAlign: 'center', padding: '16px 0', color: isDark ? '#8892b0' : '#666' }}>
                    <div>Stori Rule Engine © 2024</div>
                </div>
            );
        },

        // 菜单头配置
        menuHeaderRender: undefined,

        // Hide menu for editor pages
        menuRender: (props: any, defaultDom: React.ReactNode) => {
            if (location.pathname.startsWith('/editor/')) {
                return false;
            }
            return defaultDom;
        },

        // 未登录时的处理
        onPageChange: () => {
            const { location } = history;
            const token = localStorage.getItem('token');

            // 如果没有登录且不在登录页面，跳转到登录页
            if (!token && location.pathname !== '/login' && location.pathname !== '/oauth/callback') {
                history.push('/login');
            }
        },
    };
};

// 请求配置
export const request = {
    timeout: 10000,
    errorConfig: {
        errorHandler: (error: any) => {
            const { response } = error;
            const intl = getIntl();
            if (response && response.status) {
                const { status, data } = response;

                if (status === 401) {
                    message.error(intl.formatMessage({ id: 'user.login.expired', defaultMessage: '未登录或登录已过期，请重新登录' }));
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                } else if (status === 403) {
                    message.error(intl.formatMessage({ id: 'user.permission.denied', defaultMessage: '权限不足：您没有访问此资源的权限' }));
                } else {
                    const errorText = data?.message || intl.formatMessage({ id: 'common.error', defaultMessage: '请求错误' });
                    message.error(errorText);
                }
            } else if (!response) {
                message.error(intl.formatMessage({ id: 'common.error.network', defaultMessage: '网络异常，请检查您的网络连接' }));
            }
            throw error;
        },
    },
    requestInterceptors: [
        (url: string, options: any) => {
            const token = localStorage.getItem('token');
            if (token) {
                const headers = {
                    ...options.headers,
                    Authorization: `Bearer ${token}`,
                    'X-Tenant-Id': localStorage.getItem('tenantId') || 'DEFAULT',
                };
                return {
                    url,
                    options: { ...options, headers },
                };
            }
            return { url, options };
        },
    ],
    responseInterceptors: [
        (response: any) => {
            const { data } = response;
            // Handle unified backend response structure
            if (data && typeof data === 'object' && 'code' in data) {
                const intl = getIntl();
                if (data.code === 200) {
                    return response;
                } else if (data.code === 403) {
                    message.error(intl.formatMessage({ id: 'user.permission.denied', defaultMessage: '权限不足：您没有访问此资源的权限' }));
                    throw new Error(data.message);
                } else if (data.code === 401) {
                    message.error(intl.formatMessage({ id: 'user.login.expired', defaultMessage: '未登录或登录已过期' }));
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    throw new Error(data.message);
                } else {
                    message.error(data.message || intl.formatMessage({ id: 'common.operationFailed', defaultMessage: '操作失败' }));
                    throw new Error(data.message);
                }
            }
            return response;
        },
    ],
};
