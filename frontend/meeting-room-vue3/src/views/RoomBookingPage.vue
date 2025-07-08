<template>
  <div class="page-bg">
    <!-- 会议室预订页面 -->
    <div class="room-booking-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>会议室预订</h2>
      </div>
      
      <!-- 会议室列表 -->
      <div class="room-list">
        <a-row :gutter="gutterResponsive">
          <a-col
            v-for="room in rooms"
            :key="room.id"
            :xs="24"
            :sm="12"
            :md="12"
            :lg="12"
          >
            <!-- 会议室卡片 -->
            <a-card
              class="room-card"
              hoverable
              @click="isRoomAvailable(room) && openBookingModal(room)"
              :style="{ cursor: isRoomAvailable(room) ? 'pointer' : 'not-allowed', opacity: isRoomAvailable(room) ? 1 : 0.6 }"
            >
              <!-- 会议室图片：优先 room.image，否则用默认图片 -->
              <template #cover>
                <img :src="room.image || defaultRoomImage" :alt="room.name" class="room-image" />
              </template>
              
              <!-- 会议室信息 -->
              <template #title>
                <div class="room-card-title">
                  <span class="room-name">{{ room.name }}</span>
                  <span class="room-capacity">容纳 {{ room.capacity }} 人</span>
                  <a-tag :color="getRoomStatusColor(room)" class="room-status-tag">
                    {{ getRoomStatusText(room) }}
                  </a-tag>
                </div>
              </template>
            </a-card>
          </a-col>
        </a-row>
      </div>
      
      <!-- 预订弹窗 -->
      <a-modal
        v-model:open="bookingModalVisible"
        :title="null"
        width="700px"
        @ok="handleBooking"
        @cancel="closeBookingModal"
        :confirmLoading="bookingLoading"
        :bodyStyle="{padding: '0 0 32px 0', borderRadius: '24px'}"
        :style="{borderRadius: '24px', overflow: 'hidden'}"
        :footer="null"
      >
        <div class="booking-modal-title">预订会议室</div>
        <div v-if="selectedRoom" class="booking-modal-content">
          <!-- 会议室大图 -->
          <div class="booking-room-image-wrap">
            <img :src="selectedRoom.image || defaultRoomImage" :alt="selectedRoom.name" class="booking-room-image" />
          </div>
          <!-- 会议室信息 -->
          <div class="booking-room-info2">
            <div class="booking-room-title">{{ selectedRoom.name }}</div>
            <div class="booking-room-capacity">容纳{{ selectedRoom.capacity }}人</div>
          </div>
          <!-- 表单区 -->
          <div class="booking-form-area">
            <a-form :model="bookingForm" layout="vertical">
              <a-form-item label="预订日期" required>
                <a-date-picker
                  v-model:value="bookingForm.date"
                  :disabled-date="disabledDate"
                  style="width: 100%"
                  placeholder="选择预订日期"
                  :allowClear="false"
                />
              </a-form-item>
              <a-form-item label="时间段" required>
                <div class="time-slots-btns">
                  <div class="time-slot-btns-grid">
                    <button
                      v-for="slot in availableTimeSlots"
                      :key="slot.value"
                      class="time-slot-btn"
                      :class="{
                        selected: bookingForm.timeSlots.includes(slot.value),
                        disabled: slot.disabled
                      }"
                      :disabled="slot.disabled"
                      @click.prevent="selectTimeSlot(slot.value)"
                      type="button"
                    >
                      {{ slot.label }}
                    </button>
                  </div>
                </div>
              </a-form-item>
              <a-form-item label="预订原因">
                <a-textarea
                  v-model:value="bookingForm.reason"
                  :rows="3"
                  placeholder="请输入预订原因（可选）"
                  class="booking-reason-textarea"
                />
              </a-form-item>
            </a-form>
            <div class="booking-btn-row">
              <a-button
                type="primary"
                size="large"
                style="width: 220px; border-radius: 24px; font-size: 18px; font-weight: 600;"
                :loading="bookingLoading"
                @click="handleBooking"
              >
                预订
              </a-button>
            </div>
          </div>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
// 导入 Vue3 组合式 API
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

// 导入 API 配置
import api from '@/config'
import defaultRoomImage from '@/assets/meeting-room.jpg'

// 定义组件 props
interface Props {
  rooms: any[]
  loading: boolean
}

defineProps<Props>()

// 响应式数据
const bookingModalVisible = ref(false) // 预订弹窗显示状态
const bookingLoading = ref(false) // 预订加载状态
const selectedRoom = ref<any>(null) // 选中的会议室
const availableTimeSlots = ref<any[]>([]) // 可用时间段

// 预订表单数据
const bookingForm = reactive({
  date: null, // 预订日期
  timeSlots: [] as string[], // 选中的时间段（只允许单选）
  reason: '' // 预订原因
})

// 生成时间段（6:00-24:00，每半小时一个时间段）
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 6; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const startTime = `${hour.toString().padStart(2, '0')}:${min === 0 ? '00' : '30'}`
      let endHour = hour
      let endMin = min + 30
      if (endMin === 60) {
        endHour += 1
        endMin = 0
      }
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin === 0 ? '00' : '30'}`
      slots.push({
        value: `${startTime}-${endTime}`,
        label: `${startTime}-${endTime}`,
        disabled: false
      })
    }
  }
  return slots
}

// 获取会议室状态颜色
const getRoomStatusColor = (room: any) => {
  if (room.status === 'available') return 'green'
  if (room.status === 'occupied') return 'red'
  return 'orange'
}

// 获取会议室状态文本
const getRoomStatusText = (room: any) => {
  if (room.status === 'available') return '可用'
  if (room.status === 'occupied') return '已占用'
  return '维护中'
}

// 检查会议室是否可用
const isRoomAvailable = (room: any) => {
  return room.status === 'available'
}

// 禁用过去的日期
const disabledDate = (current: any) => {
  return current && current < dayjs().startOf('day')
}

// 打开预订弹窗
const openBookingModal = (room: any) => {
  selectedRoom.value = room
  bookingForm.date = dayjs()
  bookingForm.timeSlots = []
  bookingForm.reason = ''
  
  // 生成时间段
  availableTimeSlots.value = generateTimeSlots()
  
  bookingModalVisible.value = true
}

// 关闭预订弹窗
const closeBookingModal = () => {
  bookingModalVisible.value = false
  selectedRoom.value = null
}

// 处理预订提交
const handleBooking = async () => {
  try {
    if (!bookingForm.date) {
      message.error('请选择预订日期')
      return
    }
    if (bookingForm.timeSlots.length === 0) {
      message.error('请选择时间段')
      return
    }
    if (!isTimeSlotsContinuous()) {
      message.error('只能选择连续的时间段')
      return
    }
    bookingLoading.value = true
    // 拆分时间段
    const slots = bookingForm.timeSlots.slice().sort()
    const [start] = slots[0].split('-')
    const [, end] = slots[slots.length - 1].split('-')
    const dateStr = dayjs(bookingForm.date).format('YYYY-MM-DD')
    const startTime = dayjs(`${dateStr}T${start}`).toISOString()
    const endTime = dayjs(`${dateStr}T${end}`).toISOString()
    const bookingData = {
      room_id: selectedRoom.value.id,
      start_time: startTime,
      end_time: endTime,
      reason: bookingForm.reason
    }
    await api.post('/bookings', bookingData)
    message.success('预订成功')
    closeBookingModal()
  } catch (e: any) {
    message.error(e.response?.data?.error || '预订失败')
  } finally {
    bookingLoading.value = false
  }
}

// 新增方法：时间段按钮多选，且只允许连续
const selectTimeSlot = (val: string) => {
  const idx = bookingForm.timeSlots.indexOf(val)
  if (idx === -1) {
    bookingForm.timeSlots.push(val)
    // 排序，方便后续连续性校验
    bookingForm.timeSlots.sort()
  } else {
    bookingForm.timeSlots.splice(idx, 1)
  }
}

// 校验所选时间段是否连续
const isTimeSlotsContinuous = () => {
  if (bookingForm.timeSlots.length <= 1) return true
  // 假设 timeSlots 形如 ['08:00-08:30', '08:30-09:00', ...]
  const slots = bookingForm.timeSlots.slice().sort()
  for (let i = 1; i < slots.length; i++) {
    const prevEnd = slots[i - 1].split('-')[1]
    const currStart = slots[i].split('-')[0]
    if (prevEnd !== currStart) return false
  }
  return true
}

// 响应式 gutter 设置
const gutterResponsive = computed(() => {
  return window.innerWidth < 700 ? [8, 16] : [70, 50]
})

// 组件挂载时初始化
onMounted(() => {
  // 可以在这里进行一些初始化操作
})
</script>

<style scoped>
.page-bg {
  width: 100vw;
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 48px 0;
  box-sizing: border-box;
}
.room-list {
  margin-top: 32px;
  margin-left: auto;
  margin-right: auto;
  max-width: 1400px;
  width: 100%;
  /* 移除 display: flex; 和 justify-content: center; */
}

.room-card {
  width: 100%;
  border-radius: 16px !important;
  overflow: hidden !important;
  box-shadow: 0 4px 24px #0001;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  /* margin-bottom: 16px; 移除，避免与 gutter 冲突 */
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.room-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
  margin-top: 16px;
  margin-bottom: 16px;
}

.room-card-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  gap: 8px;
  margin-bottom: 2px;
  margin-top: 2px;
}

.room-name {
  font-weight: bold;
  color: #222;
  font-size: 17px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  text-align: left;
}

.room-capacity {
  font-size: 13px;
  color: #888;
  margin-left: 4px;
  flex-shrink: 0;
}

.room-status-tag {
  margin-left: auto;
  font-size: 13px;
  border-radius: 8px;
  padding: 0 8px;
  flex-shrink: 0;
}

.room-card .ant-btn-primary {
  width: 90%;
  margin: 16px auto 12px auto;
  height: 40px;
  font-size: 16px;
  border-radius: 12px;
  font-weight: 600;
  background: #1677ff;
}

.room-card .ant-card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px;
}

.room-card .ant-tag {
  margin-left: 8px;
  font-size: 13px;
  border-radius: 8px;
  padding: 0 8px;
}

@media (max-width: 600px) {
  .page-bg {
    width: 100vw;
    min-width: 0;
    padding: 8px 0;
    background: #ffffff;
  }
  .room-list {
    max-width: 100vw;
    width: 100vw;
    padding: 0;
  }
  .room-card {
    width: 100%;
    min-width: 0;
    max-width: 100vw;
  }
  .room-image {
    height: 140px;
  }
  .room-card .ant-btn-primary {
    height: 36px;
    font-size: 15px;
  }
  .time-slot-btns-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 16px 18px !important;
  }
  .time-slot-btn {
    min-height: 44px !important;
    font-size: 14px !important;
    padding: 8px 0 !important;
  }
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin-bottom: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  letter-spacing: 2px;
  display: inline-block;
}

.booking-modal-content {
  padding: 0 32px 0 32px;
}
.booking-room-image-wrap {
  width: 100%;
  height: 160px;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 18px;
}
/* 标题样式 */
.booking-modal-title {
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  margin: 24px 0 12px 0;
  letter-spacing: 1px;
  color: #222;
}
.booking-room-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.booking-room-info2 {
  margin-bottom: 18px;
  text-align: left;
}
.booking-room-title {
  font-size: 22px;
  font-weight: bold;
  color: #222;
  margin-bottom: 2px;
}
.booking-room-capacity {
  font-size: 15px;
  color: #888;
  margin-bottom: 2px;
}
.booking-form-area {
  margin-top: 8px;
}
.time-slots-btns {
  width: 100%;
  margin-bottom: 8px;
}
.time-slot-btns-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 16px;
}
.time-slot-btn {
  width: 100%;
  padding: 8px 0;
  border-radius: 18px;
  border: 1.5px solid #e0e0e0;
  background: #fafbfc;
  color: #222;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.18s;
  cursor: pointer;
  outline: none;
}
.time-slot-btn.selected {
  background: #1677ff;
  color: #fff;
  border-color: #1677ff;
}
.time-slot-btn.disabled {
  background: #f3f3f3;
  color: #bbb;
  border-color: #e0e0e0;
  cursor: not-allowed;
}
.booking-reason-textarea {
  border-radius: 16px !important;
  font-size: 15px;
}
.booking-btn-row {
  display: flex;
  justify-content: center;
  margin-top: 18px;
}
</style> 