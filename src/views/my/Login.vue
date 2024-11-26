<template>
  <div class="login-section">
    <Button label="登录/注册" @click="openModal" />
  </div>
  <Dialog
    v-model:visible="showModal"
    modal
    :header="isRegisterMode ? '注册' : '登录'"
    :style="{ width: '350px' }"
    position="center">
    <div class="login-content">
      <div class="form-item">
        <FloatLabel variant="on">
          <InputText
            id="username"
            v-model="formData.username"
            :invalid="submitted && !formData.username.trim()"
            @keyup.enter="handleSubmit" />
          <label for="username">用户名</label>
        </FloatLabel>
      </div>

      <div class="form-item">
        <FloatLabel variant="on">
          <Password
            id="password"
            v-model="formData.password"
            :feedback="false"
            :toggleMask="true"
            :invalid="submitted && !formData.password.trim()"
            @keyup.enter="handleSubmit" />
          <label for="password">密码</label>
        </FloatLabel>
      </div>

      <div v-if="isRegisterMode" class="form-item">
        <FloatLabel variant="on">
          <Password
            id="confirmPassword"
            v-model="formData.confirmPassword"
            :feedback="false"
            :toggleMask="true"
            :invalid="
              submitted &&
              isRegisterMode &&
              (!formData.confirmPassword.trim() ||
                formData.password !== formData.confirmPassword)
            "
            @keyup.enter="handleSubmit" />
          <label for="confirmPassword">确认密码</label>
        </FloatLabel>
      </div>

      <div class="form-footer">
        <Button
          :label="isRegisterMode ? '注册' : '登录'"
          @click="handleSubmit"
          :loading="loading"
          :disabled="loading" />

        <div class="form-links">
          <a href="#" @click.prevent="toggleMode">
            {{ isRegisterMode ? "已有账号？去登录" : "没有账号？去注册" }}
          </a>
          <a
            v-if="!isRegisterMode"
            href="#"
            @click.prevent="handleForgotPassword">
            忘记密码?
          </a>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import { login } from "@/api/network/user.api";
import { showMessage } from "@/utils/message";

const showModal = ref(false);
const loading = ref(false);
const isRegisterMode = ref(false);

const formData = ref({
  username: "",
  password: "",
  confirmPassword: "",
});

const submitted = ref(false);

const validateForm = () => {
  if (!formData.value.username.trim() || !formData.value.password.trim()) {
    return false;
  }

  if (isRegisterMode.value) {
    if (
      !formData.value.confirmPassword.trim() ||
      formData.value.password !== formData.value.confirmPassword
    ) {
      return false;
    }
  }

  return true;
};

const handleSubmit = async () => {
  submitted.value = true;
  if (!validateForm()) return;

  loading.value = true;
  try {
    if (isRegisterMode.value) {
      // 调用注册 API
      // await register(formData.value);
      showMessage("注册成功!", 3000, 1);
    } else {
      // 调用登录 API
      await login(formData.value.username, formData.value.password);
      showMessage("登录成功!", 3000, 1);
    }
    closeModal();
  } catch (error) {
    showMessage(
      isRegisterMode.value
        ? "注册失败，请重试!"
        : "登录失败，请检查用户名和密码!",
      3000,
      2,
    );
  } finally {
    loading.value = false;
  }
};

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value;
  submitted.value = false;
  formData.value = {
    username: "",
    password: "",
    confirmPassword: "",
  };
};

const handleForgotPassword = () => {
  // 处理忘记密码逻辑
  showMessage("忘记密码功能开发中...", 3000, 2);
};

const openModal = () => {
  showModal.value = true;
  isRegisterMode.value = false;
  submitted.value = false;
  formData.value = {
    username: "",
    password: "",
    confirmPassword: "",
  };
};

const closeModal = () => {
  showModal.value = false;
};
</script>

<style lang="less">
.login-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-content {
  padding: 0 1rem;

  .form-item {
    margin-bottom: 1.5rem;
    padding-top: 0.75rem;

    .p-float-label,
    .p-inputtext,
    .p-password {
      width: 100%;
    }
  }

  .form-footer {
    margin-top: 1.5rem;

    .p-button {
      width: 100%;
    }

    .form-links {
      margin-top: 1rem;
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;

      a {
        color: var(--primary-color);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

.p-dialog {
  .p-dialog-header {
    padding: 1rem;
  }

  .p-dialog-content {
    padding: 0 1rem 1rem;
    overflow: visible;
  }
}
</style>
