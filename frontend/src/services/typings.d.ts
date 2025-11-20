declare namespace API {

    interface Result<T> {
        code: number;
        message: string;
        data: T;
        success: boolean;
    }

    interface PageInfo<T> {
        list: T[];
        total: number;
        pageNum: number;
        pageSize: number;
    }

    interface User {
        id: number;
        username: string;
        nickname: string;
        email: string;
        avatar?: string;
        status: number;
        createTime: string;
        updateTime: string;
        roles?: Role[];
    }

    interface Role {
        id: number;
        name: string;
        code: string;
        description?: string;
        status: number;
        createTime: string;
        updateTime: string;
    }

    interface Permission {
        id: number;
        name: string;
        code: string;
        type: string;
        parentId?: number;
        path?: string;
        component?: string;
        icon?: string;
        sortOrder?: number;
        status: number;
        description?: string; // Added
        createTime: string;
        updateTime: string;
        children?: Permission[];
    }

    interface RulePackage {
        id: number;
        name: string;
        code: string;
        description?: string;
        status: string; // DRAFT, PUBLISHED, ARCHIVED
        version?: string;
        extensionData?: string; // JSON string
        createTime: string;
        updateTime: string;
    }

    interface RulePackageVersion {
        id: number;
        packageId: number;
        version: string;
        description?: string;
        content?: string;
        createTime: string;
        createdBy?: string;
    }

    interface RuleVariable {
        id?: number;
        packageId?: number;
        name?: string;
        code?: string;
        dataType?: string;
        category?: string; // INPUT, OUTPUT, INTERNAL
        defaultValue?: string;
        description?: string;
        featureId?: number;
        createTime?: string;
    }

    interface Feature {
        id: number;
        name: string;
        code: string;
        description?: string;
        returnType: string;
        scriptContent?: string;
        status: number;
        createTime: string;
        updateTime: string;
    }

    interface LoginParams {
        username?: string;
        password?: string;
    }

    type LoginResult = Result<{
        token: string;
        user: User;
    }>;

    type RegisterParams = LoginParams;

    type UserQueryParams = {
        current?: number;
        pageSize?: number;
        username?: string;
        nickname?: string;
    };

    type UserUpdateDTO = Partial<User>;

    type PackageQueryParams = {
        current?: number;
        pageSize?: number;
        name?: string;
        code?: string;
        status?: string;
    };

    type PackageDTO = Partial<RulePackage>;

    type PackageGraphData = {
        nodes: any[];
        edges: any[];
        viewport?: {
            x: number;
            y: number;
            zoom: number;
        };
    };

    type PublishPackageParams = {
        description?: string;
    };

    type CreateVersionParams = {
        version: string;
        description?: string;
    }

    // Role & Permission
    type RoleDTO = Partial<Role>;
    type RoleQueryParams = {
        current?: number;
        pageSize?: number;
        name?: string;
        code?: string;
    };

    type PermissionQueryParams = {
        current?: number;
        pageSize?: number;
        name?: string;
        code?: string;
    };

    // Feature
    type FeatureDTO = Partial<Feature>;
    type FeatureQueryParams = {
        current?: number;
        pageSize?: number;
        name?: string;
        code?: string;
    };

    // Rule Variable
    type RuleVariableDTO = Partial<RuleVariable>;
    type RuleVariableQueryParams = {
        packageId: number;
        name?: string;
        code?: string;
    };

    // Rule Execution
    type RuleExecutionParams = {
        packageId: number;
        inputs: Record<string, any>;
    };

    interface RuleExecutionResult {
        facts: Record<string, any>;
        firedRules: string[];
    }
}
