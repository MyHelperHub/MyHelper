<template>
   <Loading ref="loadingRef" />
  <Message ref="messageRef" />
  <RouterView>
  </RouterView>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Message from './components/Message.vue';
import Loading from './components/Loading.vue';
import { setMessageRef } from './utils/message';
import { setLoadingRef } from './utils/loading';

const messageRef = ref(null);
const loadingRef = ref(null);
onMounted(() => {
  setMessageRef(messageRef.value);
  setLoadingRef(loadingRef.value);
});
</script>

<style scoped></style>
