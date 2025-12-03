import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Spin, Select, Statistic, Table } from 'antd'
import { DatabaseOutlined, FileTextOutlined, FundOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import axios from 'axios'

const { Title } = Typography
const { Option } = Select

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D', '#C0C0C0', '#FFD700']

export default function Visualization() {
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [statsData, setStatsData] = useState(null)

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    if (selectedPlan) {
      loadVisualizationData(selectedPlan)

      // 每30秒自动刷新一次数据
      const interval = setInterval(() => {
        loadVisualizationData(selectedPlan)
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [selectedPlan])

  const loadPlans = async () => {
    try {
      const res = await axios.get('/api/plans')
      const plansData = res.data.plans || []
      setPlans(plansData)
      if (plansData.length > 0) {
        setSelectedPlan(plansData[0].key)
      } else {
        // 没有计划时也要停止加载
        setLoading(false)
      }
    } catch (error) {
      console.error('Load plans error:', error)
      setLoading(false)
    }
  }

  const loadVisualizationData = async (planKey) => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/plans/${planKey}/visualization`)
      setStatsData(res.data)
    } catch (error) {
      console.error('Load visualization data error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>加载数据中...</div>
      </div>
    )
  }

  // 没有计划
  if (plans.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <DatabaseOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
        <div style={{ marginTop: 20, fontSize: 16, color: '#999' }}>
          暂无训练计划，请先创建计划
        </div>
      </div>
    )
  }

  // 没有数据
  if (!statsData) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2}>数据可视化分析</Title>
          <Select
            value={selectedPlan}
            onChange={setSelectedPlan}
            style={{ width: 200 }}
            size="large"
          >
            {plans.map(plan => (
              <Option key={plan.key} value={plan.key}>{plan.name}</Option>
            ))}
          </Select>
        </div>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <FileTextOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
          <div style={{ marginTop: 20, fontSize: 16, color: '#999' }}>
            该计划暂无阶段数据，请先添加Stage和数据
          </div>
        </div>
      </div>
    )
  }

  const { overview, stageStats, categoryStats, subcategoryStats, categoryDistribution, tokenTrends } = statsData

  // Check if there's any data
  const hasData = overview.totalTokenCount > 0 || categoryStats.length > 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>数据可视化分析</Title>
        <Select
          value={selectedPlan}
          onChange={setSelectedPlan}
          style={{ width: 200 }}
          size="large"
        >
          {plans.map(plan => (
            <Option key={plan.key} value={plan.key}>{plan.name}</Option>
          ))}
        </Select>
      </div>

      {/* 概览统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="阶段总数"
              value={overview.totalStages}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="一级类别总数"
              value={overview.totalCategories}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="数据集总Token"
              value={overview.totalTokenCount}
              prefix={<FundOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix="T"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="实际使用Token"
              value={overview.totalActualToken}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#f5222d' }}
              suffix="T"
            />
          </Card>
        </Col>
      </Row>

      {/* 各阶段Token对比柱状图 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="各阶段Token统计" bordered={false}>
            {stageStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stageStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tokenCount" name="数据集总Token" fill="#8884d8" />
                  <Bar dataKey="actualToken" name="实际使用Token" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>暂无数据</div>
            )}
          </Card>
        </Col>

        {/* 各阶段数据集数量柱状图 */}
        <Col xs={24} lg={12}>
          <Card title="各阶段数据集数量" bordered={false}>
            {stageStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stageStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="datasetCount" name="数据集数量" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>暂无数据</div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 一级类别分布饼图 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="一级类别Token分布" bordered={false}>
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={false}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(2)}T`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '120px 0', color: '#999' }}>暂无数据</div>
            )}
          </Card>
        </Col>

        {/* Token趋势折线图 */}
        <Col xs={24} lg={12}>
          <Card title="各阶段Token累计趋势" bordered={false}>
            {tokenTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={tokenTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cumulativeTokenCount" name="累计数据集Token" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="cumulativeActualToken" name="累计实际使用Token" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '120px 0', color: '#999' }}>暂无数据</div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 一级类别详细统计表 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title="一级类别详细统计" bordered={false}>
            <Table
              dataSource={categoryStats}
              rowKey={(record) => `${record.stage}_${record.category}`}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
              columns={[
                {
                  title: '类别名称',
                  dataIndex: 'category',
                  key: 'category',
                  fixed: 'left',
                  width: 150
                },
                {
                  title: '所属阶段',
                  dataIndex: 'stage',
                  key: 'stage',
                  width: 120
                },
                {
                  title: '二级类别数量',
                  dataIndex: 'subcategoryCount',
                  key: 'subcategoryCount',
                  width: 140,
                  sorter: (a, b) => a.subcategoryCount - b.subcategoryCount
                },
                {
                  title: '数据集数量',
                  dataIndex: 'datasetCount',
                  key: 'datasetCount',
                  width: 120,
                  sorter: (a, b) => a.datasetCount - b.datasetCount
                },
                {
                  title: '数据集总Token',
                  dataIndex: 'tokenCount',
                  key: 'tokenCount',
                  width: 150,
                  sorter: (a, b) => a.tokenCount - b.tokenCount,
                  render: (val) => `${val.toFixed(2)} T`
                },
                {
                  title: '实际使用Token',
                  dataIndex: 'actualToken',
                  key: 'actualToken',
                  width: 150,
                  sorter: (a, b) => a.actualToken - b.actualToken,
                  render: (val) => `${val.toFixed(2)} T`
                },
                {
                  title: '使用率',
                  dataIndex: 'usageRate',
                  key: 'usageRate',
                  width: 120,
                  sorter: (a, b) => a.usageRate - b.usageRate,
                  render: (val) => `${val.toFixed(2)}%`
                }
              ]}
              scroll={{ x: 1000 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 二级类别Top 10 */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="二级类别Token使用Top 10" bordered={false}>
            {subcategoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={subcategoryStats.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tokenCount" name="数据集总Token" fill="#8884d8" />
                  <Bar dataKey="actualToken" name="实际使用Token" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '120px 0', color: '#999' }}>暂无数据</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
