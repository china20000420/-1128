import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button } from 'antd'
import { HomeOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, DatabaseOutlined, BarChartOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Home from './pages/Home'
import PlanDetail from './pages/PlanDetail'
import StageDetail from './pages/StageDetail'
import CategoryDetail from './pages/CategoryDetail'
import Visualization from './pages/Visualization'
import Login from './pages/Login'
import { getToken, logout, isAdmin } from './utils/auth'

const { Header, Sider, Content } = Layout

function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" />
}

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [plans, setPlans] = useState([])
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    loadPlans()

    // Listen for plan changes from Home component
    const handlePlansChange = () => {
      loadPlans()
    }
    window.addEventListener('plansChanged', handlePlansChange)

    return () => {
      window.removeEventListener('plansChanged', handlePlansChange)
    }
  }, [])

  const loadPlans = async () => {
    try {
      const res = await axios.get('/api/plans')
      const plansData = res.data.plans || []

      // Load stages for each plan
      const plansWithStages = await Promise.all(
        plansData.map(async (plan) => {
          try {
            const stagesRes = await axios.get(`/api/plan${plan.key}`)
            const stagesData = stagesRes.data.stages || {}
            const stagesList = Object.keys(stagesData).map(key => key)
            return { ...plan, stages: stagesList }
          } catch (error) {
            console.error(`Failed to load stages for plan ${plan.key}:`, error)
            return { ...plan, stages: [] }
          }
        })
      )

      setPlans(plansWithStages)
    } catch (error) {
      console.error('Load plans error:', error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页'
    },
    {
      key: '/visualization',
      icon: <BarChartOutlined />,
      label: '数据可视化'
    },
    ...plans.map(plan => ({
      key: `plan-${plan.key}`,
      icon: <DatabaseOutlined />,
      label: plan.name,
      children: [
        { key: `/plan/${plan.key}`, label: '计划概览' },
        ...(plan.stages || []).map(stageKey => ({
          key: `/plan/${plan.key}/${stageKey}`,
          label: stageKey.toUpperCase()
        }))
      ]
    }))
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" width={260}>
        <div style={{
          height: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {!collapsed ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
                大模型数据技术实验室
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                训练数据管理系统
              </div>
            </>
          ) : (
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>LLM</div>
          )}
        </div>
        <div style={{
          height: 'calc(100vh - 100px - 70px)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ border: 'none' }}
          />
        </div>
        <div style={{
          position: 'absolute',
          bottom: 50,
          width: '100%',
          padding: collapsed ? '8px' : '16px',
          textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.45)',
          fontSize: collapsed ? 10 : 12,
          background: '#001529'
        }}>
          {!collapsed ? (
            <>
              <div>© 2025 大模型数据技术实验室</div>
              <div style={{ marginTop: 4 }}>All Rights Reserved</div>
            </>
          ) : (
            <div>©2025</div>
          )}
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18 }}
          />
          <div>
            {isAdmin() && <span style={{ marginRight: 16, color: '#52c41a', fontWeight: 'bold' }}>管理员</span>}
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>退出</Button>
          </div>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: 24, borderRadius: 8 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/visualization" element={<Visualization />} />
            <Route path="/plan/:planName" element={<PlanDetail />} />
            <Route path="/plan/:planName/:stageName" element={<StageDetail />} />
            <Route path="/plan/:planName/:stageName/:categoryName/:subcategoryName" element={<CategoryDetail />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
