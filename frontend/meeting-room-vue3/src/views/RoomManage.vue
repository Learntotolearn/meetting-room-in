<template>
  <div class="page-bg">
    <div class="main-card">
      <div class="page-header">
        <h2>会议室管理</h2>
        <p>管理会议室信息</p>
      </div>
      
      <div class="page-actions">
        <a-button type="primary" @click="showAddModal">
          添加会议室
        </a-button>
      </div>
      
      <div class="table-responsive">
        <a-table
          :columns="columns"
          :data-source="rooms"
          :loading="loading"
          row-key="id"
          :scroll="{ x: 600 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button type="link" @click="editRoom(record)">
                  编辑
                </a-button>
                <a-button type="link" danger @click="deleteRoom(record)">
                  删除
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
      
      <!-- 添加/编辑会议室弹窗 -->
      <a-modal
        v-model:open="modalVisible"
        :title="isEdit ? '编辑会议室' : '添加会议室'"
        @ok="handleSubmit"
        @cancel="closeModal"
        :confirmLoading="submitLoading"
      >
        <a-form :model="form" layout="vertical">
          <a-form-item label="会议室名称" required>
            <a-input v-model:value="form.name" placeholder="请输入会议室名称" />
          </a-form-item>
          <a-form-item label="容纳人数" required>
            <a-input-number
              v-model:value="form.capacity"
              :min="1"
              :max="100"
              style="width: 100%"
              placeholder="请输入容纳人数"
            />
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="form.status" placeholder="请选择状态">
              <a-select-option value="available">可用</a-select-option>
              <a-select-option value="maintenance">维护中</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message, Modal } from 'ant-design-vue'
import api from '@/config'

interface Props {
  isAdmin: boolean
  rooms: any[]
  fetchRooms: () => void
  loading: boolean
}

const props = defineProps<Props>()

const modalVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const editingRoom = ref<any>(null)

const form = reactive({
  name: '',
  capacity: 1,
  status: 'available'
})

const columns = [
  { title: '会议室名称', dataIndex: 'name', key: 'name' },
  { title: '容纳人数', dataIndex: 'capacity', key: 'capacity' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action' }
]

const showAddModal = () => {
  isEdit.value = false
  editingRoom.value = null
  Object.assign(form, { name: '', capacity: 1, status: 'available' })
  modalVisible.value = true
}

const editRoom = (room: any) => {
  isEdit.value = true
  editingRoom.value = room
  Object.assign(form, room)
  modalVisible.value = true
}

const closeModal = () => {
  modalVisible.value = false
  editingRoom.value = null
}

const handleSubmit = async () => {
  try {
    submitLoading.value = true
    
    if (isEdit.value) {
      await api.put(`/rooms/${editingRoom.value.id}`, form)
      message.success('编辑成功')
    } else {
      await api.post('/rooms', form)
      message.success('添加成功')
    }
    
    closeModal()
    props.fetchRooms()
  } catch (e: any) {
    message.error(e.response?.data?.error || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const deleteRoom = (room: any) => {
  Modal.confirm({
    title: `确定要删除会议室"${room.name}"吗？`,
    onOk: async () => {
      try {
        await api.delete(`/rooms/${room.id}`)
        message.success('删除成功')
        props.fetchRooms()
      } catch (e: any) {
        message.error(e.response?.data?.error || '删除失败')
      }
    }
  })
}
</script>

<style scoped>
.page-bg {
  width: 70vw;
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
    background: #ffffff;
  }
  .main-card {
    width: 100vw;
    min-width: 0;
    max-width: 100vw;
    border-radius: 0;
    padding: 8px 0 8px 0;
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
.page-actions {
  margin-bottom: 16px;
}
.table-responsive {
  width: 100%;
  overflow-x: auto;
}
</style> 