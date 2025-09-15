<template>
  <div
    class="qi-row"
    v-tooltip.bottom="{
      value: text,
      showDelay: 200,
      pt: { text: { style: { fontSize: '12px' } } },
    }"
    @click="$emit('click')"
    @contextmenu.prevent="$emit('contextmenu', $event)">
    <slot>
      <div class="row-text">{{ text || "空内容" }}</div>
    </slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text?: string;
}>();

defineEmits<{
  (e: "click"): void;
  (e: "contextmenu", ev: MouseEvent): void;
}>();
</script>

<style scoped lang="less">
.qi-row {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 10px;
  border: 1px solid
    rgba(var(--theme-border-rgb), var(--theme-transparency-border));
  border-radius: 8px;
  background: transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
  cursor: pointer;
  height: 36px;
}

.qi-row:hover {
  background: rgba(
    var(--theme-background-card-rgb),
    var(--theme-transparency-card)
  );
  border-color: rgba(var(--theme-primary-rgb), 0.35);
}

.row-text {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--theme-text);
  font-weight: 500;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.2px;
}
</style>
