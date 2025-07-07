import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// 导入 Ant Design Vue
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

// 创建 Vue 应用实例
const app = createApp(App)

// 使用 Ant Design Vue
app.use(Antd)

// 挂载应用
app.mount('#app') 