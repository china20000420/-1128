import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Spin, Select, Statistic, Table, Tabs, Empty, Tag, Progress, Tooltip as AntTooltip } from 'antd'
import { DatabaseOutlined, FileTextOutlined, FundOutlined, ThunderboltOutlined, BarChartOutlined, PieChartOutlined, LineChartOutlined, PercentageOutlined, RiseOutlined } from '@ant-design/icons'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const { Title, Text } = Typography

export default function Visualization() {
  const navigate = useNavigate()
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

      // 每1分钟自动刷新一次数据
      const interval = setInterval(() => {
        loadVisualizationData(selectedPlan)
      }, 60000)  // 60000ms = 1分钟

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

  // 格式化Token数值，添加B单位
  const formatToken = (value) => {
    if (value === null || value === undefined) return '0.00B'
    return `${parseFloat(value).toFixed(2)}B`
  }

  // 自定义Tooltip - 显示B单位
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          padding: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#262626' }}>{label}</div>
          {payload.map((entry, index) => (
            <div key={index} style={{ color: entry.color, marginBottom: 4 }}>
              {entry.name}: <span style={{ fontWeight: 'bold' }}>{formatToken(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>加载数据中...</div>
      </div>
    )
  }

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
              <Select.Option key={plan.key} value={plan.key}>{plan.name}</Select.Option>
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

  const { overview, stageStats, categoryStats, subcategoryStats, tokenTrends } = statsData

  // 计算全局使用率
  const globalUsageRate = overview.totalTokenCount > 0
    ? (overview.totalActualToken / overview.totalTokenCount * 100)
    : 0

  // 构建三级结构的完整类别列表
  const buildHierarchicalData = () => {
    const hierarchical = []

    // 按阶段分组
    const stageGroups = {}
    subcategoryStats.forEach(sub => {
      if (!stageGroups[sub.stage]) {
        stageGroups[sub.stage] = {}
      }
      if (!stageGroups[sub.stage][sub.category]) {
        stageGroups[sub.stage][sub.category] = []
      }
      stageGroups[sub.stage][sub.category].push(sub)
    })

    // 构建层级数据
    Object.keys(stageGroups).sort().forEach(stage => {
      Object.keys(stageGroups[stage]).sort().forEach(category => {
        const subcategories = stageGroups[stage][category]
        subcategories.forEach(sub => {
          hierarchical.push({
            stage: stage,
            category: category,
            subcategory: sub.subcategory,
            datasetCount: sub.datasetCount,
            tokenCount: sub.tokenCount,
            actualToken: sub.actualToken,
            usageRate: sub.tokenCount > 0 ? (sub.actualToken / sub.tokenCount * 100) : 0
          })
        })
      })
    })

    return hierarchical
  }

  const hierarchicalData = buildHierarchicalData()

  // Tab切换内容
  const tabItems = [
    {
      key: '1',
      label: <span><BarChartOutlined /> 概览统计</span>,
      children: (
        <>
          {/* 概览统计卡片 - 5个卡片 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card hoverable>
                <Statistic
                  title="阶段总数"
                  value={overview.totalStages}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#1890ff', fontSize: 28 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={5}>
              <Card hoverable>
                <Statistic
                  title="一级类别总数"
                  value={overview.totalCategories}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#52c41a', fontSize: 28 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={5}>
              <Card hoverable>
                <Statistic
                  title="数据集总Token (DST)"
                  value={formatToken(overview.totalTokenCount)}
                  prefix={<FundOutlined />}
                  valueStyle={{ color: '#faad14', fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={5}>
              <Card hoverable>
                <Statistic
                  title="实际使用Token (AUT)"
                  value={formatToken(overview.totalActualToken)}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#f5222d', fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={5}>
              <Card hoverable>
                <Statistic
                  title="全局使用率"
                  value={globalUsageRate.toFixed(2)}
                  suffix="%"
                  prefix={<PercentageOutlined />}
                  valueStyle={{
                    color: globalUsageRate >= 90 ? '#52c41a' : globalUsageRate >= 70 ? '#faad14' : '#f5222d',
                    fontSize: 28
                  }}
                />
                <Progress
                  percent={parseFloat(globalUsageRate.toFixed(2))}
                  strokeColor={globalUsageRate >= 90 ? '#52c41a' : globalUsageRate >= 70 ? '#faad14' : '#f5222d'}
                  showInfo={false}
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Token累计趋势 - 最重要的可视化 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24}>
              <Card
                title={<span><LineChartOutlined /> 各阶段Token累计趋势</span>}
                bordered={false}
                hoverable
              >
                {tokenTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={450}>
                    <LineChart data={tokenTrends} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="stage"
                        height={60}
                        tick={{ fontSize: 12, fill: '#666' }}
                        angle={0}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#666' }}
                        tickFormatter={(value) => `${(value / 1).toFixed(0)}B`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: 20 }}
                        iconType="line"
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulativeTokenCount"
                        name="累计DST"
                        stroke="#1890ff"
                        strokeWidth={3}
                        dot={{ r: 6, fill: '#1890ff' }}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulativeActualToken"
                        name="累计AUT"
                        stroke="#52c41a"
                        strokeWidth={3}
                        dot={{ r: 6, fill: '#52c41a' }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="暂无数据" />
                )}
              </Card>
            </Col>
          </Row>

          {/* 各阶段Token对比 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24}>
              <Card
                title={<span><BarChartOutlined /> 各阶段Token统计对比</span>}
                bordered={false}
                hoverable
              >
                {stageStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={450}>
                    <BarChart data={stageStats} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="stage"
                        height={60}
                        tick={{ fontSize: 12, fill: '#666' }}
                        angle={0}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#666' }}
                        tickFormatter={(value) => `${(value / 1).toFixed(0)}B`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: 20 }}
                      />
                      <Bar
                        dataKey="tokenCount"
                        name="数据集总Token (DST)"
                        fill="#1890ff"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="actualToken"
                        name="实际使用Token (AUT)"
                        fill="#52c41a"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="暂无数据" />
                )}
              </Card>
            </Col>
          </Row>

          {/* 各阶段数据集数量 */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card
                title={<span><BarChartOutlined /> 各阶段数据集数量</span>}
                bordered={false}
                hoverable
              >
                {stageStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={stageStats} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="stage"
                        height={60}
                        tick={{ fontSize: 12, fill: '#666' }}
                        angle={0}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ paddingTop: 20 }} />
                      <Bar
                        dataKey="datasetCount"
                        name="数据集数量"
                        fill="#faad14"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="暂无数据" />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )
    },
    {
      key: '2',
      label: <span><PieChartOutlined /> 类别统计</span>,
      children: (
        <>
          {/* 完整的三级层次结构统计表 */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>完整类别层次统计</span>
                    <Tag color="blue">共 {hierarchicalData.length} 个二级类别</Tag>
                  </div>
                }
                bordered={false}
              >
                <Table
                  dataSource={hierarchicalData}
                  rowKey={(record, index) => `${record.stage}_${record.category}_${record.subcategory}_${index}`}
                  pagination={{
                    pageSize: 50,
                    showSizeChanger: true,
                    pageSizeOptions: ['20', '50', '100', '200'],
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条数据`
                  }}
                  columns={[
                    {
                      title: '阶段',
                      dataIndex: 'stage',
                      key: 'stage',
                      fixed: 'left',
                      width: 120,
                      sorter: (a, b) => a.stage.localeCompare(b.stage),
                      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>
                    },
                    {
                      title: '一级类别',
                      dataIndex: 'category',
                      key: 'category',
                      fixed: 'left',
                      width: 150,
                      sorter: (a, b) => a.category.localeCompare(b.category),
                      render: (text) => <Text strong>{text}</Text>
                    },
                    {
                      title: '二级类别',
                      dataIndex: 'subcategory',
                      key: 'subcategory',
                      width: 180,
                      sorter: (a, b) => a.subcategory.localeCompare(b.subcategory),
                      render: (text, record) => (
                        <AntTooltip title="点击查看详情">
                          <a
                            onClick={() => navigate(`/plan/${selectedPlan}/${record.stage}/${record.category}/${record.subcategory}`)}
                            style={{ color: '#1890ff', fontWeight: 500 }}
                          >
                            {text}
                          </a>
                        </AntTooltip>
                      )
                    },
                    {
                      title: '数据集数量',
                      dataIndex: 'datasetCount',
                      key: 'datasetCount',
                      width: 120,
                      align: 'right',
                      sorter: (a, b) => a.datasetCount - b.datasetCount,
                      render: (val) => <Text>{val}</Text>
                    },
                    {
                      title: '数据集总Token (DST)',
                      dataIndex: 'tokenCount',
                      key: 'tokenCount',
                      width: 180,
                      align: 'right',
                      sorter: (a, b) => a.tokenCount - b.tokenCount,
                      defaultSortOrder: 'descend',
                      render: (val) => <Text strong style={{ color: '#faad14' }}>{formatToken(val)}</Text>
                    },
                    {
                      title: '实际使用Token (AUT)',
                      dataIndex: 'actualToken',
                      key: 'actualToken',
                      width: 180,
                      align: 'right',
                      sorter: (a, b) => a.actualToken - b.actualToken,
                      render: (val) => <Text strong style={{ color: '#52c41a' }}>{formatToken(val)}</Text>
                    },
                    {
                      title: '使用率',
                      dataIndex: 'usageRate',
                      key: 'usageRate',
                      width: 150,
                      align: 'right',
                      sorter: (a, b) => a.usageRate - b.usageRate,
                      render: (val) => {
                        const rate = parseFloat(val)
                        const color = rate >= 90 ? '#52c41a' : rate >= 70 ? '#faad14' : '#f5222d'
                        return (
                          <div>
                            <Text strong style={{ color, fontSize: 15 }}>{rate.toFixed(2)}%</Text>
                            <Progress
                              percent={parseFloat(rate.toFixed(2))}
                              strokeColor={color}
                              showInfo={false}
                              size="small"
                              style={{ marginTop: 4 }}
                            />
                          </div>
                        )
                      }
                    }
                  ]}
                  scroll={{ x: 1200 }}
                  size="small"
                  bordered
                  rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
                />
              </Card>
            </Col>
          </Row>
        </>
      )
    },
    {
      key: '3',
      label: <span><DatabaseOutlined /> 数据集来源统计</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card>
              <Empty
                description={
                  <div>
                    <div style={{ fontSize: 16, marginBottom: 8 }}>数据集来源统计</div>
                    <div style={{ color: '#999' }}>该功能正在开发中，敬请期待</div>
                  </div>
                }
              />
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: '4',
      label: <span><FileTextOutlined /> 上下文分布</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card>
              <Empty
                description={
                  <div>
                    <div style={{ fontSize: 16, marginBottom: 8 }}>数据统计上下文分布</div>
                    <div style={{ color: '#999' }}>该功能正在开发中，敬请期待</div>
                  </div>
                }
              />
            </Card>
          </Col>
        </Row>
      )
    }
  ]

  return (
    <div>
      <style>{`
        .table-row-light {
          background-color: #fafafa;
        }
        .table-row-dark {
          background-color: #ffffff;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #e6f7ff !important;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>
          <RiseOutlined style={{ marginRight: 8 }} />
          数据可视化分析
        </Title>
        <Select
          value={selectedPlan}
          onChange={setSelectedPlan}
          style={{ width: 250 }}
          size="large"
        >
          {plans.map(plan => (
            <Select.Option key={plan.key} value={plan.key}>{plan.name}</Select.Option>
          ))}
        </Select>
      </div>

      <Tabs
        defaultActiveKey="1"
        items={tabItems}
        size="large"
      />
    </div>
  )
}
