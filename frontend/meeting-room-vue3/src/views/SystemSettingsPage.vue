<template>
  <div class="system-settings-page">
    <div class="page-header">
      <h2>系统设置</h2>
      <p>管理系统设置和用户</p>
    </div>
    <!-- 系统设置表单 -->
    <a-card title="基本设置" style="margin-bottom: 24px;">
      <a-form :model="settingsForm" layout="vertical">
        <a-form-item label="系统名称">
          <a-input v-model:value="settingsForm.systemName" />
        </a-form-item>
        <a-form-item label="允许注册">
          <a-switch v-model:checked="settingsForm.allowRegister" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="saveSettings" :loading="settingsLoading">
            保存设置
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
    <!-- 用户管理表格 -->
    <a-card title="用户管理">
      <a-table
        :columns="userColumns"
        :data-source="users"
        :loading="usersLoading"
        row-key="id"
        :scroll="{ x: 'max-content' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'role'">
            <a-tag :color="record.role === 'admin' ? 'red' : 'blue'">
              {{ record.role === 'admin' ? '管理员' : '普通用户' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="resetPassword(record)">
                重置密码
              </a-button>
              <a-button type="link" @click="toggleRole(record)">
                {{ record.role === 'admin' ? '取消管理员' : '设为管理员' }}
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import api from '@/config'

const activeTab = ref('settings')
const settingsLoading = ref(false)
const usersLoading = ref(false)
const users = ref<any[]>([])

const settingsForm = reactive({
  systemName: '会议室预订系统',
  allowRegister: true
})

const userColumns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
  { title: '角色', dataIndex: 'role', key: 'role' },
  { title: '操作', key: 'action' }
]

const fetchSettings = async () => {
  try {
    const res = await api.get('/admin/settings')
    Object.assign(settingsForm, res.data)
  } catch (e: any) {
    console.error('获取设置失败:', e)
  }
}

const fetchUsers = async () => {
  try {
    usersLoading.value = true
    const res = await api.get('/admin/users')
    users.value = res.data.users
  } catch (e: any) {
    message.error(e.response?.data?.error || '获取用户列表失败')
  } finally {
    usersLoading.value = false
  }
}

const saveSettings = async () => {
  try {
    settingsLoading.value = true
    await api.put('/settings', settingsForm)
    message.success('设置保存成功')
  } catch (e: any) {
    message.error(e.response?.data?.error || '保存设置失败')
  } finally {
    settingsLoading.value = false
  }
}

const resetPassword = async (user: any) => {
  try {
    await api.put('/admin/user/password', { user_id: user.id, new_password: '123456' })
    message.success(`用户 ${user.username} 密码重置成功`)
  } catch (e: any) {
    message.error(e.response?.data?.error || '重置密码失败')
  }
}

const toggleRole = async (user: any) => {
  try {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    await api.put('/admin/user/role', { user_id: user.id, role: newRole })
    message.success(`用户 ${user.username} 角色更新成功`)
    fetchUsers()
  } catch (e: any) {
    message.error(e.response?.data?.error || '更新角色失败')
  }
}

onMounted(() => {
  fetchSettings()
  fetchUsers()
})
</script>

<style scoped>
.system-settings-page {
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

.main-card {
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 4px 24px #0001;
  width: 900px;
  padding: 32px 0 24px 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
@media (max-width: 950px) {
  .main-card {
    width: 98vw;
    min-width: 0;
    padding: 16px 0 12px 0;
    border-radius: 12px;
  }
}
@media (max-width: 700px) {
  .system-settings-page,
  .main-card,
  .ant-table-wrapper {
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .ant-table-content {
    overflow-x: auto !important;
    box-sizing: border-box !important;
    padding-bottom: 2px;
  }
  .ant-table {
    min-width: 600px !important;
    box-sizing: border-box !important;
  }
}
</style> 