<template>
  <!-- 主应用容器 -->
  <div id="app">
    <div v-if="isAuthLoading" class="loading-box">
      <a-spin tip="正在验证登录状态..." />
    </div>
    <!-- 未登录状态：显示登录页面 -->
    <Login v-else-if="!isLoggedIn" :onLogin="handleLogin" />
    
    <!-- 已登录状态：顶部导航栏布局 -->
    <a-layout v-else style="min-height: 100vh;">
      <!-- 顶部导航栏 -->
      <a-layout-header class="ant-layout-header top-nav-header">
        <div class="top-nav-bar">
          <div class="nav-left">
            <img src="/logo192.png" alt="Logo" class="header-logo" />
            <span class="header-title">会议室预订系统</span>
          </div>
          <div v-if="isMobile" class="custom-mobile-menu">
            <span class="menu-icon" :class="{active: currentPage === 'home'}" @click="handleMenuClick({key: 'home'})"><HomeOutlined /></span>
            <span class="menu-icon" :class="{active: currentPage === 'booking'}" @click="handleMenuClick({key: 'booking'})"><CalendarOutlined /></span>
            <span class="menu-icon" :class="{active: currentPage === 'my-bookings'}" @click="handleMenuClick({key: 'my-bookings'})"><UnorderedListOutlined /></span>
            <span v-if="isAdmin" class="menu-icon" :class="{active: currentPage === 'room-manage'}" @click="handleMenuClick({key: 'room-manage'})"><TeamOutlined /></span>
            <span v-if="isAdmin" class="menu-icon" :class="{active: currentPage === 'booking-manage'}" @click="handleMenuClick({key: 'booking-manage'})"><ScheduleOutlined /></span>
          </div>
          <a-menu
            v-else
            mode="horizontal"
            :selectedKeys="selectedKeys"
            @click="handleMenuClick"
            class="top-menu"
          >
            <a-menu-item key="home">
              <HomeOutlined /> 首页
            </a-menu-item>
            <a-menu-item key="my-bookings">
              <UnorderedListOutlined /> 我的预订
            </a-menu-item>
            <a-menu-item key="room-manage" v-if="isAdmin">
              <TeamOutlined /> 会议室管理
            </a-menu-item>
            <a-menu-item key="booking-manage" v-if="isAdmin">
              <ScheduleOutlined /> 预订管理
            </a-menu-item>
          </a-menu>
          <div class="nav-right">
            <span class="user-nickname" v-if="!isMobile">{{ user?.nickname || user?.username || '用户' }}</span>
            <a-dropdown>
              <a-avatar :src="user?.avatar" class="user-avatar">
                <UserOutlined />
              </a-avatar>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="profile" @click="showProfile">
                    <UserOutlined /> 个人信息
                  </a-menu-item>
                  <a-menu-item key="settings" @click="showSettings">
                    <SettingOutlined /> 系统设置
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout" @click="logout">
                    <LogoutOutlined /> 退出登录
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
            <a-button
              v-if="isMicroApp"
              type="text"
              @click="handleCloseApp"
              class="close-btn"
            >
              <CloseOutlined />
            </a-button>
          </div>
        </div>
      </a-layout-header>
      
      <!-- 内容区 -->
      <a-layout-content class="site-layout-content">
        <!-- 删除首页内容区，直接进入主页面 -->
        <RoomBookingPage
          v-if="currentPage === 'booking' || currentPage === 'home'"
          :rooms="rooms"
          :loading="roomsLoading"
        />
        <MyBookings
          v-else-if="currentPage === 'my-bookings'"
          :rooms="rooms"
          :fetchRooms="fetchRooms"
        />
        <RoomManage
          v-else-if="currentPage === 'room-manage'"
          :isAdmin="isAdmin"
          :rooms="rooms"
          :fetchRooms="fetchRooms"
          :loading="roomsLoading"
        />
        <BookingManage
          v-else-if="currentPage === 'booking-manage'"
        />
        <ProfilePage
          v-else-if="currentPage === 'profile'"
          :user="user"
          :onProfileUpdate="handleProfileUpdate"
        />
        <SystemSettingsPage
          v-else-if="currentPage === 'settings'"
        />
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
// 导入 Vue3 组合式 API
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  HomeOutlined,
  CalendarOutlined,
  SettingOutlined,
  LogoutOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  ScheduleOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'

// 导入 @dootask/tools 工具包
import {
  isMicroApp,
  getUserId,
  getThemeName,
  getLanguageName,
  isElectron,
  isEEUIApp,
  getSystemInfo,
  getUserInfo,
  appReady,
  closeApp
} from '@dootask/tools'

// 导入 API 配置
import api from '@/config'

// 导入页面组件
import Login from '@/views/Login.vue'
import RoomBookingPage from '@/views/RoomBookingPage.vue'
import MyBookings from '@/views/MyBookings.vue'
import RoomManage from '@/views/RoomManage.vue'
import BookingManage from '@/views/BookingManage.vue'
import ProfilePage from '@/views/ProfilePage.vue'
import SystemSettingsPage from '@/views/SystemSettingsPage.vue'

// 响应式数据
const isLoggedIn = ref(false) // 登录状态
const isAuthLoading = ref(true) // 登录校验加载状态
const user = ref<any>(null) // 用户信息
const isAdmin = ref(false) // 是否为管理员
const selectedKeys = ref(['home']) // 当前选中的菜单项
const currentPage = ref('home') // 当前页面
const rooms = ref<any[]>([]) // 会议室列表
const roomsLoading = ref(false) // 会议室加载状态
const isMobile = ref(window.innerWidth <= 700)

// 计算属性：是否为微前端环境
const isMicroAppComputed = computed(() => isMicroApp())

// 获取会议室列表
const fetchRooms = async () => {
  try {
    roomsLoading.value = true
    const res = await api.get('/rooms')
    // 兼容后端返回数组或对象
    rooms.value = Array.isArray(res.data) ? res.data : res.data.rooms || []
  } catch (e: any) {
    message.error(e.response?.data?.error || '获取会议室列表失败')
  } finally {
    roomsLoading.value = false
  }
}

// 检查登录状态
const checkLoginStatus = async () => {
  console.log('checkLoginStatus 开始')
  isAuthLoading.value = true
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      console.log('无 token，未登录')
      isLoggedIn.value = false
      return
    }
    const res = await api.get('/user/info')
    console.log('用户信息获取成功', res.data)
    user.value = {
      id: res.data.user_id,
      username: res.data.username,
      role: res.data.role,
      nickname: res.data.nickname
    }
    isAdmin.value = res.data.role === 'admin'
    isLoggedIn.value = true
    await fetchRooms()
  } catch (e: any) {
    console.error('自动登录失败', e)
    localStorage.removeItem('token')
    isLoggedIn.value = false
  } finally {
    console.log('登录校验结束')
    isAuthLoading.value = false
  }
}

// 自动登录处理
const handleAutoLogin = async (userInfoData: any) => {
  try {
    console.log('自动登录用户信息:', userInfoData)
    
    if (userInfoData && userInfoData.token) {
      // 保存 token 到本地存储
      localStorage.setItem('token', userInfoData.token)
      
      // 设置用户信息
      user.value = userInfoData.user || userInfoData
      isAdmin.value = userInfoData.user?.role === 'admin' || userInfoData.role === 'admin'
      isLoggedIn.value = true
      
      // 获取会议室列表
      await fetchRooms()
      
      message.success('自动登录成功')
    }
  } catch (e: any) {
    console.error('自动登录失败:', e)
    message.error('自动登录失败')
  }
}

// 登录成功处理
const handleLogin = () => {
  isLoggedIn.value = true
  checkLoginStatus()
}

// 退出登录
const logout = () => {
  localStorage.removeItem('token')
  isLoggedIn.value = false
  user.value = null
  isAdmin.value = false
  message.success('已退出登录')
}

// 显示个人信息页面
const showProfile = () => {
  currentPage.value = 'profile'
  selectedKeys.value = []
}

// 显示系统设置页面
const showSettings = () => {
  currentPage.value = 'settings'
  selectedKeys.value = []
}

// 菜单点击处理
const handleMenuClick = ({ key }: { key: string }) => {
  currentPage.value = key
  selectedKeys.value = [key]
}

// 关闭应用（iframe 环境下）
const handleCloseApp = async () => {
  try {
    await closeApp()
  } catch (e) {
    console.error('关闭应用失败:', e)
  }
}

// 个人信息更新处理
const handleProfileUpdate = (token: string, updatedUser: any) => {
  localStorage.setItem('token', token)
  user.value = updatedUser
  message.success('个人信息更新成功')
}

// 组件挂载时的初始化逻辑
onMounted(async () => {
  console.log('onMounted 执行')
  console.log('应用初始化开始...')
  try {
    // 只在微前端环境下调用 appReady
    if (isMicroAppComputed.value) {
      console.log('当前运行在微前端环境中，准备调用 appReady')
      try {
        await appReady()
        console.log('appReady 完成')
      } catch (e) {
        console.warn('appReady 执行异常，已忽略：', e)
      }
    } else {
      console.log('当前运行在独立环境中，跳过 appReady')
    }
    // 后续自动登录流程
    if (isMicroAppComputed.value) {
      const userInfoData = await getUserInfo()
      console.log('获取到的用户信息:', userInfoData)
      if (userInfoData) {
        await handleAutoLogin(userInfoData)
      } else {
        console.log('未获取到用户信息，需要手动登录')
        await checkLoginStatus()
      }
    } else {
      await checkLoginStatus()
    }
  } catch (e) {
    console.error('应用初始化失败:', e)
    await checkLoginStatus()
  }
})

const handleResize = () => {
  isMobile.value = window.innerWidth <= 700
}
onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 主应用容器 */
#app {
  min-height: 100vh;
  background: #f5f7fa;
  margin-top: 0;
  padding-top: 0;
}

.ant-layout-header.top-nav-header {
  background: #ffffff;
  box-shadow: none;
  height: 64px;
  display: flex;
  align-items: center;
  margin-top: 0;
  padding-left: 8px;
  padding-right: 8px;
  width: 100%;
  max-width: 100%;
}

.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 100%;
  flex-wrap: nowrap;
  overflow: hidden;
  height: 64px;
}

.nav-left {
  display: flex;
  align-items: center;
}

.header-logo {
  width: 36px;
  height: 36px;
  margin-right: 14px;
}

.header-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  min-width: 80px;
  white-space: nowrap;
  word-break: keep-all;
}

.top-menu {
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  flex-wrap: nowrap;
  flex: 1 1 auto;
  min-width: 0;
  height: 64px;
  align-items: center;
  display: flex;
}

.top-menu .ant-menu-overflow {
  flex-wrap: nowrap !important;
}
.top-menu .ant-menu-overflow-item {
  flex-shrink: 0 !important;
}
.top-menu .ant-menu-overflow-item-rest {
  display: none !important;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  height: 64px;
}

.user-nickname {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
  margin-left: 8px;
  color: #666;
}

.user-avatar {
  cursor: pointer;
}

.close-btn {
  color: #666;
  display: none;
}

@media (max-width: 700px) {
  .header-title {
    display: none;
  }
  .header-logo {
    display: inline-block;
    width: 28px;
    height: 28px;
  }
  .top-nav-bar {
    flex-direction: row !important;
    align-items: center;
    width: 100%;
    flex-wrap: nowrap !important;
    overflow: hidden;
  }
  .top-menu {
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    flex-wrap: nowrap;
    flex: 1 1 auto;
    min-width: 0;
    margin: 0 8px;
    height: 48px;
    align-items: center;
    display: flex;
  }
  .user-nickname {
    display: none;
  }
  .close-btn {
    display: inline-flex;
    margin-left: -15px;
    margin-right: -10px;
  }
  /* 隐藏菜单项中的文字，只显示图标（针对ant-menu-title-content） */
  .top-menu .ant-menu-title-content {
    display: none !important;
  }
}

.site-layout-content {
  margin: 0 auto;
  padding: 32px 32px 24px 32px;
  background: #fff;
  border-radius: 16px;
  min-height: 600px;
  max-width: 1800px;
  box-shadow: 0 4px 24px #0001;
}

.page-content {
  text-align: center;
  padding: 40px 0;
}

.page-content h2 {
  color: #333;
  margin-bottom: 16px;
}

.page-content p {
  color: #666;
}

@media (max-width: 900px) {
  .site-layout-content {
    max-width: 100vw;
    padding: 16px 4px 12px 4px;
    border-radius: 0;
    min-height: 400px;
  }
  .header-title {
    font-size: 16px;
  }
  .header-logo {
    width: 28px;
    height: 28px;
  }
  .top-menu {
    min-width: 0;
    margin: 0 8px;
  }
}

@media (max-width: 1100px) and (min-width: 901px) {
  .header-title {
    font-size: 16px;
    min-width: 60px;
    white-space: nowrap;
    word-break: keep-all;
  }
  .top-menu {
    min-width: 0;
    margin: 0 8px;
  }
}

.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.custom-mobile-menu {
  display: flex;
  align-items: center;
  overflow-x: auto;
  white-space: nowrap;
  gap: 25px;
  flex: 1 1 auto;
  min-width: 0;
  margin: 0 4px;
  height: 44px;
}
.menu-icon {
  font-size: 18px;
  color: #666;
  padding: 0 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.menu-icon.active {
  color: #1677ff;
}
@media (max-width: 700px) {
  .top-menu,
  .user-nickname {
    display: none !important;
  }
  .nav-right {
    display: flex !important;
    align-items: center !important;
    height: auto !important;
    margin: 0 0 0 8px !important;
    gap: 0 !important;
  }
  .user-avatar {
    width: 28px !important;
    height: 28px !important;
    margin-left: 8px !important;
  }
  .close-btn {
    display: inline-flex !important;
    margin-left: 8px !important;
    margin-right: 0 !important;
    align-items: center !important;
  }
}

:deep(.ant-btn) {
  font-size: 14px !important;
  height: 36px !important;
  padding: 4px 2px !important;
  border-radius: 6px !important;
}
:deep(.user-avatar) {
  line-height: 26px !important;
}
</style> 