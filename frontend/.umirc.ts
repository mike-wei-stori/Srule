import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
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
    },
    {
      title: 'menu.packages',
      path: '/packages',
      component: './RulePackage',
    },
    {
      path: '/editor/:packageCode',
      component: './RuleEditor',
      layout: false,
    },
    {
      title: 'menu.profile',
      path: '/profile',
      component: './Profile',
    },
    {
      title: 'menu.users',
      path: '/users',
      component: './User',
    },
    {
      title: 'menu.roles',
      path: '/roles',
      component: './RoleManagement',
    },
    {
      title: 'menu.permissions',
      path: '/permissions',
      component: './PermissionManagement',
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

