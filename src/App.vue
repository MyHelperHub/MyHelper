<template>
  <Toast />
  <Loading ref="loadingRef" />
  <Message ref="messageRef" />
  <RouterView> </RouterView>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import Message from "./components/Message.vue";
import Loading from "./components/Loading.vue";
import Toast from "primevue/toast";
import { setMessageRef } from "./composables/message";
import { setLoadingRef } from "./composables/loading";

const messageRef = ref(null);
const loadingRef = ref(null);
onMounted(() => {
  setMessageRef(messageRef.value);
  setLoadingRef(loadingRef.value);
});
</script>
