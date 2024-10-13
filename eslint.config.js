import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import VueEslintParser from "vue-eslint-parser"; // 导入 VueEslintParser

export default [
  {
    // 应用于所有文件
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "no-var": "error",
      "no-multiple-empty-lines": ["warn", { max: 1 }],
      "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
      "no-unexpected-multiline": "error",
      "no-useless-escape": "off",
    },
  },
  // JavaScript 推荐配置
  pluginJs.configs.recommended,
  // TypeScript 推荐配置
  ...tseslint.configs.recommended,
  // Vue.js Essential 配置
  ...pluginVue.configs["flat/essential"],
  // Prettier 推荐配置
  eslintPluginPrettierRecommended,
  {
    // 应用于 .vue 文件
    files: ["**/*.vue"],
    languageOptions: {
      parser: VueEslintParser,
      parserOptions: {
        parser: "@typescript-eslint/parser",
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/script-setup-uses-vars": "error",
      "vue/no-mutating-props": "off",
      "vue/attribute-hyphenation": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/prefer-ts-expect-error": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/semi": "off",
    },
  },
  {
    // 忽略 node_modules 和 dist 目录
    ignores: ["node_modules/", "dist/", "src-tauri"],
  },
];
