import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {
    dataField: 'data',
  },
  layout: {
    title: 'Rule Engine',
  },
  esbuildMinifyIIFE: true,
  locale: {
    default: 'zh-CN',
    antd: true,
    title: true,
    baseNavigator: true,
    baseSeparator: '-',
  },
  routes: [
    {
      path: '/',
      redirect: '/features',
    },
    {
      path: '/login',
      component: './Login',
      layout: false,
    },
    {
      path: '/oauth/callback',
      component: './OAuthCallback',
      layout: false,
    },
    {
      title: 'menu.features',
      path: '/features',
      component: './Feature',
      access: 'canSeeFeatures',
    },
    {
      path: '/features/:id',
      component: './Feature/Detail',
      title: 'Feature Detail',
      hideInMenu: true,
    },
    {
      title: 'menu.packages',
      path: '/packages',
      component: './RulePackage',
      access: 'canSeePackages',
    },
    {
      path: '/editor/:packageCode',
      component: './RuleEditor',
      layout: {
        hideMenu: true,
        hideFooter: true,
      },
    },
    {
      title: 'menu.profile',
      path: '/profile',
      component: './Profile',
      hideInMenu: true,
    },
    {
      title: 'menu.users',
      path: '/users',
      component: './User',
      access: 'canSeeUsers',
    },
    {
      title: 'menu.roles',
      path: '/roles',
      component: './RoleManagement',
      access: 'canSeeRoles',
    },
    {
      title: 'menu.permissions',
      path: '/permissions',
      component: './PermissionManagement',
      access: 'canSeePermissions',
    },
    {
      title: 'menu.sysConfig',
      path: '/sys/config',
      component: './SysConfig',
      access: 'canSeeAdmin',
    },
    {
      name: 'records',
      title: 'menu.records',
      path: '/records',
      access: 'canSeeRecords',
      routes: [
        {
          name: 'features',
          title: 'menu.records.features',
          path: '/records/features',
          component: './Record/FeatureRecord',
          access: 'canSeeRecordFeatures',
        },
        {
          name: 'rules',
          title: 'menu.records.rules',
          path: '/records/rules',
          component: './Record/RuleRecord',
          access: 'canSeeRecordRules',
        },
      ],
    },
  ],
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
  npmClient: 'npm',
});

