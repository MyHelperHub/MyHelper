<template>
  <div class="plugin-container">
    <Toast />
    <ConfirmDialog />
    
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <div class="menu-header">
        <Button 
          icon="pi pi-arrow-left" 
          class="p-button-text p-button-sm back-button" 
          @click="goBack"
        />
        <span>插件管理</span>
      </div>
      <div class="menu-items">
        <div 
          v-for="item in menuItems" 
          :key="item.key"
          class="menu-item" 
          :class="{ active: activeMenu === item.key }"
          @click="handleMenuClick(item.key as MenuKey)"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="content-header">
        <h2>{{ menuTitles[activeMenu] }}</h2>
        <Button 
          v-if="activeMenu === 'my-plugins'"
          label="上传插件" 
          icon="pi pi-upload"
          @click="showUploadDialog = true"
        />
      </div>

      <!-- 我的插件 -->
      <DataTable 
        v-if="activeMenu === 'my-plugins'"
        :value="plugins" 
        :loading="loading"
        v-model:selection="selectedPlugins"
        class="content-table"
      >
        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <Column field="name" header="插件名称">
          <template #body="{ data }">
            <div class="plugin-name">
              <span>{{ data.name }}</span>
              <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
            </div>
          </template>
        </Column>
        <Column field="version" header="版本" style="width: 100px"></Column>
        <Column field="downloads" header="下载次数" style="width: 100px"></Column>
        <Column field="updateTime" header="更新时间" style="width: 150px">
          <template #body="{ data }">
            {{ formatDate(data.updateTime) }}
          </template>
        </Column>
        <Column header="操作" style="width: 150px">
          <template #body="{ data }">
            <Button 
              icon="pi pi-pencil" 
              class="p-button-text" 
              @click="editPlugin(data)"
              v-tooltip.top="'编辑插件'"
            />
            <Button 
              icon="pi pi-trash" 
              class="p-button-text p-button-danger" 
              @click="confirmDelete(data)"
              v-tooltip.top="'删除插件'"
            />
          </template>
        </Column>
      </DataTable>

      <!-- 上传记录 -->
      <DataTable 
        v-if="activeMenu === 'upload-history'"
        :value="uploadHistory" 
        :loading="loading"
        class="content-table"
      >
        <Column field="name" header="插件名称"></Column>
        <Column field="version" header="版本"></Column>
        <Column field="uploadTime" header="上传时间">
          <template #body="{ data }">
            {{ formatDate(data.uploadTime) }}
          </template>
        </Column>
        <Column field="status" header="状态">
          <template #body="{ data }">
            <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
          </template>
        </Column>
        <Column field="message" header="备注"></Column>
        <Column header="操作" style="width: 150px">
          <template #body="{ data }">
            <Button 
              icon="pi pi-pencil" 
              class="p-button-text" 
              @click="editPlugin(data)"
              v-tooltip.top="'编辑记录'"
            />
            <Button 
              icon="pi pi-trash" 
              class="p-button-text p-button-danger" 
              @click="confirmDelete(data)"
              v-tooltip.top="'删除记录'"
            />
          </template>
        </Column>
      </DataTable>

      <!-- 草稿箱 -->
      <DataTable 
        v-if="activeMenu === 'drafts'"
        :value="drafts" 
        :loading="loading"
        class="content-table"
      >
        <Column field="name" header="插件名称"></Column>
        <Column field="version" header="版本"></Column>
        <Column field="updateTime" header="最后修改时间">
          <template #body="{ data }">
            {{ formatDate(data.updateTime) }}
          </template>
        </Column>
        <Column header="操作" style="width: 150px">
          <template #body="{ data }">
            <Button 
              icon="pi pi-pencil" 
              class="p-button-text" 
              @click="editPlugin(data)"
              v-tooltip.top="'编辑草稿'"
            />
            <Button 
              icon="pi pi-trash" 
              class="p-button-text p-button-danger" 
              @click="confirmDelete(data)"
              v-tooltip.top="'删除草稿'"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- 上传插件对话框 -->
    <Dialog 
      v-model:visible="showUploadDialog" 
      header="上传插件" 
      :modal="true"
      :style="{ width: '80vw' }"
      class="upload-dialog"
    >
      <div class="upload-form">
        <div class="upload-area" @drop.prevent="handleDrop" @dragover.prevent>
          <input 
            type="file" 
            ref="fileInput" 
            accept=".zip"
            style="display: none" 
            @change="handleFileSelect"
          >
          <div class="upload-placeholder" @click="triggerFileInput">
            <i class="pi pi-upload"></i>
            <p>点击或拖拽上传插件包 (.zip)</p>
            <small>支持 10MB 以内的 zip 文件</small>
          </div>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label>插件名称</label>
            <InputText v-model="pluginForm.name" placeholder="请输入插件名称" />
          </div>
          <div class="form-group">
            <label>插件描述</label>
            <Textarea v-model="pluginForm.description" rows="3" placeholder="请输入插件描述" />
          </div>
          <div class="form-group">
            <label>版本号</label>
            <InputText v-model="pluginForm.version" placeholder="例如: 1.0.0" />
          </div>
          <div class="form-group">
            <label>标签</label>
            <Chips v-model="pluginForm.tags" placeholder="输入标签后按回车" />
          </div>
        </div>

        <div class="dialog-footer">
          <Button label="取消" class="p-button-text" @click="closeUploadDialog" />
          <Button label="上传" @click="submitPlugin" :loading="uploading" />
        </div>
      </div>
    </Dialog>

    <!-- 编辑对话框 -->
    <Dialog 
      v-model:visible="showEditDialog" 
      header="编辑插件" 
      :modal="true"
      :style="{ width: '80vw' }"
      class="edit-dialog"
    >
      <div class="upload-form">
        <div class="form-section">
          <div class="form-group">
            <label>插件名称</label>
            <InputText v-model="pluginForm.name" placeholder="请输入插件名称" />
          </div>
          <div class="form-group">
            <label>插件描述</label>
            <Textarea v-model="pluginForm.description" rows="3" placeholder="请输入插件描述" />
          </div>
          <div class="form-group">
            <label>版本号</label>
            <InputText v-model="pluginForm.version" placeholder="例如: 1.0.0" />
          </div>
          <div class="form-group">
            <label>标签</label>
            <Chips v-model="pluginForm.tags" placeholder="输入标签后按回车" />
          </div>
        </div>

        <div class="dialog-footer">
          <Button label="取消" class="p-button-text" @click="closeEditDialog" />
          <Button label="保存" @click="updatePlugin" :loading="uploading" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Button from 'primevue/button'; 
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Chips from 'primevue/chips';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import { useRouter } from 'vue-router';


const toast = useToast();
const confirm = useConfirm();
type MenuKey = 'my-plugins' | 'upload-history' | 'drafts';
const activeMenu = ref<MenuKey>('my-plugins');
const showUploadDialog = ref(false);
const loading = ref(false);
const uploading = ref(false);
const selectedPlugins = ref([]);

// 菜单配置
const menuItems = [
  { key: 'my-plugins', label: '我的插件', icon: 'pi pi-list' },
  { key: 'upload-history', label: '上传记录', icon: 'pi pi-history' },
  { key: 'drafts', label: '草稿箱', icon: 'pi pi-file' }
];

const menuTitles = {
  'my-plugins': '我的插件',
  'upload-history': '上传记录',
  'drafts': '草稿箱'
};

// 模拟数据
const plugins = ref([
  {
    id: 1,
    name: "代码格式化工具",
    description: "一个强大的代码格式化工具，支持多种编程语言。",
    version: "1.0.0",
    status: "已发布",
    downloads: 12580,
    updateTime: "2024-03-20",
    author: "JohnDoe"
  },
  {
    id: 2,
    name: "截图工具Pro",
    description: "专业的屏幕截图工具，支持区域截图、滚动截图。",
    version: "1.1.0",
    status: "审核中",
    downloads: 4567,
    updateTime: "2024-03-15",
    author: "Jane Smith"
  },
  {
    id: 3,
    name: "网络测大师",
    description: "准确测试网络速度，支持多节点测速。",
    version: "1.0.0",
    status: "已驳回",
    downloads: 3456,
    updateTime: "2024-03-10",
    author: "NetMaster"
  }
]);

const uploadHistory = ref([
  {
    id: 1,
    name: "代码格式化工具",
    version: "1.0.0",
    uploadTime: "2024-03-20 14:30:00",
    status: "成功",
    message: "上传成功"
  },
  {
    id: 2,
    name: "代码格式化工具",
    version: "0.9.0",
    uploadTime: "2024-03-19 10:20:00",
    status: "失败",
    message: "验证未通过"
  },
  {
    id: 3,
    name: "截图工具Pro",
    version: "1.1.0",
    uploadTime: "2024-03-15 16:45:00",
    status: "处理中",
    message: "正在处理"
  }
]);

const drafts = ref([
  {
    id: 1,
    name: "文件同步助手",
    description: "自动同步文件到多个设备。",
    version: "0.1.0",
    updateTime: "2024-03-18"
  },
  {
    id: 2,
    name: "系统监控工具",
    description: "监控系统资源使用情况。",
    version: "0.2.0",
    updateTime: "2024-03-16"
  }
]);

// 上传表单
const fileInput = ref<HTMLInputElement | null>(null);
const pluginForm = ref({
  name: '',
  description: '',
  version: '',
  tags: [] as string[],
  file: null as File | null
});

// 工具函数
const formatDate = (date: string) => {
  return new Date(date).toLocaleString();
};

const getStatusSeverity = (status: string) => {
  const map: Record<string, string> = {
    '已发布': 'success',
    '审核中': 'warning',
    '已驳回': 'danger',
    '成功': 'success',
    '失败': 'danger',
    '处理中': 'warning'
  };
  return map[status] || 'info';
};

// 数据加载函数
const loadData = () => {
  loading.value = true;
  try {
    // 直接使用模拟数据,不发送请求
    switch (activeMenu.value) {
      case 'my-plugins':
        // 使用已有的模拟数据
        break;
      case 'upload-history':
        // 使用已有的模拟数据
        break;
      case 'drafts':
        // 使用已有的模拟数据
        break;
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: '错误', detail: '加载数据失败' });
  } finally {
    loading.value = false;
  }
};

// 上传相关函数
const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    handleFile(input.files[0]);
  }
};

const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  if (files?.length) {
    handleFile(files[0]);
  }
};

const handleFile = (file: File) => {
  if (!file.name.endsWith('.zip')) {
    toast.add({ severity: 'error', summary: '格式错误', detail: '请上传 .zip 格式的文件' });
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.add({ severity: 'error', summary: '文件过大', detail: '文件大小不能超过10MB' });
    return;
  }
  pluginForm.value.file = file;
  toast.add({ severity: 'success', summary: '文件已选择', detail: file.name });
};

const closeUploadDialog = () => {
  showUploadDialog.value = false;
  pluginForm.value = {
    name: '',
    description: '',
    version: '',
    tags: [],
    file: null
  };
};

const submitPlugin = async () => {
  if (!pluginForm.value.file) {
    toast.add({ severity: 'error', summary: '错误', detail: '请选择插件文件' });
    return;
  }
  
  uploading.value = true;
  try {
    // 模拟上传成功
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 添加到模拟数据中
    plugins.value.unshift({
      id: plugins.value.length + 1,
      name: pluginForm.value.name,
      description: pluginForm.value.description,
      version: pluginForm.value.version,
      status: "审核中",
      downloads: 0,
      updateTime: new Date().toISOString(),
      author: "当前用户"
    });

    toast.add({ severity: 'success', summary: '成功', detail: '插件上传成功' });
    closeUploadDialog();
  } catch (error) {
    toast.add({ severity: 'error', summary: '错误', detail: '插件上传失败' });
  } finally {
    uploading.value = false;
  }
};

const confirmDelete = (plugin: any) => {
  confirm.require({
    message: `确定要删除插件 "${plugin.name}" 吗？`,
    header: '删除确认',
    icon: 'pi pi-exclamation-triangle',
    accept: () => deletePlugin(plugin),
  });
};

const deletePlugin = async (plugin: any) => {
  try {
    // 模拟删除延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 从数组中移除
    const index = plugins.value.findIndex(p => p.id === plugin.id);
    if (index > -1) {
      plugins.value.splice(index, 1);
    }
    
    toast.add({ severity: 'success', summary: '成功', detail: '插件已删除' });
  } catch (error) {
    toast.add({ severity: 'error', summary: '错误', detail: '删除插件失败' });
  }
};

const handleMenuClick = (menuKey: MenuKey) => {
  activeMenu.value = menuKey;
  loadData(); // 切换菜单时加载数据
};

// 初始化时加载数据
onMounted(() => {
  loadData();
});

// 添加编辑相关的状态
const showEditDialog = ref(false);
const editingPlugin = ref<any>(null);

// 修改编辑函数
const editPlugin = (plugin: any) => {
  editingPlugin.value = { ...plugin };  // 创建副本避免直接修改
  pluginForm.value = {
    name: plugin.name,
    description: plugin.description,
    version: plugin.version,
    tags: plugin.tags || [],
    file: null
  };
  showEditDialog.value = true;
};

// 加更新函数
const updatePlugin = async () => {
  if (!editingPlugin.value) return;
  
  uploading.value = true;
  try {
    // 模拟更新延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 更新本地数据
    const index = plugins.value.findIndex(p => p.id === editingPlugin.value.id);
    if (index > -1) {
      plugins.value[index] = {
        ...plugins.value[index],
        name: pluginForm.value.name,
        description: pluginForm.value.description,
        version: pluginForm.value.version,
        status: plugins.value[index].status,
        downloads: plugins.value[index].downloads,
        updateTime: plugins.value[index].updateTime,
        author: plugins.value[index].author
      };
    }

    toast.add({ severity: 'success', summary: '成功', detail: '插件更新成功' });
    showEditDialog.value = false;
  } catch (error) {
    toast.add({ severity: 'error', summary: '错误', detail: '插件更新失败' });
  } finally {
    uploading.value = false;
  }
};

// 添加关闭编辑对话框函数
const closeEditDialog = () => {
  showEditDialog.value = false;
  editingPlugin.value = null;
  pluginForm.value = {
    name: '',
    description: '',
    version: '',
    tags: [],
    file: null
  };
};

const router = useRouter();

const goBack = () => {
  router.back();
};
</script>

<style scoped lang="less">
.plugin-container {
  display: flex;
  min-height: 100vh;
  background-color: #fff;

  .sidebar {
    width: 240px;
    background: #ffffff;
    border-right: 1px solid #e4e4e4;
    padding: 1rem 0;

    .menu-header {
      display: flex;
      align-items: center;
      padding: 1rem 1.5rem;
      font-size: 1.2rem;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 1px solid #e4e4e4;
      margin-bottom: 0.5rem;

      .back-button {
        padding: 0.3rem;
        margin-right: 0.5rem;
        
        &:hover {
          background: #f0f7ff;
        }
      }

      span {
        flex: 1;
      }
    }

    .menu-items {
      .menu-item {
        display: flex;
        align-items: center;
        padding: 0.875rem 1.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #666;
        margin: 0.2rem 0.5rem;
        border-radius: 6px;

        i {
          margin-right: 0.75rem;
          font-size: 1.1rem;
        }

        &:hover {
          background: #f0f7ff;
          color: var(--primary-color);
        }

        &.active {
          background: #f0f7ff;
          color: var(--primary-color);
          font-weight: 500;
          border-left: 3px solid var(--primary-color);
        }
      }
    }
  }

  .main-content {
    flex: 1;
    padding: 2rem;
    background: #ffffff;

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h2 {
        margin: 0;
        font-weight: 600;
        color: #2c3e50;
      }
    }

    .content-table {
      border: 1px solid #e4e4e4;
      border-radius: 8px;
      overflow: hidden;
    }
  }
}

.upload-dialog {
  :deep(.p-dialog-content) {
    padding: 2rem;
  }
}

.upload-form {
  .upload-area {
    border: 2px dashed var(--surface-border);
    border-radius: 8px;
    padding: 2rem;
    margin-bottom: 2rem;
    
    .upload-placeholder {
      text-align: center;
      cursor: pointer;
      
      i {
        font-size: 2rem;
        color: var(--primary-color);
        margin-bottom: 1rem;
      }
      
      p {
        margin: 0.5rem 0;
        color: var(--text-color);
      }
      
      small {
        color: var(--text-color-secondary);
      }
    }
  }

  .form-section {
    .form-group {
      margin-bottom: 1.5rem;
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      
      :deep(.p-inputtext) {
        width: 100%;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }
}

.plugin-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
