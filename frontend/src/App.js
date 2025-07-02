// 导入 UI 组件和图标
import { Button, Form, Input, message, Layout, Menu, Table, Modal, InputNumber, DatePicker, Select, Space, Card, Tabs, Row, Col, Dropdown, Avatar, Switch } from 'antd';
import { UserOutlined, LockOutlined, HomeOutlined, CalendarOutlined, SettingOutlined, LogoutOutlined, TeamOutlined, UnorderedListOutlined, CustomerServiceOutlined, CloseOutlined } from '@ant-design/icons';

// 导入日期相关库
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import { zhCN } from 'date-fns/locale';
import { format, parseISO, startOfWeek, getDay } from 'date-fns';
import moment from 'moment';

// 导入工具和配置
import { getUserInfo, closeApp } from '@dootask/tools';
import api from './config';

// 导入样式
import 'moment/locale/zh-cn';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';

// 导入图片资源
// import logo512Image from './assets/logo512.png';
// import meetingRoomImage from './assets/meeting-room.jpg';
// import favicon from './assets/favicon.ico';

// 导入 React 相关库
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';

// 设置 moment 语言
moment.locale('zh-cn');

// 检测是否被嵌入，若是则加body类
if (typeof window !== 'undefined' && window !== window.parent) {
  document.body.classList.add('embedded-mode');
}

const { Header, Content } = Layout;
const { RangePicker } = DatePicker;

// 获取基础路径
const basename = process.env.PUBLIC_URL || '/';

// 设置 favicon
const setFavicon = () => {
  const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = '/favicon.ico';
  document.getElementsByTagName('head')[0].appendChild(link);
};

// 判断是否为移动端
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
// 判断是否为嵌入模式
const isEmbedded = typeof window !== 'undefined' && window !== window.parent;

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const onLoginFinish = async (values) => {
    try {
      const res = await api.post('/api/login', values);
      localStorage.setItem('token', res.data.token);
      message.success('登录成功');
      onLogin();
    } catch (e) {
      message.error(e.response?.data?.error || '登录失败');
    }
  };

  const onRegisterFinish = async (values) => {
    try {
      const res = await api.post('/api/register', values);
      localStorage.setItem('token', res.data.token);
      message.success('注册成功');
      onLogin();
    } catch (e) {
      message.error(e.response?.data?.error || '注册失败');
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    loginForm.resetFields();
    registerForm.resetFields();
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <img src="/logo192.png" alt="Logo" className="login-logo" />
        <h1 className="login-title">会议室预订系统</h1>
      </div>
      
      {isLogin ? (
        <Form
          form={loginForm}
          name="loginForm"
          onFinish={onLoginFinish}
          className="login-form"
        >
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]} hasFeedback>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]} hasFeedback>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>登录</Button>
          </Form.Item>
          <div className="login-switch">
            <span>还没有账号？</span>
            <Button type="link" onClick={switchMode} style={{ padding: 0, height: 'auto' }}>
              立即注册
            </Button>
          </div>
        </Form>
      ) : (
        <Form
          form={registerForm}
          name="registerForm"
          onFinish={onRegisterFinish}
          className="login-form"
        >
          <Form.Item 
            name="username" 
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' }
            ]} 
            hasFeedback
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item 
            name="password" 
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]} 
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item 
            name="confirmPassword" 
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]} 
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>注册</Button>
          </Form.Item>
          <div className="login-switch">
            <span>已有账号？</span>
            <Button type="link" onClick={switchMode} style={{ padding: 0, height: 'auto' }}>
              立即登录
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
}

function RoomManage({ isAdmin, rooms, fetchRooms, loading }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editingRoom, setEditingRoom] = useState(null);

  const onAddRoom = async (values) => {
    try {
      await api.post('/api/rooms', values, { headers: { Authorization: localStorage.getItem('token') } });
      message.success('添加成功');
      setModalOpen(false);
      form.resetFields();
      fetchRooms();
    } catch (e) {
      message.error(e.response?.data?.error || '添加失败');
    }
  };

  const onEditRoom = (room) => {
    setEditingRoom(room);
    editForm.setFieldsValue(room);
    setEditModalOpen(true);
  };

  const onEditSubmit = async (values) => {
    try {
      await api.put(`/api/rooms/${editingRoom.id}`, values, { headers: { Authorization: localStorage.getItem('token') } });
      message.success('编辑成功');
      setEditModalOpen(false);
      fetchRooms();
    } catch (e) {
      message.error(e.response?.data?.error || '编辑失败');
    }
  };

  const onDeleteRoom = (room) => {
    Modal.confirm({
      title: `确定要删除会议室"${room.name}"吗？`,
      onOk: async () => {
        try {
          await api.delete(`/api/rooms/${room.id}`, { headers: { Authorization: localStorage.getItem('token') } });
          message.success('删除成功');
          fetchRooms();
        } catch (e) {
          message.error(e.response?.data?.error || JSON.stringify(e.response?.data) || '删除失败');
        }
      }
    });
  };

  const columns = [
    { title: '会议室名称', dataIndex: 'name' },
    { title: '容纳人数', dataIndex: 'capacity' },
  ];
  if (isAdmin) {
    columns.push({
      title: '操作',
      render: (_, room) => (
        <Space>
          <Button size="small" onClick={() => onEditRoom(room)}>编辑</Button>
          <Button size="small" danger onClick={() => onDeleteRoom(room)}>删除</Button>
        </Space>
      )
    });
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        {isAdmin && <Button type="primary" icon={<SettingOutlined />} onClick={() => setModalOpen(true)}>添加会议室</Button>}
      </Space>
      <Table dataSource={rooms} rowKey="id" columns={columns} pagination={false} loading={loading} />
      <Modal title="添加会议室" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnHidden>
        <Form form={form} name="addRoomForm" onFinish={onAddRoom} layout="vertical">
          <Form.Item name="name" label="会议室名称" rules={[{ required: true, message: '请输入会议室名称' }]} hasFeedback><Input /></Form.Item>
          <Form.Item name="capacity" label="容纳人数" rules={[{ required: true, message: '请输入容纳人数' }]} hasFeedback><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block>添加</Button></Form.Item>
        </Form>
      </Modal>
      <Modal title="编辑会议室" open={editModalOpen} onCancel={() => setEditModalOpen(false)} footer={null} destroyOnHidden>
        <Form form={editForm} name="editRoomForm" onFinish={onEditSubmit} layout="vertical">
          <Form.Item name="name" label="会议室名称" rules={[{ required: true, message: '请输入会议室名称' }]} hasFeedback><Input /></Form.Item>
          <Form.Item name="capacity" label="容纳人数" rules={[{ required: true, message: '请输入容纳人数' }]} hasFeedback><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block>保存</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function RoomList({ rooms = [] }) {
  const navigate = useNavigate();
  return (
    <Row gutter={[24, 24]} justify="center">
      {rooms.map(room => (
        <Col xs={24} sm={12} md={8} key={room.id} style={{ display: 'flex', justifyContent: 'center' }}>
          <Card
            hoverable
            title={<span style={{ fontWeight: 600 }}>{room.name}</span>}
            extra={<span>容纳{room.capacity}人</span>}
            cover={<img alt="会议室" src="/meeting-room.jpg" style={{ height: 200, objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />}
            style={{ minHeight: 320, maxHeight: 360, maxWidth: 350, width: '100%', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: '0 auto' }}
            styles={{ body: { padding: 16, flex: 1, overflow: 'auto' } }}
            onClick={() => navigate(`/booking/${room.id}`)}
          >
            <div style={{ color: '#888', fontSize: 14 }}>点击卡片预约</div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

function RoomBookingPage({ rooms }) {
  const { roomId } = useParams();
  const [selectedDateKey, setSelectedDateKey] = useState(moment().format('YYYY-MM-DD'));
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [booking, setBooking] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const cardRef = useRef();
  const floatBarRef = useRef();

  const room = rooms && rooms.length > 0 ? rooms.find(r => String(r.id) === roomId) : undefined;

  // useEffect 必须始终调用
  const selectedDate = moment(selectedDateKey);
  useEffect(() => {
    if (!room) return;
    api.get(`/api/bookings?room_id=${room.id}&start_time=${selectedDate.toISOString().slice(0,10)}T00:00:00&end_time=${selectedDate.toISOString().slice(0,10)}T23:59:59`, {
      headers: { Authorization: localStorage.getItem('token') }
    }).then(res => {
      setBookedSlots(res.data.bookings.map(b => ({
        start: moment(b.start_time),
        end: moment(b.end_time)
      })));
    });
    setSelectedSlots([]);
  }, [room, selectedDateKey]);

  useEffect(() => {
    function syncFloatBar() {
      if (!cardRef.current || !floatBarRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      if (window.innerWidth <= 700) {
        floatBarRef.current.style.width = '100vw';
        floatBarRef.current.style.left = '0';
        floatBarRef.current.style.transform = 'none';
      } else {
        floatBarRef.current.style.width = rect.width + 'px';
        floatBarRef.current.style.left = rect.left + 'px';
        floatBarRef.current.style.transform = 'none';
      }
    }
    requestAnimationFrame(syncFloatBar);
    window.addEventListener('resize', syncFloatBar);
    window.addEventListener('scroll', syncFloatBar);
    return () => {
      window.removeEventListener('resize', syncFloatBar);
      window.removeEventListener('scroll', syncFloatBar);
    };
  }, []);

  if (!rooms || rooms.length === 0) {
    return <div style={{ padding: 32, textAlign: 'center' }}>加载中...</div>;
  }
  if (!room) return <div style={{padding: 32}}>会议室不存在</div>;
  
  const getDayLabel = (day) => {
    const isToday = moment().isSame(day, 'day');
    const dayOfWeek = isToday ? '今天' : day.format('ddd');
    const dayOfMonth = day.format('D');
    return (
      <div>
        <div className="date-selector-day-of-week">{dayOfWeek}</div>
        <div className="date-selector-day-of-month">{dayOfMonth}</div>
      </div>
    );
  };

  // 支持未来30天
  const days = Array.from({ length: 30 }, (_, i) => moment().startOf('day').add(i, 'days'));

  function getTimeSlots(start = '06:00', end = '24:00') {
    const slots = [];
    let cur = moment(selectedDate.format('YYYY-MM-DD') + ' ' + start);
    const endTime = moment(selectedDate.format('YYYY-MM-DD') + ' ' + end);
    while (cur < endTime) {
      const next = cur.clone().add(30, 'minutes');
      slots.push({
        label: `${cur.format('HH:mm')}-${next.format('HH:mm')}`,
        start: cur.clone(),
        end: next.clone(),
      });
      cur = next;
    }
    return slots;
  }

  // 判断时间段是否已被预约
  function isSlotBooked(slot) {
    return bookedSlots.some(b =>
      (slot.start.isBefore(b.end) && slot.end.isAfter(b.start))
    );
  }

  // 判断slot是否被选中
  const isSlotSelected = (slot) => selectedSlots.some(s => s.label === slot.label);

  const handleBook = async () => {
    if (!room || selectedSlots.length === 0) return;
    // 检查是否连续
    const sorted = [...selectedSlots].sort((a, b) => a.start - b.start);
    let isContinuous = true;
    for (let i = 1; i < sorted.length; i++) {
      if (!sorted[i].start.isSame(sorted[i-1].end)) {
        isContinuous = false;
        break;
      }
    }
    if (!isContinuous) {
      message.error('请选择连续的时间段');
      return;
    }
    setBooking(true);
    try {
      await api.post('/api/bookings', {
        room_id: room.id,
        start_time: sorted[0].start.toISOString(),
        end_time: sorted[sorted.length-1].end.toISOString(),
      }, { headers: { Authorization: localStorage.getItem('token') } });
      message.success('预订成功');
      setSelectedSlots([]);
      // 重新拉取已预约时间段
      api.get(`/api/bookings?room_id=${room.id}&start_time=${selectedDate.toISOString().slice(0,10)}T00:00:00&end_time=${selectedDate.toISOString().slice(0,10)}T23:59:59`, {
        headers: { Authorization: localStorage.getItem('token') }
      }).then(res => {
        setBookedSlots(res.data.bookings.map(b => ({
          start: moment(b.start_time),
          end: moment(b.end_time)
        })));
      });
    } catch (e) {
      message.error(e.response?.data?.error || '预订失败');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="room-scroll-box" ref={cardRef}>
      <div className="room-scroll-content">
        <img src="/meeting-room.jpg" alt="会议室" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: -3 }} />
        <div className="room-header-bar" style={{ width: '100%', padding: '18px 0 10px 0' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: 24,
            flexDirection: 'row',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 6,
              minWidth: 0,
              flex: 1
            }}>
              <h2 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 0.5,
                lineHeight: 1.3,
                minWidth: 0,
                maxWidth: '220px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>{room.name}</h2>
              <div className="room-capacity" style={{
                margin: 0,
                fontSize: 13,
                color: '#bbb',
                lineHeight: 1.2,
                maxWidth: '220px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                容纳{room.capacity}人
              </div>
            </div>
            <Button
              type="primary"
              className="booking-float-btn"
              style={{
                marginLeft: 32,
                minWidth: 100,
                maxWidth: 200,
                height: 40,
                fontSize: 17,
                borderRadius: 14,
              }}
              onClick={handleBook}
              disabled={selectedSlots.length === 0 || booking}
              loading={booking}
            >
              预订
            </Button>
          </div>
        </div>
        <Tabs
          className="date-selector-tabs"
          activeKey={selectedDateKey}
          onChange={key => { setSelectedDateKey(key); }}
          items={days.map(day => ({
            key: day.format('YYYY-MM-DD'),
            label: getDayLabel(day),
            children: (
              <Row gutter={[4, 8]}>
                {getTimeSlots().map(slot => {
                  const booked = isSlotBooked(slot);
                  const selected = isSlotSelected(slot);
                  return (
                    <Col span={8} key={slot.label}>
                      <Button
                        block
                        type={selected ? 'primary' : 'default'}
                        disabled={booked}
                        onClick={() => {
                          if (booked) return;
                          if (selected) {
                            setSelectedSlots(selectedSlots.filter(s => s.label !== slot.label));
                          } else {
                            setSelectedSlots([...selectedSlots, slot].sort((a, b) => a.start - b.start));
                          }
                        }}
                        style={{
                          marginBottom: 10,
                          borderRadius: 12,
                          boxShadow: selected ? '0 2px 8px #1677ff33' : 'none',
                          borderColor: booked ? '#eee' : undefined,
                          background: booked ? '#f5f5f5' : undefined,
                          color: booked ? '#bbb' : undefined,
                        }}
                      >
                        {slot.label}
                      </Button>
                    </Col>
                  );
                })}
              </Row>
            )
          }))}
        />
      </div>
    </div>
  );
}

function MyBookings({ rooms, fetchRooms }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);

  const fetchMyBookings = async () => {
    setLoading(true);
    const res = await api.get('/api/mybookings', { headers: { Authorization: localStorage.getItem('token') } });
    setBookings(res.data.bookings);
    setLoading(false);
  };
  useEffect(() => { fetchMyBookings(); }, []);

  const onCancel = async (id) => {
    Modal.confirm({
      title: '确定要取消该预订吗？',
      onOk: async () => {
        setCancelingId(id);
        try {
          await api.delete(`/api/bookings/${id}`, { headers: { Authorization: localStorage.getItem('token') } });
          message.success('取消成功');
          await fetchMyBookings();
        } catch (e) {
          message.error(e.response?.data?.error || JSON.stringify(e.response?.data) || '取消失败');
        } finally {
          setCancelingId(null);
        }
      }
    });
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <Table
        dataSource={bookings}
        rowKey="id"
        loading={loading}
        columns={[
          { title: '会议室', dataIndex: 'room_id', render: id => rooms.find(r => r.id === id)?.name || id },
          { title: '开始时间', dataIndex: 'start_time', render: t => new Date(t).toLocaleString() },
          { title: '结束时间', dataIndex: 'end_time', render: t => new Date(t).toLocaleString() },
          { title: '操作', dataIndex: 'id', render: (id, record) =>
            new Date(record.start_time) > new Date() ?
              <Button danger size="small" onClick={() => onCancel(id)} loading={cancelingId === id}>取消</Button>
              : <span style={{color:'#aaa'}}>已开始</span>
          }
        ]}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}

function BookingManage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/bookings', { headers: { Authorization: localStorage.getItem('token') } });
      setBookings(res.data.bookings || []);
    } catch (e) {
      message.error("获取预订列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const columns = [
    { title: '会议室', dataIndex: 'room_name', key: 'room_name', filters: [...new Set(bookings.map(b => b.room_name))].map(name => ({ text: name, value: name })), onFilter: (value, record) => record.room_name === value },
    { title: '预订人', dataIndex: 'username', key: 'username' },
    { title: '开始时间', dataIndex: 'start_time', render: t => new Date(t).toLocaleString(), defaultSortOrder: 'descend', sorter: (a, b) => new Date(a.start_time) - new Date(b.start_time) },
    { title: '结束时间', dataIndex: 'end_time', render: t => new Date(t).toLocaleString() },
  ];

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <h2 style={{marginBottom: 16}}>所有预订记录</h2>
      <div style={{ overflowX: 'auto' }}>
        <Table
          dataSource={bookings}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
}

function ProfilePage({ user, onProfileUpdate }) {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [canChangePassword, setCanChangePassword] = useState(true);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({ nickname: user.nickname, username: user.username });
    }
  }, [user, form]);

  // 检查用户是否可以修改密码
  useEffect(() => {
    if (user?.role === 'admin') {
      // 管理员总是可以修改密码
      setCanChangePassword(true);
    } else {
      // 普通用户需要检查系统设置
      api.get('/api/settings')
        .then(res => {
          setCanChangePassword(res.data.settings.allow_user_change_password);
        })
        .catch(() => {
          // 如果获取设置失败，默认允许修改
          setCanChangePassword(true);
        });
    }
  }, [user]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await api.put('/api/user/profile', { nickname: values.nickname }, { headers: { Authorization: localStorage.getItem('token') } });
      message.success('昵称更新成功');
      if (onProfileUpdate) {
        onProfileUpdate(res.data.token, res.data.user);
      }
    } catch (e) {
      message.error(e.response?.data?.error || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordFinish = async (values) => {
    setPasswordLoading(true);
    try {
      await api.put('/api/user/password', {
        old_password: values.oldPassword,
        new_password: values.newPassword
      }, { headers: { Authorization: localStorage.getItem('token') } });
      message.success('密码修改成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (e) {
      message.error(e.response?.data?.error || '密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return <div style={{padding: 32}}>加载中...</div>;

  return (
    <div style={{ maxWidth: 500, margin: '32px auto', background: '#fff', padding: '24px', borderRadius: 8 }}>
      <h2 style={{ marginBottom: 24 }}>个人信息设置</h2>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item label="用户名 (不可修改)">
          <Input value={user.username} disabled />
        </Form.Item>
        <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入您的昵称' }]}>
          <Input placeholder="请输入您的昵称" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            保存更改
          </Button>
        </Form.Item>
      </Form>

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
        <h3 style={{ marginBottom: 16 }}>密码设置</h3>
        {!canChangePassword ? (
          <div style={{ color: '#999', marginBottom: 16 }}>
            系统已禁用用户修改密码功能，请联系管理员
          </div>
        ) : (
          <Button 
            type="default" 
            onClick={() => setPasswordModalVisible(true)}
            block
          >
            修改密码
          </Button>
        )}
      </div>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form form={passwordForm} onFinish={onPasswordFinish} layout="vertical">
          <Form.Item 
            name="oldPassword" 
            label="原密码" 
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item 
            name="newPassword" 
            label="新密码" 
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item 
            name="confirmPassword" 
            label="确认新密码" 
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={passwordLoading} block>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function SystemSettingsPage() {
  const [settings, setSettings] = useState({ allow_user_change_password: true });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/settings', { headers: { Authorization: localStorage.getItem('token') } });
      setSettings(res.data.settings);
    } catch (e) {
      message.error('获取系统设置失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get('/api/admin/users', { headers: { Authorization: localStorage.getItem('token') } });
      setUsers(res.data.users);
    } catch (e) {
      message.error('获取用户列表失败');
    } finally {
      setUsersLoading(false);
    }
  };

  const onSettingsChange = async (checked) => {
    try {
      await api.put('/api/admin/settings', { allow_user_change_password: checked }, { headers: { Authorization: localStorage.getItem('token') } });
      setSettings({ ...settings, allow_user_change_password: checked });
      message.success('设置更新成功');
    } catch (e) {
      message.error('设置更新失败');
    }
  };

  const onResetUserPassword = (user) => {
    setSelectedUser(user);
    setPasswordModalVisible(true);
  };

  const onPasswordSubmit = async (values) => {
    try {
      await api.put('/api/admin/user/password', {
        user_id: selectedUser.id,
        new_password: values.newPassword
      }, { headers: { Authorization: localStorage.getItem('token') } });
      message.success('用户密码重置成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
      setSelectedUser(null);
    } catch (e) {
      message.error(e.response?.data?.error || '密码重置失败');
    }
  };

  const handleRoleChange = async (checked, user) => {
    try {
      await api.put('/api/admin/user/role', {
        user_id: user.id,
        role: checked ? 'admin' : 'user'
      }, { headers: { Authorization: localStorage.getItem('token') } });
      message.success(`已${checked ? '设置' : '取消'}管理员权限`);
      fetchUsers(); // 刷新用户列表
    } catch (e) {
      message.error(e.response?.data?.error || '权限设置失败');
    }
  };

  const userColumns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
    { 
      title: '管理员权限', 
      dataIndex: 'role', 
      key: 'role',
      render: (role, record) => (
        <Switch
          checked={role === 'admin'}
          onChange={(checked) => handleRoleChange(checked, record)}
          checkedChildren="是"
          unCheckedChildren="否"
          disabled={record.username === 'admin'} // 禁止修改默认管理员
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => onResetUserPassword(record)}>
            重置密码
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
      <h2 style={{marginBottom: 24}}>系统设置</h2>
      
      <div style={{ marginBottom: 32 }}>
        <h3 style={{marginBottom: 16}}>用户权限设置</h3>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ marginRight: 16 }}>允许用户修改密码：</span>
          <Switch 
            checked={settings.allow_user_change_password} 
            onChange={onSettingsChange}
            loading={loading}
          />
        </div>
        <div style={{ color: '#666', fontSize: 14 }}>
          关闭此选项后，普通用户将无法修改自己的密码，但管理员仍可以修改任何用户的密码。
        </div>
      </div>

      <div>
        <h3 style={{marginBottom: 16}}>用户管理</h3>
        <Table
          dataSource={users}
          columns={userColumns}
          rowKey="id"
          loading={usersLoading}
          pagination={false}
        />
      </div>

      <Modal
        title={`重置用户"${selectedUser?.username}"的密码`}
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
          setSelectedUser(null);
        }}
        footer={null}
      >
        <Form form={passwordForm} onFinish={onPasswordSubmit} layout="vertical">
          <Form.Item 
            name="newPassword" 
            label="新密码" 
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item 
            name="confirmPassword" 
            label="确认新密码" 
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认重置
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function App() {
  const info = getUserInfo();
  const [isLogin, setIsLogin] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await api.get('/api/rooms', { headers: { Authorization: localStorage.getItem('token') } });
      setRooms(res.data.rooms);
    } catch (error) {
      console.error('获取会议室列表失败:', error);
    } finally {
      setRoomsLoading(false);
    }
  };

  // 检查登录状态
  const checkLoginStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLogin(false);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/api/user/info', { headers: { Authorization: token } });
      setUser(res.data);
      setIsLogin(true);
      fetchRooms();
    } catch (error) {
      console.error('获取用户信息失败:', error);
      setIsLogin(false);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  // 自动登录逻辑
  const handleAutoLogin = async () => {
    if (!info?.email) {
      setLoading(false);
      return;
    }
    try {
      // 只传递 email、nickname、identity，不自动设置 role
      const ssoData = {
        email: info.email,
        nickname: info.nickname || info.email,
        identity: info.identity || []
      };
      const res = await api.post('/api/auth/sso', ssoData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user || info);
      setIsLogin(true);
      fetchRooms();
    } catch (error) {
      console.error('SSO登录失败:', error);
      setIsLogin(false);
    } finally {
      setLoading(false);
    }
  };

  // 初始化检查
  useEffect(() => {
    // 设置 favicon
    setFavicon();
    
    const token = localStorage.getItem('token');
    if (token) {
      checkLoginStatus();
    } else {
      handleAutoLogin();
    }
  }, []);

  const logout = () => {
    setIsLogin(false);
    setUser(null);
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleProfileUpdate = (token, updatedUser) => {
    localStorage.setItem('token', token);
    setUser(updatedUser);
  };

  if (loading) {
    return <div style={{padding: 64, textAlign: 'center'}}><h2>加载中...</h2></div>;
  }

  if (!isLogin) {
    return <Login onLogin={() => {
      setIsLogin(true);
      checkLoginStatus();
    }} />;
  }

  // 路由和菜单key的映射
  const pathToKey = {
    '/': 'booking',
    '/mybookings': 'mybookings',
    '/manage': 'manage',
    '/booking-manage': 'booking_manage',
    '/system-settings': 'system_settings',
    '/profile': 'profile'
  };
  const currentKey = pathToKey[location.pathname] || 'booking';

  const profileMenuItems = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: '个人设置',
      onClick: () => navigate('/profile')
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', color: 'white', height: '100%' }}>
          <img src="/logo192.png" alt="logo" style={{ height: 32 }}/>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[currentKey]}
          onClick={e => {
            // 只负责跳转
            if (e.key === 'booking') navigate('/');
            else if (e.key === 'mybookings') navigate('/mybookings');
            else if (e.key === 'manage') navigate('/manage');
            else if (e.key === 'booking_manage') navigate('/booking-manage');
            else if (e.key === 'system_settings') navigate('/system-settings');
          }}
          style={{ flex: 1, minWidth: 0, borderBottom: 'none', marginLeft: '24px', background: 'transparent' }}
          items={[
            {
              key: 'booking',
              icon: <CalendarOutlined />, label: '会议室预订',
            },
            {
              key: 'mybookings',
              icon: <UserOutlined />, label: '我的预订',
            },
            ...(user?.role === 'admin' ? [{
              key: 'manage', icon: <SettingOutlined />, label: '会议室管理',
            }, {
              key: 'booking_manage',
              icon: <UnorderedListOutlined />,
              label: '预订管理',
            }, {
              key: 'system_settings',
              icon: <SettingOutlined />,
              label: '系统设置',
            }] : []),
          ]}
        />
        <div style={{ marginRight: 25, display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 先渲染头像，再渲染关闭按钮 */}
          <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight">
            <a onClick={e => e.preventDefault()} style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: -5 }} />
              <span className="user-nickname">
                {user?.nickname || user?.username}
              </span>
            </a>
          </Dropdown>
          {/* 只在移动端+嵌入时显示关闭按钮 */}
          {isMobile && isEmbedded && (
            <Button
              type="text"
              icon={<CloseOutlined style={{ fontSize: 18 }} />}
              onClick={closeApp}
              style={{ color: '#fff', background: 'transparent', border: 'none', marginRight: -17 }}
              title="关闭"
            />
          )}
        </div>
      </Header>
      <Content style={{ padding: '24px' }}>
        <Routes>
          <Route path="/" element={<RoomList rooms={rooms} />} />
          <Route path="/booking/:roomId" element={<RoomBookingPage rooms={rooms} />} />
          <Route path="/mybookings" element={<MyBookings rooms={rooms} fetchRooms={fetchRooms} />} />
          <Route path="/profile" element={<ProfilePage user={user} onProfileUpdate={handleProfileUpdate} />} />
          <Route path="/manage" element={user?.role === 'admin' ? <RoomManage isAdmin={true} rooms={rooms} fetchRooms={fetchRooms} loading={roomsLoading} /> : <div>无权限</div>} />
          <Route path="/booking-manage" element={user?.role === 'admin' ? <BookingManage /> : <div>无权限</div>} />
          <Route path="/system-settings" element={user?.role === 'admin' ? <SystemSettingsPage /> : <div>无权限</div>} />
        </Routes>
      </Content>
    </Layout>
  );
}

export default App;
