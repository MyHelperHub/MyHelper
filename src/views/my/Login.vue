<template>
  <div class="login-section">
    <Button
      :label="userData?.Token ? '注销' : '登录/注册'"
      @click="handleLogin" />
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
            v-model="userData.Username"
            autocomplete="off"
            :invalid="submitted && !userData.Username.trim()"
            @keyup.enter="handleSubmit" />
          <label for="username">用户名</label>
        </FloatLabel>
      </div>

      <div class="form-item">
        <FloatLabel variant="on">
          <InputText
            id="email"
            v-model="userData.Email"
            autocomplete="off"
            :invalid="
              submitted &&
              (!userData.Email.trim() ||
                (isRegisterMode &&
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.Email)))
            "
            @keyup.enter="handleSubmit" />
          <label for="email">邮箱</label>
        </FloatLabel>
      </div>

      <div class="form-item">
        <FloatLabel variant="on">
          <Password
            id="password"
            v-model="userData.Password"
            autocomplete="off"
            :feedback="false"
            :toggleMask="true"
            :invalid="submitted && !userData.Password?.trim()"
            @keyup.enter="handleSubmit" />
          <label for="password">密码</label>
        </FloatLabel>
      </div>

      <div v-if="isRegisterMode" class="form-item">
        <FloatLabel variant="on">
          <Password
            id="confirmPassword"
            v-model="userData.ConfirmPassword"
            autocomplete="off"
            :feedback="false"
            :toggleMask="true"
            :invalid="
              submitted &&
              isRegisterMode &&
              (!userData.ConfirmPassword?.trim() ||
                userData.Password !== userData.ConfirmPassword)
            "
            @keyup.enter="handleSubmit" />
          <label for="confirmPassword">确认密码</label>
        </FloatLabel>
      </div>

      <div class="form-footer">
        <Button
          :label="isRegisterMode ? '注册' : '登录'"
          @click="handleSubmit"
          :loading="submitLoading"
          :disabled="submitLoading" />

        <div class="form-links">
          <span class="link" @click="toggleMode">
            {{ isRegisterMode ? "已有账号？去登录" : "没有账号？去注册" }}
          </span>
          <span
            v-if="!isRegisterMode"
            class="link"
            @click="handleForgotPassword">
            忘记密码?
          </span>
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
import { login, register } from "@/api/network/user.api";
import { showMessage } from "@/composables/message.ts";
import { setUserConfig } from "@/utils/user";
import { User, UserForm } from "@/types/user";
import GlobalData from "@/utils/globalData";
import { ResponseCodeEnum } from "@/types/enum";
import { tokenManager } from "@/utils/tokenManager";

const userData = ref<UserForm>({
  UserId: -1,
  Username: "",
  Email: "",
  Password: "",
  ConfirmPassword: "",
  Avatar: "",
  Token: "",
});
const showModal = ref(false);
const submitLoading = ref(false);
const isRegisterMode = ref(false);

const init = async () => {
  userData.value = (await GlobalData.get("userInfo")) as unknown as User;
};
init();

const submitted = ref(false);

const validateForm = () => {
  if (isRegisterMode.value) {
    if (
      !userData.value.Username.trim() ||
      !userData.value.Email.trim() ||
      !userData.value.Password?.trim() ||
      !userData.value.ConfirmPassword?.trim()
    ) {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.value.Email)) {
      return false;
    }
    if (userData.value.Password !== userData.value.ConfirmPassword) {
      return false;
    }
  } else {
    if (!userData.value.Email.trim() || !userData.value.Password?.trim()) {
      return false;
    }
  }
  return true;
};

// 处理登录逻辑
const handleLoginSubmit = async () => {
  submitLoading.value = true;
  try {
    const res = await login({
      Email: userData.value.Email,
      Password: userData.value.Password as string,
    });

    if (res.Code === ResponseCodeEnum.SUCCESS) {
      userData.value = { ...res.Data.UserInfo, Token: res.Data.Token };
      await setUserConfig(userData.value);
      await GlobalData.set("userInfo", userData.value);
      await tokenManager.setToken(res.Data.Token, res.Data.UserInfo);
      showMessage(`${userData.value.Username}, 欢迎回来!`, 3000, 1);
      closeModal();
    } else {
      showMessage(res.Message, 3000, 2);
    }
  } finally {
    submitLoading.value = false;
  }
};

// 处理注册逻辑
const handleRegisterSubmit = async () => {
  submitLoading.value = true;
  try {
    // 调用注册 API
    const { Code, Message } = await register({
      Username: userData.value.Username,
      Email: userData.value.Email,
      Password: userData.value.Password as string,
    });
    if (Code === ResponseCodeEnum.SUCCESS) {
      showMessage("注册成功!", 4500, 1);
      // 切换到登录
      isRegisterMode.value = false;
      submitted.value = false;
      resetForm();
    } else {
      showMessage(Message, 3000, 2);
    }
  } finally {
    submitLoading.value = false;
  }
};

// 修改原有的 handleSubmit
const handleSubmit = async () => {
  submitted.value = true;
  if (!validateForm()) return;

  if (isRegisterMode.value) {
    await handleRegisterSubmit();
  } else {
    await handleLoginSubmit();
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
  userData.value = {
    UserId: -1,
    Username: "",
    Email: "",
    Password: "",
    ConfirmPassword: "",
    Avatar: "",
    Token: "",
  };
};

const handleLogin = async () => {
  if (userData.value?.Token) {
    // 注销逻辑
    try {
      await setUserConfig({});
      await GlobalData.set("userInfo", {} as User);
      await tokenManager.clearToken();
      userData.value = {} as User;
      showMessage("注销成功!", 3000, 1);
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

      .link {
        color: var(--theme-primary);
        cursor: pointer;

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
