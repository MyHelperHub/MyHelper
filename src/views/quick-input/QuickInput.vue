<template>
  <Dialog
    v-model:visible="visible"
    modal
    dismissableMask
    :closable="false"
    :showHeader="false"
    :style="{ width: '232px', top: '10px', left: '10px' }"
    @hide="onHide">
    <div class="panel-container quick-input-container">
      <div class="qi-header">
        <div class="qi-search">
          <i class="pi pi-search"></i>
          <InputText
            v-model.trim="query"
            autofocus
            :placeholder="activeTab === 0 ? '搜索常用文本…' : '搜索剪贴板…'"
            class="search-input" />
        </div>
        <div class="qi-tabs" role="tablist">
          <button
            type="button"
            class="seg-btn"
            :class="{ active: activeTab === 0 }"
            role="tab"
            :aria-selected="activeTab === 0"
            @click="activeTab = 0"
            title="常用文本">
            常用 ({{ commonCount }})
          </button>
          <button
            type="button"
            class="seg-btn"
            :class="{ active: activeTab === 1 }"
            role="tab"
            :aria-selected="activeTab === 1"
            @click="activeTab = 1"
            title="剪贴板">
            剪贴板 ({{ clipboardCount }})
          </button>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="qi-content">
        <div v-show="activeTab === 0" class="content-wrapper">
          <CommonText ref="commonRef" :query="query" />
        </div>
        <div v-show="activeTab === 1" class="content-wrapper">
          <Clipboard ref="clipboardRef" :query="query" />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, useTemplateRef } from "vue";
import Dialog from "primevue/dialog";
import CommonText from "./CommonText.vue";
import Clipboard from "./Clipboard.vue";
import InputText from "primevue/inputtext";

const visible = ref(false);

/** 0为常用，1为剪贴板 */
const activeTab = ref(0);
const query = ref("");
const commonRef = useTemplateRef<InstanceType<typeof CommonText>>("commonRef");
const clipboardRef =
  useTemplateRef<InstanceType<typeof Clipboard>>("clipboardRef");

const commonCount = computed(() => commonRef.value?.getFilteredCount?.() ?? 0);
const clipboardCount = computed(
  () => clipboardRef.value?.getFilteredCount?.() ?? 0,
);

defineExpose({ visible });

const onHide = () => {
  query.value = "";
};
</script>

<style lang="less">
.quick-input-container {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  height: 400px;
  max-height: calc(100vh - 54px);
  display: flex;
  flex-direction: column;
  position: relative;
}

.qi-header {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
  padding: 6px 6px 4px 6px;
  background: transparent;
  border-bottom: 1px solid
    rgba(var(--theme-border-rgb), var(--theme-transparency-border));
}

.qi-search {
  position: relative;
  display: flex;
  align-items: center;

  i {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    color: var(--theme-text-muted);
  }

  .search-input {
    width: 100%;
    height: 28px;
    line-height: 28px;
    padding-left: 26px;
    padding-right: 8px;
    border-radius: 8px;
    background: rgba(
      var(--theme-background-card-rgb),
      var(--theme-transparency-card)
    );
    border: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));
    color: var(--theme-text);
    font-size: 12px;
  }
}

.qi-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.seg-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 0;
  border-radius: 0;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--theme-text-secondary);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;

  &.active {
    color: var(--theme-text);
    border-bottom: 2px solid var(--theme-primary);
  }
}

.qi-content {
  flex: 1;
  overflow: hidden;

  .content-wrapper {
    height: 100%;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    &::-webkit-scrollbar {
      width: 0;
      background: transparent;
    }
    padding: 8px;
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.15s ease;
}
.fade-slide-enter-from {
  opacity: 0;
}
.fade-slide-leave-to {
  opacity: 0;
}

.p-dialog .p-dialog-content {
  padding: 0;
  background: transparent;
}
</style>
