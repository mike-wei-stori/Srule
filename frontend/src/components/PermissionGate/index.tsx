import React from 'react';
import { useModel } from '@umijs/max';

interface PermissionGateProps {
    permission: string;
    children: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({ permission, children }) => {
    const { initialState } = useModel('@@initialState');
    const { currentUser } = initialState || {};

    if (!currentUser || !currentUser.permissions) {
        return null;
    }

    if (currentUser.permissions.includes(permission)) {
        return <>{children}</>;
    }

    return null;
};

export default PermissionGate;
