<template>
  <div class="page-bg">
    <div class="main-card">
      <div class="page-header">
        <h2>我的预订</h2>
        <p>查看和管理您的会议室预订</p>
      </div>
      
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
            <a-button
              type="link"
              danger
              @click="cancelBooking(record)"
              :disabled="record.status === 'cancelled'"
            >
              取消预订
            </a-button>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import api from '@/config'

interface Props {
  rooms: any[]
  fetchRooms: () => void
}

const props = defineProps<Props>()

const bookings = ref<any[]>([])
const loading = ref(false)

const columns = [
  { title: '会议室', dataIndex: 'roomName', key: 'roomName' },
  { title: '预订日期', dataIndex: 'date', key: 'date' },
  { title: '时间段', dataIndex: 'timeSlots', key: 'timeSlots' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action' }
]

const fetchMyBookings = async () => {
  try {
    loading.value = true
    const res = await api.get('/mybookings')
    const rawBookings = Array.isArray(res.data) ? res.data : res.data.bookings || []
    bookings.value = rawBookings.map((item: any) => {
      const room = props.rooms?.find((r: any) => r.id === item.room_id)
      return {
        ...item,
        roomName: room ? room.name : '未知会议室',
        date: item.start_time ? item.start_time.slice(0, 10) : '',
        timeSlots: item.start_time && item.end_time
          ? `${item.start_time.slice(11, 16)}-${item.end_time.slice(11, 16)}`
          : '',
        status: 'active'
      }
    })
  } catch (e: any) {
    message.error(e.response?.data?.error || '获取预订记录失败')
  } finally {
    loading.value = false
  }
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'green',
    cancelled: 'red',
    completed: 'blue'
  }
  return colors[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: '有效',
    cancelled: '已取消',
    completed: '已完成'
  }
  return texts[status] || status
}

const cancelBooking = async (booking: any) => {
  try {
    await api.delete(`/bookings/${booking.id}`)
    message.success('取消预订成功')
    fetchMyBookings()
  } catch (e: any) {
    message.error(e.response?.data?.error || '取消预订失败')
  }
}

onMounted(() => {
  fetchMyBookings()
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
/*
@media (max-width: 950px) {
  .main-card {
    width: 98vw;
    min-width: 0;
    padding: 16px 0 12px 0;
    border-radius: 12px;
  }
}
*/
@media (max-width: 600px) {
  .page-bg {
    width: 100vw;
    min-width: 0;
    padding: 8px 0;
  }
  .main-card {
    width: 100vw;
    min-width: 0;
    max-width: 100vw;
    border-radius: 0;
    padding: 8px 0 8px 0;
  }
  .table-responsive,
  .ant-table-wrapper {
    width: 100vw !important;
    min-width: 0 !important;
    overflow-x: auto !important;
    box-sizing: border-box !important;
  }
  .ant-table {
    min-width: 600px !important;
    box-sizing: border-box !important;
  }
  .ant-pagination {
    width: 100vw !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
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