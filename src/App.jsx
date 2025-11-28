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
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          {!collapsed && '数据管理'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
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
