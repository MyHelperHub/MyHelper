import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
    {
        name: 'Index',
        path: '/',
        component: () => import('@/views/Index.vue'),
    },
    {
        name: 'Settings',
        path: '/settings',
        component: () => import('@/views/Settings.vue')
    }
];

const router = createRouter({
    routes,
    history: createWebHashHistory(),
})


export default router