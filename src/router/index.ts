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
    component: () => import("@/views/setting/Setting.vue"),
  },
  {
    name: "My",
    path: "/my",
    component: () => import("@/views/my/My.vue"),
  },
  {
    name: "PluginMarket",
    path: "/plugin-market",
    component: () => import("@/views/plugin-market/PluginMarket.vue"),
  }, {
    name: "Develop",
    path: "/develop",
    component: () => import("@/views/plugin-market/Develop.vue"),
  },
];

const router = createRouter({
  routes,
  history: createWebHashHistory(),
});

export default router;
