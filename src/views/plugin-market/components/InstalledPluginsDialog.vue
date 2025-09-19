<template>
  <Dialog
    :visible="visible"
    :modal="true"
    header="已安装插件"
    :style="{ width: '80vw' }"
    class="installed-plugins-dialog"
    @update:visible="$emit('update:visible', $event)">
    <div class="installed-plugins-list">
      <div class="toolbar-container">
        <Button
          icon="pi pi-upload"
          label="从本地导入"
          class="theme-button-primary"
          @click="$emit('open-import-dialog')" />
      </div>
      <DataTable
        :value="installedPlugins"
        :paginator="true"
        :rows="5"
        tableStyle="min-width: 50rem"
        class="installed-table">
        <Column field="Name" header="插件名称" :sortable="true">
          <template #body="slotProps">
            <div
              class="plugin-name-cell clickable"
              @click="$emit('show-plugin-detail', slotProps.data)">
              <Image
                :src="slotProps.data.Icon"
                :alt="slotProps.data.Name"
                width="32"
                height="32" />
              <div class="plugin-basic-info">
                <span class="name">{{ slotProps.data.Name }}</span>
                <span class="description">{{
                  slotProps.data.Description
                }}</span>
              </div>
            </div>
          </template>
        </Column>
        <Column field="Version" header="版本" :sortable="true">
          <template #body="slotProps">
            <div class="version-cell">
              <span class="current-version">{{ slotProps.data.Version }}</span>
              <Tag
                v-if="hasUpdate(slotProps.data)"
                severity="warning"
                value="有更新"
                class="update-tag" />
            </div>
          </template>
        </Column>
        <Column field="Author" header="作者" :sortable="true">
          <template #body="slotProps">
            <div class="author-cell">
              <span>{{ slotProps.data.Author }}</span>
            </div>
          </template>
        </Column>
        <Column field="CreateTime" header="安装日期" :sortable="true">
          <template #body="slotProps">
            <div class="date-cell">
              <span>{{ formatDate(slotProps.data.installTime) }}</span>
            </div>
          </template>
        </Column>
        <Column field="Status" header="状态" :sortable="true">
          <template #body="slotProps">
            <div class="status-cell">
              <Tag
                :severity="
                  slotProps.data.config?.isEnabled ? 'success' : 'danger'
                "
                :value="
                  slotProps.data.config?.isEnabled ? '已启用' : '已禁用'
                " />
            </div>
          </template>
        </Column>
        <Column header="操作" :style="{ width: '8rem' }">
          <template #body="slotProps">
            <div class="action-cell">
              <Button
                v-if="slotProps.data.HasUpdate"
                icon="pi pi-sync"
                severity="info"
                text
                v-tooltip.top="'更新插件'"
                @click="$emit('download-plugin', slotProps.data, true)"
                class="action-button" />
              <Button
                :icon="
                  slotProps.data.config?.isEnabled
                    ? 'pi pi-check-circle'
                    : 'pi pi-times-circle'
                "
                :severity="
                  slotProps.data.config?.isEnabled ? 'success' : 'danger'
                "
                text
                v-tooltip.top="
                  slotProps.data.config?.isEnabled
                    ? '点击禁用插件'
                    : '点击启用插件'
                "
                @click="
                  $emit(
                    'toggle-plugin',
                    slotProps.data,
                    !slotProps.data.config?.isEnabled,
                  )
                "
                class="action-button" />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                v-tooltip.top="'卸载插件'"
                @click="$emit('uninstall-plugin', slotProps.data, $event)"
                class="action-button" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Image from "primevue/image";
import Tag from "primevue/tag";
import type { Plugin, PluginDetail } from "@/types/plugin";
import { formatDate, checkPluginUpdate } from "@/utils/pluginUtils";

type Props = {
  visible: boolean;
  installedPlugins: Plugin[];
  plugins: PluginDetail[];
};

type Emits = {
  (e: "update:visible", value: boolean): void;
  (e: "open-import-dialog"): void;
  (e: "show-plugin-detail", plugin: Plugin): void;
  (e: "download-plugin", plugin: Plugin, isUpdate: boolean): void;
  (e: "toggle-plugin", plugin: Plugin, enable: boolean): void;
  (e: "uninstall-plugin", plugin: Plugin, event: Event): void;
};

const props = defineProps<Props>();
defineEmits<Emits>();

// 检查插件是否有更新
const hasUpdate = (plugin: Plugin): boolean => {
  const marketPlugin = props.plugins.find(
    (p) => p.Plugin.WindowId === plugin.WindowId,
  );
  return marketPlugin
    ? checkPluginUpdate(plugin.Version, marketPlugin.Plugin.Version)
    : false;
};
</script>

<style lang="less">
.installed-plugins-dialog {
  :deep(.p-dialog) {
    width: 80vw;
    max-width: 1200px;
  }

  .plugin-name-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    img {
      border-radius: 4px;
    }
  }

  .installed-table {
    .plugin-name-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      cursor: pointer;

      &:hover {
        .name {
          color: var(--theme-primary);
        }
      }

      img {
        border-radius: 4px;
      }

      .plugin-basic-info {
        display: flex;
        flex-direction: column;

        .name {
          font-weight: 500;
          transition: color 0.2s;
        }

        .description {
          font-size: 0.875rem;
          color: var(--theme-text-muted);
          margin-top: 0.25rem;
        }
      }
    }

    .version-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .update-tag {
        font-size: 0.75rem;
      }
    }

    .status-cell {
      :deep(.p-tag) {
        min-width: 4rem;
        justify-content: center;
      }
    }

    .action-cell {
      display: flex;
      gap: 0.25rem;
      justify-content: flex-start;

      .action-button {
        padding: 0.5rem;

        &:hover {
          background-color: rgba(
            var(--theme-background-secondary-rgb),
            var(--theme-transparency-background-secondary)
          );
        }
      }
    }
  }
}

.toolbar-container {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1rem;
  margin-left: 1rem;
}
</style>
