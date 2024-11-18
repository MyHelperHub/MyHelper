import { computed } from "vue";

export const isDev = computed(() => import.meta.env.DEV);