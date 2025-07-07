<template>
  <div class="page-bg">
    <div class="main-card">
      <div class="page-header">
        <h2>预订管理</h2>
        <p>管理所有会议室预订</p>
      </div>
      
      <div class="table-responsive">
        <a-table
          :columns="columns"
          :data-source="bookings"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
          row-key="id"
          :scroll="{ x: 600 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ getStatusText(record.status) }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" @click="viewBooking(record)">
                  查看
                </a-button>
                <a-button type="link" danger @click="cancelBooking(record)">
                  取消
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import api from '@/config'

const bookings = ref<any[]>([])
const loading = ref(false)

const columns = [
  { title: '用户', dataIndex: 'userName', key: 'userName' },
  { title: '会议室', dataIndex: 'roomName', key: 'roomName' },
  { title: '预订日期', dataIndex: 'date', key: 'date' },
  { title: '时间段', dataIndex: 'timeSlots', key: 'timeSlots' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action' }
]

const fetchAllBookings = async () => {
  try {
    loading.value = true
    const res = await api.get('/admin/bookings')
    const rawBookings = res.data.bookings || []
    bookings.value = rawBookings.map((item: any) => ({
      ...item,
      userName: item.username || '未知用户',
      roomName: item.room_name || '未知会议室',
      date: item.start_time ? item.start_time.slice(0, 10) : '',
      timeSlots: item.start_time && item.end_time
        ? `${item.start_time.slice(11, 16)}-${item.end_time.slice(11, 16)}`
        : '',
      status: 'active' // 如有后端状态可替换
    }))
  } catch (e: any) {
    message.error(e.response?.data?.error || '获取预订记录失败')
  } finally {
    loading.value = false
  }
}

const getStatusColor = (status: string) => {
  const colors = {
    active: 'green',
    cancelled: 'red',
    completed: 'blue'
  }
  return colors[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts = {
    active: '有效',
    cancelled: '已取消',
    completed: '已完成'
  }
  return texts[status] || status
}

const viewBooking = (booking: any) => {
  message.info(`查看预订详情：${booking.id}`)
}

const cancelBooking = async (booking: any) => {
  try {
    await api.delete(`/bookings/${booking.id}`)
    message.success('取消预订成功')
    fetchAllBookings()
  } catch (e: any) {
    message.error(e.response?.data?.error || '取消预订失败')
  }
}

onMounted(() => {
  fetchAllBookings()
})
</script>

<style scoped>
.page-bg {
  width: 100vw;
  min-height: 100vh;
  background: #f7f8fa;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 48px 0;
  box-sizing: border-box;
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
.table-responsive {
  width: 100%;
  overflow-x: auto;
}
</style> 