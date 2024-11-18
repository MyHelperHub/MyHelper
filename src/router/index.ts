import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import pluginConfig from "../../plugin/mh-plugin/mhPlugin.json";

// 基础路由配置
const baseRoutes = [
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
  },
  {
    name: "Develop",
    path: "/develop",
    component: () => import("@/views/plugin-market/Develop.vue"),
  },
];

// mhPlugin.json中读取windowId创建插件路由
const pluginRoute = import.meta.env.DEV
  ? {
      path: "/plugin",
      children: [
        {
          name: pluginConfig.windowId,
          path: pluginConfig.windowId,
          beforeEnter: () => {
            window.location.href = "http://localhost:1421";
            return false;
          },
        },
      ],
    }
  : {
      path: "/plugin",
      children: [],
    };

// 合并路由
const routes = [...baseRoutes, pluginRoute];
const router = createRouter({
  routes: routes as RouteRecordRaw[],
  history: createWebHashHistory(),
});

export default router;
