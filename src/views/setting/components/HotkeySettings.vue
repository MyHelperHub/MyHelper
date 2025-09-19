<template>
  <div class="hotkey-settings-container">
    <div v-if="modelValue.enabled" class="hotkey-settings">
      <div v-for="(item, key) in hotkeyItems" :key="key" class="hotkey-section">
        <div class="hotkey-item">
          <div class="hotkey-info">
            <h4>{{ item.title }}</h4>
            <div
              class="hotkey-input-container"
              :class="{
                disabled: !modelValue[key]?.enabled,
                recording: recording && activeKey === key,
              }">
              <InputText
                class="hotkey-input"
                :value="
                  recording && activeKey === key
                    ? tempKey
                    : modelValue[key]?.key
                "
                readonly
                @focus="handleInputClick(key)"
                @blur="cancelRecording"
                @keydown="captureHotkey($event)"
                placeholder="点击输入快捷键"
                :disabled="!modelValue[key]?.enabled" />
              <i
                v-if="recording && activeKey === key"
                class="pi pi-times edit-icon"
                @click.stop="cancelRecording"></i>
              <i
                v-else
                class="pi pi-trash delete-icon"
                @click.stop="clearHotkey(key)"
                :class="{ disabled: !modelValue[key]?.enabled }"></i>
            </div>
          </div>
          <ToggleSwitch
            v-model="modelValue[key].enabled"
            class="mini-switch"
            @change="updateHotkey(`${key}.enabled`, modelValue[key].enabled)">
            <template #handle="{ checked }">
              <i
                :class="[
                  '!text-xs pi',
                  { 'pi-check': checked, 'pi-times': !checked },
                ]"></i>
            </template>
          </ToggleSwitch>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ToggleSwitch from "primevue/toggleswitch";
import InputText from "primevue/inputtext";
import { showMessage } from "@/composables/message.ts";
import { ref } from "vue";
import { delay } from "@/utils/common";
import { HotkeyItem } from "@/types/setting";
import { getHotkeyItemsMap } from "@/composables/hotkey.ts";

// 快捷键项目配置，从统一配置获取
const hotkeyItems = getHotkeyItemsMap();

const props = defineProps<{
  modelValue: HotkeyItem;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: HotkeyItem): void;
  (e: "change", key: string, value: any): void;
}>();

// 当前正在录制状态
const recording = ref(false);
// 当前活动的键(正在录制的键)
const activeKey = ref<string | null>(null);
// 临时按键值
const tempKey = ref("");

const updateHotkey = (path: string, value: any) => {
  emit("change", path, value);
};

const handleInputClick = (key: string) => {
  if (!props.modelValue[key]?.enabled) return;

  if (recording.value && activeKey.value !== key) {
    cancelRecording();
  }

  if (recording.value && activeKey.value === key) {
    cancelRecording();
    return;
  }

  recording.value = true;
  activeKey.value = key;
  tempKey.value = props.modelValue[key]?.key || "";
};

const cancelRecording = () => {
  recording.value = false;
  activeKey.value = null;
  tempKey.value = "";
};

const clearHotkey = (key: string) => {
  if (!props.modelValue[key]?.enabled) return;

  const updatedModel = JSON.parse(JSON.stringify(props.modelValue));
  updatedModel[key].key = "";

  emit("update:modelValue", updatedModel);
  emit("change", `${key}.key`, "");

  showMessage(`已清空快捷键`, 1500, 1);
};

const captureHotkey = async (event: KeyboardEvent) => {
  if (
    !recording.value ||
    !activeKey.value ||
    !props.modelValue[activeKey.value]?.enabled
  )
    return;

  event.preventDefault();
  event.stopPropagation();

  let modifiers = [];
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  if (event.metaKey) modifiers.push(isMac ? "command" : "meta");
  if (event.ctrlKey) modifiers.push("control");
  if (event.altKey) modifiers.push(isMac ? "option" : "alt");
  if (event.shiftKey) modifiers.push("shift");

  if (!event.key || ["Control", "Alt", "Shift", "Meta"].includes(event.key)) {
    tempKey.value = modifiers.length > 0 ? `${modifiers.join("+")}+` : "";
    return;
  }

  const keyName = event.key === " " ? "space" : event.key.toLowerCase();

  if (modifiers.length === 0) {
    tempKey.value = "";
    showMessage(
      `请使用组合键（${isMac ? "Command/Option/Ctrl" : "Ctrl/Alt/Shift"} + 其他键）`,
      1500,
      2,
    );
    return;
  }

  const hotkey = `${modifiers.join("+")}+${keyName}`;

  tempKey.value = hotkey;

  const updatedModel = JSON.parse(JSON.stringify(props.modelValue));
  updatedModel[activeKey.value].key = hotkey;

  emit("update:modelValue", updatedModel);
  emit("change", `${activeKey.value}.key`, hotkey);

  showMessage(`已设置快捷键: ${hotkey}`, 1500, 1);

  await delay(300).then(() => {
    // 让当前激活元素失焦
    if (
      document.activeElement &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }
    // 取消录制状态
    cancelRecording();
  });
};
</script>

<style lang="less">
.hotkey-settings-container {
  margin-top: 10px;

  .hotkey-settings {
    margin-left: 0;
    padding-left: 0;

    .hotkey-section {
      margin-bottom: 15px;

      .hotkey-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-radius: 8px;

        &:hover {
          background-color: rgba(var(--theme-text-rgb), 0.02);
        }

        .hotkey-info {
          display: flex;
          align-items: center;
          flex: 1;

          h4 {
            font-size: 0.9rem;
            font-weight: normal;
            color: var(--theme-text-muted);
            width: 140px;
            margin: 0;
          }
        }

        .mini-switch {
          transform: scale(0.75);
        }
      }
    }
  }

  .hotkey-input-container {
    position: relative;
    flex: 1;
    margin: 0 10px;

    &.disabled {
      opacity: 0.7;

      .hotkey-input {
        background-color: rgba(
          var(--theme-background-secondary-rgb),
          var(--theme-transparency-background-secondary)
        );
        color: var(--theme-text-muted);
      }
    }

    &.recording .hotkey-input {
      border-color: var(--theme-primary);
      box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.2);
    }
  }

  .hotkey-input {
    width: 100%;
    padding: 6px 12px;
    border: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));
    border-radius: 6px;
    font-size: 0.9rem;
    background-color: rgba(
      var(--theme-background-rgb),
      var(--theme-transparency-background)
    );
    color: var(--theme-text);
    cursor: pointer;
    text-align: center;

    &:focus {
      outline: none;
      border-color: var(--theme-primary);
      box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.2);
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  .edit-icon,
  .delete-icon {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.8rem;
    cursor: pointer;
  }

  .edit-icon {
    color: var(--theme-primary);

    &:hover {
      color: var(--theme-primary-dark);
    }
  }

  .delete-icon {
    color: var(--theme-text-muted);

    &:hover {
      color: var(--theme-error);
    }

    &.disabled {
      cursor: not-allowed;
      opacity: 0.5;

      &:hover {
        color: var(--theme-text-muted);
      }
    }
  }
}
</style>
