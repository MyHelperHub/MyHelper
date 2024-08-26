import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
    {
        name: 'Home',
        path: '/',
        component: () => import('@/pages/home.vue'),
    },
    {
        name:'settings',
        path:'/settings',
        component:()=>import('@/pages/settings.vue')
    }
];

const router = createRouter({
    routes,
    history: createWebHashHistory(),
})


export default router