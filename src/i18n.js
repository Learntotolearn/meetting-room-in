import i18n from 'i18next';

// 使用全局 React 创建 initReactI18next
const React = window.React;
const { createContext } = React;

// 手动创建 initReactI18next 函数
const initReactI18next = {
  type: '3rdParty',
  init: (instance) => {
    instance.react = {
      useSuspense: false,
      createContext: createContext
    };
  }
};

const resources = {
  zh: {
    translation: {
      login: '登录',
      username: '用户名',
      password: '密码',
      logout: '退出',
      home: '首页',
      booking: '会议室预订',
      mybookings: '我的预订',
      manage: '会议室管理',
      addRoom: '添加会议室',
      editRoom: '编辑会议室',
      deleteRoom: '删除会议室',
      roomName: '会议室名称',
      capacity: '容纳人数',
      action: '操作',
      startTime: '开始时间',
      endTime: '结束时间',
      user: '用户',
      confirm: '确定',
      cancel: '取消',
      welcome: '欢迎使用会议室预订系统！',
      admin: '管理员',
      userRole: '普通用户',
      selectRoom: '选择会议室',
      selectTime: '请选择时间段',
      submit: '提交',
      success: '操作成功',
      fail: '操作失败',
      calendar: '日历视图',
      filterRoom: '筛选会议室',
      alreadyStarted: '已开始',
      cancelBooking: '取消',
      confirmCancel: '确定要取消该预订吗？',
      deleteConfirm: '确定要删除会议室"{{name}}"吗？',
    }
  },
  en: {
    translation: {
      login: 'Login',
      username: 'Username',
      password: 'Password',
      logout: 'Logout',
      home: 'Home',
      booking: 'Booking',
      mybookings: 'My Bookings',
      manage: 'Room Manage',
      addRoom: 'Add Room',
      editRoom: 'Edit Room',
      deleteRoom: 'Delete Room',
      roomName: 'Room Name',
      capacity: 'Capacity',
      action: 'Action',
      startTime: 'Start Time',
      endTime: 'End Time',
      user: 'User',
      confirm: 'Confirm',
      cancel: 'Cancel',
      welcome: 'Welcome to Meeting Room Booking System!',
      admin: 'Admin',
      userRole: 'User',
      selectRoom: 'Select Room',
      selectTime: 'Select Time',
      submit: 'Submit',
      success: 'Success',
      fail: 'Failed',
      calendar: 'Calendar',
      filterRoom: 'Filter Room',
      alreadyStarted: 'Started',
      cancelBooking: 'Cancel',
      confirmCancel: 'Are you sure to cancel this booking?',
      deleteConfirm: 'Are you sure to delete room "{{name}}"?',
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
});

export default i18n; 