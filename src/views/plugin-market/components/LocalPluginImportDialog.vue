<template>
  <Dialog
    :visible="visible"
    :modal="true"
    header="导入本地插件"
    :style="{ width: '40vw' }"
    class="plugin-import-dialog"
    @update:visible="$emit('update:visible', $event)">
    <div class="import-content" v-if="localPluginFile">
      <div class="file-info">
        <i class="pi pi-file-excel text-2xl mr-2"></i>
        <div class="file-details">
          <div class="file-name">{{ localPluginFile.name }}</div>
          <div class="file-size text-xs hint-text">
            {{
              localPluginFile.size > 0
                ? formatFileSize(localPluginFile.size)
                : "大小未知"
            }}
          </div>
        </div>
      </div>

      <h3 class="text-lg font-semibold mt-4 mb-3">基本信息</h3>

      <div class="form-group mt-3">
        <label for="pluginWindowId" class="block mb-2"
          >插件ID (唯一标识符)</label
        >
        <div class="info-text-display">
          {{ localPluginInfo.windowId || "-" }}
        </div>
      </div>

      <div class="form-group mt-3">
        <label for="pluginTitle" class="block mb-2">插件名称</label>
        <div class="info-text-display">
          {{ localPluginInfo.title || "-" }}
        </div>
      </div>

      <div class="form-group mt-3">
        <label for="pluginDesc" class="block mb-2">插件描述</label>
        <div class="info-text-display">
          {{ localPluginInfo.description || "-" }}
        </div>
      </div>

      <div class="form-group mt-3">
        <label for="pluginAuthor" class="block mb-2">作者</label>
        <div class="info-text-display">
          {{ localPluginInfo.author || "本地导入" }}
        </div>
      </div>

      <div class="form-group mt-3">
        <label for="pluginVersion" class="block mb-2">版本</label>
        <div class="info-text-display">
          {{ localPluginInfo.version || "1.0.0" }}
        </div>
      </div>

      <div
        v-if="localPluginInfo.tags && localPluginInfo.tags.length > 0"
        class="form-group mt-3">
        <label for="pluginTags" class="block mb-2">标签</label>
        <div class="info-text-display">
          <Tag
            v-for="tag in localPluginInfo.tags"
            :key="tag"
            :value="tag"
            severity="info"
            class="mr-1" />
        </div>
      </div>

      <div class="form-group mt-3">
        <label for="pluginEmail" class="block mb-2">邮箱</label>
        <div class="info-text-display">
          {{ localPluginInfo.email || "-" }}
        </div>
      </div>

      <h3 class="text-lg font-semibold mt-4 mb-3">窗口设置</h3>

      <div class="form-group mt-3">
        <label for="pluginSize" class="block mb-2">窗口大小</label>
        <div class="info-text-display">
          {{
            localPluginInfo.size
              ? `${localPluginInfo.size[0]} × ${localPluginInfo.size[1]}`
              : "-"
          }}
        </div>
      </div>

      <div class="form-group mt-3">
        <label for="pluginPosition" class="block mb-2">窗口位置</label>
        <div class="info-text-display">
          {{
            localPluginInfo.position
              ? `X:${localPluginInfo.position[0]}, Y:${localPluginInfo.position[1]}`
              : "-"
          }}
        </div>
      </div>

      <div class="form-group mt-3">
        <label for="pluginAlwaysOnTop" class="block mb-2">置顶窗口</label>
        <div class="info-text-display">
          {{ localPluginInfo.alwaysOnTop ? "是" : "否 (默认)" }}
        </div>
      </div>

      <div class="form-group mt-3">
        <label for="pluginResizable" class="block mb-2">可调整大小</label>
        <div class="info-text-display">
          {{ localPluginInfo.resizable !== false ? "是 (默认)" : "否" }}
        </div>
      </div>

      <div class="form-group mt-3">
        <label for="pluginIcon" class="block mb-2">图标</label>
        <div class="info-text-display">
          {{ localPluginInfo.icon || "./icon.png (默认)" }}
        </div>
      </div>
    </div>

    <div class="import-placeholder" v-else>
      <div class="text-center py-4">
        <i class="pi pi-upload text-4xl upload-icon mb-3"></i>
        <p>请先选择要导入的插件文件</p>
        <Button
          label="选择文件"
          icon="pi pi-file"
          class="mt-3"
          @click="$emit('open-file-selector')" />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button label="取消" class="p-button-text" @click="$emit('close')" />
        <Button
          label="导入"
          icon="pi pi-check"
          :disabled="!canImport"
          severity="primary"
          @click="$emit('import')" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import Tag from "primevue/tag";
import type {
  LocalPluginFile,
  LocalPluginInfo,
} from "@/interface/pluginMarket.d";

type Props = {
  visible: boolean;
  localPluginFile: LocalPluginFile | null;
  localPluginInfo: LocalPluginInfo;
}

type Emits = {
  (e: "update:visible", value: boolean): void;
  (e: "close"): void;
  (e: "import"): void;
  (e: "open-file-selector"): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const canImport = computed(() => {
  return (
    props.localPluginFile !== null &&
    props.localPluginInfo.windowId &&
    props.localPluginInfo.title
  );
});

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
</script>

<style lang="less">
.plugin-import-dialog {
  .hint-text {
    color: var(--theme-text-muted);
  }

  .upload-icon {
    color: var(--theme-text-muted);
  }

  .import-content {
    padding: 1rem;
  }

  .file-info {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid var(--theme-border);
    border-radius: 6px;
    background-color: var(--theme-background-secondary);
  }

  .file-details {
    margin-left: 0.5rem;
  }

  .file-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 1.5rem;

    :deep(.p-button) {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;

      .p-button-icon {
        font-size: 0.875rem;
      }
    }
  }
}

.info-text-display {
  padding: 0.75rem;
  background-color: var(--theme-background-secondary);
  border: 1px solid var(--theme-border);
  border-radius: 6px;
  min-height: 41px;
  line-height: 1.5;
}
</style>
