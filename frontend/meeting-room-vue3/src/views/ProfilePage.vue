<template>
  <div class="profile-page">
    <div class="page-header">
      <h2>个人信息</h2>
      <p>管理您的个人信息</p>
    </div>
    
    <a-row :gutter="24">
      <a-col :span="12">
        <a-card title="基本信息" class="profile-card">
          <a-form :model="profileForm" layout="vertical">
            <a-form-item label="用户名">
              <a-input v-model:value="profileForm.username" disabled />
            </a-form-item>
            <a-form-item label="昵称">
              <a-input v-model:value="profileForm.nickname" placeholder="请输入昵称" />
            </a-form-item>
            <a-form-item label="邮箱">
              <a-input v-model:value="profileForm.email" placeholder="请输入邮箱" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="updateProfile" :loading="profileLoading">
                更新信息
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
      
      <a-col :span="12">
        <a-card title="修改密码" class="profile-card">
          <a-form :model="passwordForm" layout="vertical">
            <a-form-item label="当前密码">
              <a-input-password v-model:value="passwordForm.currentPassword" placeholder="请输入当前密码" />
            </a-form-item>
            <a-form-item label="新密码">
              <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码" />
            </a-form-item>
            <a-form-item label="确认新密码">
              <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请确认新密码" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="updatePassword" :loading="passwordLoading">
                修改密码
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import api from '@/config'

interface Props {
  user: any
  onProfileUpdate: (token: string, updatedUser: any) => void
}

const props = defineProps<Props>()

const profileLoading = ref(false)
const passwordLoading = ref(false)

const profileForm = reactive({
  username: '',
  nickname: '',
  email: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const updateProfile = async () => {
  try {
    profileLoading.value = true
    const res = await api.put('/user/profile', { nickname: profileForm.nickname })
    // 更新本地用户信息
    props.onProfileUpdate(res.data.token, res.data.user)
    message.success('个人信息更新成功')
  } catch (e: any) {
    message.error(e.response?.data?.error || '更新失败')
  } finally {
    profileLoading.value = false
  }
}

const updatePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    message.error('两次输入的密码不一致')
    return
  }
  
  try {
    passwordLoading.value = true
    await api.put('/user/password', {
      old_password: passwordForm.currentPassword,
      new_password: passwordForm.newPassword
    })
    message.success('密码修改成功')
    
    // 清空密码表单
    Object.assign(passwordForm, {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  } catch (e: any) {
    message.error(e.response?.data?.error || '密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  if (props.user) {
    Object.assign(profileForm, {
      username: props.user.username || '',
      nickname: props.user.nickname || '',
      email: props.user.email || ''
    })
  }
})
</script>

<style scoped>
.profile-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
  text-align: center;
}

.page-header h2 {
  margin-bottom: 8px;
  color: #333;
}

.page-header p {
  color: #666;
  margin: 0;
}

.profile-card {
  height: 100%;
}
</style> 