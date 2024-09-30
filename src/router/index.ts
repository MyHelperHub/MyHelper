import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
    {
        name: 'Index',
        path: '/',
        component: () => import('@/views/Index.vue'),
    },
    {
        name: 'Label',
        path: '/label',
        component: () => import('@/views/label/Label.vue'),
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