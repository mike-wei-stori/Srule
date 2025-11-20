import React, { useEffect } from 'react';
import { history, useLocation } from '@umijs/max';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token && location.pathname !== '/login' && location.pathname !== '/oauth/callback') {
            history.push('/login');
        }
    }, [token, location]);

    if (!token && location.pathname !== '/login' && location.pathname !== '/oauth/callback') {
        return null;
    }

    return <>{children}</>;
};

export default AuthGuard;
