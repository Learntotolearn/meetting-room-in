<template>
  <!-- 会议室预订页面 -->
  <div class="room-booking-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>会议室预订</h2>
    </div>
    
    <!-- 会议室列表 -->
    <div class="room-list">
      <a-row :gutter="[16, 16]">
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
      title="预订会议室"
      width="600px"
      @ok="handleBooking"
      @cancel="closeBookingModal"
      :confirmLoading="bookingLoading"
    >
      <div v-if="selectedRoom">
        <!-- 会议室信息 -->
        <div class="booking-room-info">
          <h3>{{ selectedRoom.name }}</h3>
          <p>容纳 {{ selectedRoom.capacity }} 人</p>
        </div>
        
        <!-- 日期选择 -->
        <a-form :model="bookingForm" layout="vertical">
          <a-form-item label="预订日期" required>
            <a-date-picker
              v-model:value="bookingForm.date"
              :disabled-date="disabledDate"
              style="width: 100%"
              placeholder="选择预订日期"
            />
          </a-form-item>
          
          <!-- 时间段选择 -->
          <a-form-item label="时间段" required>
            <div class="time-slots">
              <a-checkbox-group
                v-model:value="bookingForm.timeSlots"
                @change="onTimeSlotsChange"
              >
                <a-row :gutter="[8, 8]">
                  <a-col
                    v-for="slot in availableTimeSlots"
                    :key="slot.value"
                    :span="6"
                  >
                    <a-checkbox
                      :value="slot.value"
                      :disabled="slot.disabled"
                      class="time-slot-checkbox"
                    >
                      {{ slot.label }}
                    </a-checkbox>
                  </a-col>
                </a-row>
              </a-checkbox-group>
            </div>
          </a-form-item>
          
          <!-- 预订原因 -->
          <a-form-item label="预订原因">
            <a-textarea
              v-model:value="bookingForm.reason"
              :rows="3"
              placeholder="请输入预订原因（可选）"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
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

const props = defineProps<Props>()

// 响应式数据
const bookingModalVisible = ref(false) // 预订弹窗显示状态
const bookingLoading = ref(false) // 预订加载状态
const selectedRoom = ref<any>(null) // 选中的会议室
const availableTimeSlots = ref<any[]>([]) // 可用时间段

// 预订表单数据
const bookingForm = reactive({
  date: null, // 预订日期
  timeSlots: [], // 选中的时间段
  reason: '' // 预订原因
})

// 生成时间段（6:00-24:00，每小时一个时间段）
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 6; hour < 24; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`
    slots.push({
      value: `${startTime}-${endTime}`,
      label: `${startTime}-${endTime}`,
      disabled: false
    })
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
  bookingForm.date = null
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

// 时间段选择变化处理
const onTimeSlotsChange = (checkedValues: string[]) => {
  bookingForm.timeSlots = checkedValues
}

// 处理预订提交
const handleBooking = async () => {
  try {
    // 验证表单
    if (!bookingForm.date) {
      message.error('请选择预订日期')
      return
    }
    
    if (bookingForm.timeSlots.length === 0) {
      message.error('请选择时间段')
      return
    }
    
    bookingLoading.value = true
    
    // 构建预订数据
    const bookingData = {
      roomId: selectedRoom.value.id,
      date: dayjs(bookingForm.date).format('YYYY-MM-DD'),
      timeSlots: bookingForm.timeSlots,
      reason: bookingForm.reason
    }
    
    // 发送预订请求
    const res = await api.post('/bookings', bookingData)
    
    message.success('预订成功')
    closeBookingModal()
    
    // 可以在这里触发父组件刷新数据
    // emit('booking-success')
    
  } catch (e: any) {
    message.error(e.response?.data?.error || '预订失败')
  } finally {
    bookingLoading.value = false
  }
}

// 组件挂载时初始化
onMounted(() => {
  // 可以在这里进行一些初始化操作
})
</script>

<style scoped>
.room-list {
  margin-top: 32px;
  margin-left: auto;
  margin-right: auto;
  max-width: 1400px;
  width: 100%;
  display: flex;
  justify-content: center;
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
  margin-bottom: 16px;
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

@media (max-width: 500px) {
  .room-card {
    width: 98vw;
    min-width: 0;
    max-width: 100vw;
    margin-bottom: 12px;
  }
  .room-image {
    height: 140px;
  }
  .room-card .ant-btn-primary {
    height: 36px;
    font-size: 15px;
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
</style> 