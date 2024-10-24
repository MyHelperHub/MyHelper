<template>
  <div id="myplugin-container">
    <div ref="pluginContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

// 定义一个 ref 来存储容器的 DOM 元素
const pluginContainer = ref<HTMLDivElement | null>(null);

// 解析字符串形式的数组
const parseArrayFromMetaContent = (content: string) => {
  try {
    return JSON.parse(content.replace(/'/g, '"')); // 将单引号替换为双引号后解析为数组
  } catch (error) {
    console.error("Failed to parse meta content:", content);
    return [];
  }
};

// 定义加载插件的方法
const loadPlugin = async () => {
  if (pluginContainer.value) {
    // 加载 HTML 文件
    const response = await fetch("../../plugin/myPlugin/index.html");
    const htmlContent = await response.text();
    pluginContainer.value.innerHTML = htmlContent;

    // 动态加载 CSS 文件
    const cssMeta = document.querySelector("meta[name='plugin-css']");
    if (cssMeta && cssMeta instanceof HTMLMetaElement) {
      const cssFiles = parseArrayFromMetaContent(cssMeta.content);
      cssFiles.forEach((file: string) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `../../plugin/myPlugin/${file}`;
        document.head.appendChild(link);
      });
    }

    // 动态加载 JS 文件
    const jsMeta = document.querySelector("meta[name='plugin-js']");
    if (jsMeta && jsMeta instanceof HTMLMetaElement) {
      const jsFiles = parseArrayFromMetaContent(jsMeta.content);
      jsFiles.forEach((file: string) => {
        const script = document.createElement("script");
        script.src = `../../plugin/myPlugin/${file}`;
        script.type = "module"; // 如果使用 ES 模块
        document.body.appendChild(script);
      });
    }
  }
};

// 在组件挂载后加载插件
onMounted(() => {
  loadPlugin();
});
</script>

<style scoped></style>
