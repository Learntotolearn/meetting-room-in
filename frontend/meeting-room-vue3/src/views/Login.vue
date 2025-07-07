<template>
  <!-- 登录/注册容器 -->
  <div class="login-container">
    <!-- 登录头部：Logo 和标题 -->
    <div class="login-header">
      <img src="/logo192.png" alt="Logo" class="login-logo" />
      <h1 class="login-title">会议室预订系统</h1>
    </div>
    
    <!-- 登录表单 -->
    <a-form
      v-if="isLogin"
      :model="loginForm"
      :rules="loginRules"
      @finish="onLoginFinish"
      class="login-form"
      layout="vertical"
    >
      <!-- 用户名输入框 -->
      <a-form-item name="username" label="用户名">
        <a-input
          v-model:value="loginForm.username"
          placeholder="请输入用户名"
          size="large"
        >
          <template #prefix>
            <UserOutlined />
          </template>
        </a-input>
      </a-form-item>
      
      <!-- 密码输入框 -->
      <a-form-item name="password" label="密码">
        <a-input-password
          v-model:value="loginForm.password"
          placeholder="请输入密码"
          size="large"
        >
          <template #prefix>
            <LockOutlined />
          </template>
        </a-input-password>
      </a-form-item>
      
      <!-- 登录按钮 -->
      <a-form-item>
        <a-button
          type="primary"
          html-type="submit"
          size="large"
          block
          :loading="loading"
        >
          登录
        </a-button>
      </a-form-item>
      
      <!-- 切换到注册模式 -->
      <div class="login-switch">
        <span>还没有账号？</span>
        <a-button type="link" @click="switchMode" style="padding: 0; height: auto">
          立即注册
        </a-button>
      </div>
    </a-form>
    
    <!-- 注册表单 -->
    <a-form
      v-else
      :model="registerForm"
      :rules="registerRules"
      @finish="onRegisterFinish"
      class="login-form"
      layout="vertical"
    >
      <!-- 用户名输入框 -->
      <a-form-item name="username" label="用户名">
        <a-input
          v-model:value="registerForm.username"
          placeholder="请输入用户名"
          size="large"
        >
          <template #prefix>
            <UserOutlined />
          </template>
        </a-input>
      </a-form-item>
      
      <!-- 密码输入框 -->
      <a-form-item name="password" label="密码">
        <a-input-password
          v-model:value="registerForm.password"
          placeholder="请输入密码"
          size="large"
        >
          <template #prefix>
            <LockOutlined />
          </template>
        </a-input-password>
      </a-form-item>
      
      <!-- 确认密码输入框 -->
      <a-form-item name="confirmPassword" label="确认密码">
        <a-input-password
          v-model:value="registerForm.confirmPassword"
          placeholder="请确认密码"
          size="large"
        >
          <template #prefix>
            <LockOutlined />
          </template>
        </a-input-password>
      </a-form-item>
      
      <!-- 注册按钮 -->
      <a-form-item>
        <a-button
          type="primary"
          html-type="submit"
          size="large"
          block
          :loading="loading"
        >
          注册
        </a-button>
      </a-form-item>
      
      <!-- 切换到登录模式 -->
      <div class="login-switch">
        <span>已有账号？</span>
        <a-button type="link" @click="switchMode" style="padding: 0; height: auto">
          立即登录
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<script setup lang="ts">
// 导入 Vue3 组合式 API
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'

// 导入 API 配置
import api from '@/config'

// 定义组件 props
interface Props {
  onLogin: () => void // 登录成功回调函数
}

const props = defineProps<Props>()

// 响应式数据
const isLogin = ref(true) // true: 登录模式，false: 注册模式
const loading = ref(false) // 加载状态

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 注册表单数据
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

// 登录表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名' }
  ],
  password: [
    { required: true, message: '请输入密码' }
  ]
}

// 注册表单验证规则
const registerRules = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, message: '用户名至少3个字符' },
    { max: 20, message: '用户名最多20个字符' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码至少6个字符' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码' },
    {
      validator: (rule: any, value: string) => {
        if (!value || registerForm.password === value) {
          return Promise.resolve()
        }
        return Promise.reject(new Error('两次输入的密码不一致'))
      }
    }
  ]
}

// 登录表单提交处理
const onLoginFinish = async (values: any) => {
  try {
    loading.value = true
    const res = await api.post('/login', values)
    localStorage.setItem('token', res.data.token) // 保存 token 到本地存储
    message.success('登录成功')
    props.onLogin() // 通知父组件登录成功
  } catch (e: any) {
    message.error(e.response?.data?.error || '登录失败')
  } finally {
    loading.value = false
  }
}

// 注册表单提交处理
const onRegisterFinish = async (values: any) => {
  try {
    loading.value = true
    const { username, password } = values
    const res = await api.post('/register', { username, password })
    localStorage.setItem('token', res.data.token) // 保存 token 到本地存储
    message.success('注册成功')
    props.onLogin() // 通知父组件登录成功
  } catch (e: any) {
    message.error(e.response?.data?.error || '注册失败')
  } finally {
    loading.value = false
  }
}

// 切换登录/注册模式
const switchMode = () => {
  isLogin.value = !isLogin.value
  // 清空表单数据
  Object.assign(loginForm, { username: '', password: '' })
  Object.assign(registerForm, { username: '', password: '', confirmPassword: '' })
}
</script>

<style scoped>
/* 登录容器样式 */
.login-container {
  max-width: 400px;
  margin: 60px auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  padding: 40px 32px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 登录头部样式 */
.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
}

/* Logo 样式 */
.login-logo {
  width: 96px;
  height: 96px;
  margin-bottom: 16px;
}

/* 标题样式 */
.login-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 0;
  color: #333;
}

/* 登录表单样式 */
.login-form {
  width: 100%;
}

/* 切换模式样式 */
.login-switch {
  text-align: center;
  margin-top: 16px;
  color: #666;
}

/* 移动端适配 */
@media (max-width: 700px) {
  .login-container {
    margin: 20px auto;
    padding: 24px 20px 20px 20px;
    border-radius: 8px;
  }
  
  .login-logo {
    width: 80px;
    height: 80px;
  }
  
  .login-title {
    font-size: 20px;
  }
}
</style> 