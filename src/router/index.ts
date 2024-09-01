import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
    {
        name: 'Index',
        path: '/',
        component: () => import('@/pages/index.vue'),
    },
    {
        name: 'Settings',
        path: '/settings',
        component: () => import('@/pages/settings.vue')
    }
];

const router = createRouter({
    routes,
    history: createWebHashHistory(),
})


export default router