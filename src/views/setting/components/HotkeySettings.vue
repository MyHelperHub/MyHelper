<template>
  <div class="hotkey-settings-container">
    <div v-if="modelValue.enabled" class="hotkey-settings">
      <div v-for="(item, key) in hotkeyItems" :key="key" class="hotkey-section">
        <div class="hotkey-item">
          <div class="hotkey-info">
            <h4>{{ item.title }}</h4>
            <div class="hotkey-input-container" :class="{
              'disabled': !modelValue[key]?.enabled,
              'recording': recording && activeKey === key
            }">
              <input class="hotkey-input" :value="recording && activeKey === key ? tempKey : modelValue[key]?.key"
                readonly @focus="handleInputClick(key)" @blur="cancelRecording" @keydown="captureHotkey($event)"
                placeholder="点击输入快捷键" :disabled="!modelValue[key]?.enabled"
                :ref="el => { if (key === activeKey) activeInputRef = el as HTMLInputElement }" />
              <i v-if="recording && activeKey === key" class="pi pi-times edit-icon" @click.stop="cancelRecording"></i>
              <i v-else class="pi pi-trash delete-icon" @click.stop="clearHotkey(key)"
                :class="{ 'disabled': !modelValue[key]?.enabled }"></i>
            </div>
          </div>
          <ToggleSwitch v-model="modelValue[key].enabled" class="mini-switch"
            @change="updateHotkey(`${key}.enabled`, modelValue[key].enabled)">
            <template #handle="{ checked }">
              <i :class="['!text-xs pi', { 'pi-check': checked, 'pi-times': !checked }]"></i>
            </template>
          </ToggleSwitch>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ToggleSwitch from "primevue/toggleswitch";
import { showMessage } from "@/utils/message";
import { ref } from "vue";
import { delay } from "@/utils/common";
import { HotkeyConfig } from "@/interface/database";

// 快捷键项目配置
const hotkeyItems = {
  togglePanel: { title: '打开/关闭面板' },
  toggleProxy: { title: '打开/关闭系统代理' }
};


const props = defineProps<{
  modelValue: HotkeyConfig;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: HotkeyConfig): void;
  (e: 'change', key: string, value: any): void;
}>();

// 当前正在录制状态
const recording = ref(false);
// 当前活动的键(正在录制的键)
const activeKey = ref<string | null>(null);
// 当前活动输入框引用
const activeInputRef = ref<HTMLInputElement | null>(null);
// 临时按键值
const tempKey = ref("");

// 更新快捷键设置
const updateHotkey = (path: string, value: any) => {
  emit('change', path, value);
};

// 处理输入框点击
const handleInputClick = (key: string) => {
  if (!props.modelValue[key]?.enabled) return;

  // 如果已经在录制其他键，先取消
  if (recording.value && activeKey.value !== key) {
    cancelRecording();
  }

  // 如果点击的是当前正在录制的键，则取消录制
  if (recording.value && activeKey.value === key) {
    cancelRecording();
    return;
  }

  // 开始录制新键
  recording.value = true;
  activeKey.value = key;
  // 设置临时键为当前已有的值，而不是清空
  tempKey.value = props.modelValue[key]?.key || "";
};

// 取消录制
const cancelRecording = () => {
  recording.value = false;
  activeKey.value = null;
  tempKey.value = "";
};

// 清空快捷键
const clearHotkey = (key: string) => {
  if (!props.modelValue[key]?.enabled) return;

  const updatedModel = JSON.parse(JSON.stringify(props.modelValue));
  updatedModel[key].key = "";

  emit('update:modelValue', updatedModel);
  emit('change', `${key}.key`, "");

  showMessage(`已清空快捷键`, 1500, 1);
};

// 捕获快捷键
const captureHotkey = async (event: KeyboardEvent) => {
  if (!recording.value || !activeKey.value || !props.modelValue[activeKey.value]?.enabled) return;

  event.preventDefault();
  event.stopPropagation();

  let modifiers = [];
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  if (event.metaKey) modifiers.push(isMac ? 'cmd' : 'win');
  if (event.ctrlKey) modifiers.push('ctrl');
  if (event.altKey) modifiers.push(isMac ? 'opt' : 'alt');
  if (event.shiftKey) modifiers.push('shift');

  // 处理单独修饰键
  if (!event.key || ['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
    tempKey.value = modifiers.length > 0 ? `${modifiers.join('+')}+` : "";
    return;
  }

  const keyName = event.key === ' ' ? 'space' : event.key.toLowerCase();

  // 确保至少有一个修饰键
  if (modifiers.length === 0) {
    tempKey.value = ""; // 清空临时显示
    showMessage(`请使用组合键（${isMac ? 'Command/Option/Ctrl' : 'Ctrl/Alt/Shift'} + 其他键）`, 1500, 2);
    return;
  }

  const hotkey = `${modifiers.join('+')}+${keyName}`;

  // 更新临时显示
  tempKey.value = hotkey;

  // 更新模型
  const updatedModel = JSON.parse(JSON.stringify(props.modelValue));
  updatedModel[activeKey.value].key = hotkey;

  emit('update:modelValue', updatedModel);
  emit('change', `${activeKey.value}.key`, hotkey);

  showMessage(`已设置快捷键: ${hotkey}`, 1500, 1);

  await delay(300).then(() => {
    // 使用引用直接访问当前输入框并使其失焦
    if (activeInputRef.value) {
      activeInputRef.value.blur();
    }

    // 取消录制状态
    cancelRecording();
  });
};
</script>

<style lang="less" scoped>
.hotkey-settings-container {
  margin-top: 10px;
}

.hotkey-settings {
  margin-left: 0;
  padding-left: 0;
}

.hotkey-section {
  margin-bottom: 15px;
}

.hotkey-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 8px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }

  .hotkey-info {
    display: flex;
    align-items: center;
    flex: 1;

    h4 {
      font-size: 0.9rem;
      font-weight: normal;
      color: #555;
      width: 140px;
      margin: 0;
    }
  }

  .mini-switch {
    transform: scale(0.75);
  }
}

.hotkey-input-container {
  position: relative;
  flex: 1;
  margin: 0 10px;

  &.disabled {
    opacity: 0.7;

    .hotkey-input {
      background-color: #f0f0f0;
      color: #888;
    }
  }

  &.recording .hotkey-input {
    border-color: rgb(74, 159, 238);
    box-shadow: 0 0 0 2px rgba(74, 159, 238, 0.2);
  }
}

.hotkey-input {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: #f9f9f9;
  cursor: pointer;
  text-align: center;

  &:focus {
    outline: none;
    border-color: rgb(74, 159, 238);
    box-shadow: 0 0 0 2px rgba(74, 159, 238, 0.2);
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
  color: rgb(74, 159, 238);

  &:hover {
    color: rgb(0, 132, 255);
  }
}

.delete-icon {
  color: #999;

  &:hover {
    color: #ff6b6b;
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      color: #999;
    }
  }
}

:deep(.p-toggleswitch.p-component) {
  &.p-toggleswitch-checked {
    .p-toggleswitch-slider {
      background: rgb(74, 159, 238);
    }

    &:hover .p-toggleswitch-slider {
      background: rgb(0, 132, 255);
    }
  }
}
</style>
