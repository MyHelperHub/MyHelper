<template>
  <Message ref="messageRef" />
  <RouterView>
  </RouterView>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Message from './components/Message.vue';
import { setMessageRef } from './utils/message';

const messageRef = ref(null);
onMounted(() => {
  setMessageRef(messageRef.value);
});
</script>

<style scoped></style>
