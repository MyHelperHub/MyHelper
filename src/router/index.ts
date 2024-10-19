import { createRouter, createWebHashHistory } from "vue-router";
const routes = [
  {
    name: "Index",
    path: "/",
    component: () => import("@/views/Index.vue"),
  },
  {
    name: "Label",
    path: "/label",
    component: () => import("@/views/label/Label.vue"),
  },
  {
    name: "Setting",
    path: "/setting",
    component: () => import("@/views/Setting.vue"),
  },
];

const router = createRouter({
  routes,
  history: createWebHashHistory(),
});

export default router;
