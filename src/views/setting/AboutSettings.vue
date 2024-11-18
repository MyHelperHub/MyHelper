<template>
  <div class="setting-section">
    <h3>关于</h3>
    <div class="about">
      <img class="logo" src="/logo.png" />
      <div class="version">当前版本：{{ updateState.currentVersion }}</div>
      <Button
        class="button"
        :loading="updateState.checking"
        @click="handleCheckUpdate">
        {{ updateState.checking ? "检查中..." : "检查更新" }}
      </Button>
      <Button
        class="button"
        label="Info"
        severity="info"
        variant="outlined"
        @click="openLink('https://github.com/ialtone/MyHelper/issues')"
        >意见反馈</Button
      >
      <div></div>
      <div class="intro">
        <div class="intro-item">
          <div class="intro-item-left">项目地址：</div>
          <div
            class="intro-item-right"
            @click="openLink('https://github.com/ialtone/myhelper')">
            https://github.com/ialtone/myhelper
          </div>
        </div>
        <div class="intro-item">
          <div class="intro-item-left">作者邮箱：</div>
          <div
            class="intro-item-right"
            @click="copyToClipboard('ialtone@ialtone.xyz')">
            ialtone@ialtone.xyz
          </div>
        </div>
      </div>
      <div class="footer">
        <div
          class="footer-item cursor-pointer"
          v-tooltip.top="{
            value: '点击复制',
            showDelay: 100,
            pt: {
              text: {
                style: {
                  fontSize: '15px',
                },
              },
            },
          }"
          @click="copyToClipboard('206028763')">
          🐧群：206028763
        </div>
        <div class="footer-item">❤️ made by ialtone ❤️</div>
      </div>
    </div>

    <!-- 更新对话框 -->
    <Dialog
      v-model:visible="showUpdateModal"
      :dismissableMask="true"
      header="发现新版本"
      modal
      appendTo="self"
      :closable="true">
      <div class="modal-content">
        <div class="update-info">
          <p class="version-info">最新版本：{{ updateState.newVersion }}</p>
          <p class="update-item" v-if="updateState.date">
            发布时间：{{ updateState.date }}
          </p>
          <ScrollPanel class="update-notes" v-if="updateState.notes">
            <div class="update-item">
              <div class="notes-label">更新说明：</div>
              <div
                class="markdown-content"
                v-html="renderedNotes"
                @click="handleClick"></div>
            </div>
          </ScrollPanel>
        </div>

        <div v-if="updateState.downloading" class="progress-container">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${updateState.progress.percent}%` }"></div>
          </div>
          <span class="progress-text">
            {{
              Math.round(
                (updateState.progress.downloaded / 1024 / 1024) * 100,
              ) / 100
            }}MB /
            {{
              Math.round((updateState.progress.total / 1024 / 1024) * 100) /
              100
            }}MB ({{ updateState.progress.percent }}%)
          </span>
        </div>

        <div class="modal-buttons">
          <Button
            v-if="!updateState.downloading"
            label="稍后再说"
            severity="secondary"
            variant="outlined"
            @click="showUpdateModal = false" />
          <Button
            v-if="!updateState.downloading"
            label="立即更新"
            severity="primary"
            :loading="updateState.downloading"
            @click="handleUpdate" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import ScrollPanel from "primevue/scrollpanel";
import { ref, computed } from "vue";
import { getVersion } from "@tauri-apps/api/app";
import {
  checkForUpdates,
  downloadAndInstallUpdate,
} from "@/api/ipc/update.api";
import { showMessage } from "@/utils/message";
import { copyToClipboard } from "@/utils/clipboard";
import type { UpdateState } from "@/interface/update";
import { ipcOpen } from "@/api/ipc/launch.api";
import { marked } from "marked";
import DOMPurify from "dompurify";

const showUpdateModal = ref(false);
const updateState = ref<UpdateState>({
  checking: false,
  downloading: false,
  currentVersion: "",
  newVersion: "",
  notes: "",
  date: "",
  progress: {
    downloaded: 0,
    total: 0,
    percent: 0,
  },
});
const renderedNotes = computed(() => {
  if (!updateState.value.notes) return "";
  const rawHtml = marked(updateState.value.notes) as string;
  return DOMPurify.sanitize(rawHtml);
});
const init = async () => {
  updateState.value.currentVersion = await getVersion();
};

init();

const handleCheckUpdate = async () => {
  if (updateState.value.checking) return;

  updateState.value.checking = true;
  try {
    const result = await checkForUpdates();

    if (result.shouldUpdate) {
      updateState.value.newVersion = result.version || "";
      updateState.value.notes = result.notes || "";
      if (result.date) {
        const date = result.date.split(" ")[0];
        updateState.value.date = new Date(date).toLocaleDateString("zh-CN");
      } else {
        updateState.value.date = "";
      }
      showUpdateModal.value = true;
    } else {
      showMessage("当前已是最新版本", 2500, 1);
    }
  } catch (error) {
    showMessage("检查更新失败，请稍后重试", 2500, 2);
  } finally {
    updateState.value.checking = false;
  }
};

/** 点击更新的时间 */
const handleUpdate = async () => {
  if (updateState.value.downloading) return;

  updateState.value.downloading = true;
  try {
    await downloadAndInstallUpdate((progress) => {
      updateState.value.progress = progress;
    });
  } catch (error) {
  } finally {
    updateState.value.downloading = false;
  }
};

const openLink = (url: string) => {
  ipcOpen(url);
};

/** 在更新说明中的点击事件，如果点击外部链接，则用默认浏览器打开 */
const handleClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.tagName === "A") {
    e.preventDefault();
    const href = target.getAttribute("href");
    if (href) {
      ipcOpen(href);
    }
  }
};
</script>

<style lang="less" scoped>
.setting-section {
  h3 {
    margin-bottom: 20px;
    font-size: 1.2rem;
    color: #333;
  }

  .about {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .logo {
      width: 100px;
      border-radius: 30px;
    }
    .button {
      margin-top: 20px;
    }
    .intro {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 20px 50px;
      white-space: nowrap;
      gap: 6px;
      .intro-item {
        display: flex;
        align-items: center;
        user-select: text;
        .intro-item-left {
          color: unset;
        }
        .intro-item-right {
          color: #666;
          cursor: pointer;
        }
      }
    }
    .footer {
      position: fixed;
      bottom: 20px;
      margin-top: 20px;
      font-size: 0.8rem;
      color: #666;
      .footer-item {
        text-align: center;
        justify-content: center;
      }
    }
  }
}

.modal-content {
  width: 400px;
  display: flex;
  flex-direction: column;
  padding-top: 0;

  .update-info {
    margin-bottom: 1rem;

    .version-info {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }

    .update-item {
      font-size: 0.9rem;

      .notes-label {
        margin-bottom: 0.5rem;
      }
    }

    .update-notes {
      height: 200px;
      width: 100%;
      overflow-wrap: anywhere;
      margin: 0.5rem 0;

      .markdown-content {
        padding: 0.5rem;
      }
    }
  }

  .progress-container {
    .progress-bar {
      width: 100%;
      height: 6px;
      background-color: #eee;
      border-radius: 3px;
      overflow: hidden;

      .progress-fill {
        height: 100%;
        background-color: var(--primary-color, #4a9fee);
        transition: width 0.3s ease;
      }
    }

    .progress-text {
      display: block;
      text-align: center;
      font-size: 0.9rem;
      color: #666;
      margin-top: 0.5rem;
    }
  }

  .modal-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    justify-content: flex-end;
  }
}
</style>
