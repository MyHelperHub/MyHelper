<template>
  <div class="login-section">
    <Button 
      :label="props.userData.token ? '注销' : '登录/注册'" 
      @click="handleLogin" 
    />
  </div>
  <Dialog
    v-model:visible="showModal"
    modal
    :header="isRegisterMode ? '注册' : '登录'"
    :style="{ width: '350px' }"
    position="center">
    <div class="login-content">
      <div v-if="isRegisterMode" class="form-item">
        <FloatLabel variant="on">
          <InputText
            id="username"
            v-model="registerFormData.username"
            autocomplete="off"
            :invalid="submitted && !registerFormData.username.trim()"
            @keyup.enter="handleSubmit" />
          <label for="username">用户名</label>
        </FloatLabel>
      </div>

      <div class="form-item">
        <FloatLabel variant="on">
          <InputText
            id="email"
            v-model="registerFormData.email"
            autocomplete="off"
            :invalid="submitted && (!registerFormData.email.trim() || (isRegisterMode && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerFormData.email)))"
            @keyup.enter="handleSubmit" />
          <label for="email">邮箱</label>
        </FloatLabel>
      </div>

      <div class="form-item">
        <FloatLabel variant="on">
          <Password
            id="password"
            v-model="registerFormData.password"
            autocomplete="off"
            :feedback="false"
            :toggleMask="true"
            :invalid="submitted && !registerFormData.password.trim()"
            @keyup.enter="handleSubmit" />
          <label for="password">密码</label>
        </FloatLabel>
      </div>

      <div v-if="isRegisterMode" class="form-item">
        <FloatLabel variant="on">
          <Password
            id="confirmPassword"
            v-model="registerFormData.confirmPassword"
            autocomplete="off"
            :feedback="false"
            :toggleMask="true"
            :invalid="
              submitted &&
              isRegisterMode &&
              (!registerFormData.confirmPassword.trim() ||
                registerFormData.password !== registerFormData.confirmPassword)
            "
            @keyup.enter="handleSubmit" />
          <label for="confirmPassword">确认密码</label>
        </FloatLabel>
      </div>

      <div class="form-footer">
        <Button
          :label="isRegisterMode ? '注册' : '登录'"
          @click="handleSubmit"
          :submitLoading="submitLoading"
          :disabled="submitLoading" />

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
import { getUserConfig, setUserConfig } from "@/utils/user";
import {  RegisterForm, User } from "@/interface/user";

const props = defineProps<{
  userData: User;
}>();
const emit = defineEmits(["update:userData"]);

const showModal = ref(false);
const submitLoading = ref(false);
const isRegisterMode = ref(false);


const registerFormData = ref<RegisterForm>({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const submitted = ref(false);

const validateForm = () => {
  if (isRegisterMode.value) {
    if (!registerFormData.value.username.trim() || 
        !registerFormData.value.email.trim() || 
        !registerFormData.value.password.trim() ||
        !registerFormData.value.confirmPassword.trim()) {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerFormData.value.email)) {
      return false;
    }
    if (registerFormData.value.password !== registerFormData.value.confirmPassword) {
      return false;
    }
  } else {
    if (!registerFormData.value.email.trim() || !registerFormData.value.password.trim()) {
      return false;
    }
  }
  return true;
};

const handleSubmit = async () => {
  submitted.value = true;
  if (!validateForm()) return;

  submitLoading.value = true;
  try {
    if (isRegisterMode.value) {
      // 调用注册 API
      // await register(formData.value);
      showMessage("注册成功!", 3000, 1);
    } else {
      // 调用登录 API
      await login(registerFormData.value.username, registerFormData.value.password).then(
        (res) => {
          showMessage(`${res.username}, 欢迎回来!`, 3000, 1);
          setUserConfig([], res as User);
          emit("update:userData");
        },
      );
      console.log(await getUserConfig([]));
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
    submitLoading.value = false;
  }
};

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value;
  submitted.value = false;
  resetForm();
};

const handleForgotPassword = () => {
  // 处理忘记密码逻辑
  showMessage("忘记密码功能开发中...", 3000, 2);
};

const openModal = () => {
  showModal.value = true;
  isRegisterMode.value = false;
  submitted.value = false;
  resetForm();
};

const closeModal = () => {
  showModal.value = false;
};

const resetForm = () => {
  registerFormData.value = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  };
};

const handleLogin = async () => {
  if (props.userData.token) {
    // 注销逻辑
    try {
      await setUserConfig([], {});
      showMessage("注销成功!", 3000, 1);
      emit("update:userData");
    } catch (error) {
      showMessage("注销失败，请重试!", 3000, 2);
    }
  } else {
    // 打开登录弹窗
    openModal();
  }
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
