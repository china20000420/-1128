import { useState } from 'react'
import { Form, Input, Button, Card, message, Tabs } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { setAuthToken, setUserInfo } from '../utils/auth'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onLogin = async (values) => {
    setLoading(true)
    try {
      const res = await axios.post('/api/auth/login', values)
      setAuthToken(res.data.access_token)
      setUserInfo(res.data.is_admin)
      message.success('登录成功')
      navigate('/')
    } catch (error) {
      message.error('登录失败：' + (error.response?.data?.detail || '未知错误'))
    }
    setLoading(false)
  }

  const onRegister = async (values) => {
    setLoading(true)
    try {
      await axios.post('/api/auth/register', { ...values, is_admin: false })
      message.success('注册成功，请登录')
    } catch (error) {
      message.error('注册失败：' + (error.response?.data?.detail || '未知错误'))
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>数据版本管理系统</h2>
        <Tabs
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form onFinish={onLogin}>
                  <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input prefix={<UserOutlined />} placeholder="用户名" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    登录
                  </Button>
                </Form>
              )
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form onFinish={onRegister}>
                  <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input prefix={<UserOutlined />} placeholder="用户名" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    注册
                  </Button>
                </Form>
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}
