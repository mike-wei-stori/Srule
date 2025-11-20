import React, { useEffect } from 'react';
import { useSearchParams, history } from '@umijs/max';
import { Spin } from 'antd';

const OAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            // Use window.location.href to force a full page reload
            // This ensures getInitialState is called and user info is fetched
            window.location.href = '/features';
        } else {
            history.push('/login');
        }
    }, [searchParams]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spin size="large" tip="Authenticating..." />
        </div>
    );
};

export default OAuthCallback;
