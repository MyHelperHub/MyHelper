import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
    {
        name: 'Index',
        path: '/',
        component: () => import('@/pages/Index.vue'),
    },
    {
        name: 'Settings',
        path: '/settings',
        component: () => import('@/pages/Settings.vue')
    }
];

const router = createRouter({
    routes,
    history: createWebHashHistory(),
})


export default router