import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Spin, Select, Statistic, Table, Tabs, Empty, Tag, Progress } from 'antd'
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

  // 自定义XAxis标签 - 旋转45度避免重叠
  const CustomXAxisTick = ({ x, y, payload }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          fill="#666"
          transform="rotate(-45)"
          fontSize={12}
        >
          {payload.value}
        </text>
      </g>
    )
  }

  // 自定义YAxis标签 - 缩短文本避免重叠
  const CustomYAxisTick = ({ x, y, payload }) => {
    const maxLength = 20
    let displayText = payload.value
    if (displayText.length > maxLength) {
      displayText = displayText.substring(0, maxLength) + '...'
    }
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dx={-5}
          dy={5}
          textAnchor="end"
          fill="#666"
          fontSize={11}
        >
          {displayText}
        </text>
      </g>
    )
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

  // Tab切换内容
  const tabItems = [
    {
      key: '1',
      label: <span><BarChartOutlined /> 概览统计</span>,
      children: (
        <>
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
                  title="数据集总Token (DST)"
                  value={overview.totalTokenCount.toFixed(2)}
                  prefix={<FundOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="实际使用Token (AUT)"
                  value={overview.totalActualToken.toFixed(2)}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Token累计趋势 - 最重要的可视化 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24}>
              <Card title={<span><LineChartOutlined /> 各阶段Token累计趋势</span>} bordered={false}>
                {tokenTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={tokenTrends} margin={{ bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" tick={<CustomXAxisTick />} height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => value.toFixed(2)} />
                      <Legend />
                      <Line type="monotone" dataKey="cumulativeTokenCount" name="累计DST" stroke="#8884d8" strokeWidth={3} dot={{ r: 5 }} />
                      <Line type="monotone" dataKey="cumulativeActualToken" name="累计AUT" stroke="#82ca9d" strokeWidth={3} dot={{ r: 5 }} />
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
              <Card title={<span><BarChartOutlined /> 各阶段Token统计对比</span>} bordered={false}>
                {stageStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={stageStats} margin={{ bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" tick={<CustomXAxisTick />} height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => value.toFixed(2)} />
                      <Legend />
                      <Bar dataKey="tokenCount" name="数据集总Token (DST)" fill="#8884d8" />
                      <Bar dataKey="actualToken" name="实际使用Token (AUT)" fill="#82ca9d" />
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
              <Card title={<span><BarChartOutlined /> 各阶段数据集数量</span>} bordered={false}>
                {stageStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={stageStats} margin={{ bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" tick={<CustomXAxisTick />} height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="datasetCount" name="数据集数量" fill="#ffc658" />
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
          {/* 一级类别详细统计表 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24}>
              <Card title="一级类别详细统计" bordered={false}>
                <Table
                  dataSource={categoryStats}
                  rowKey={(record) => `${record.stage}_${record.category}`}
                  pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条`
                  }}
                  columns={[
                    {
                      title: '一级类别',
                      dataIndex: 'category',
                      key: 'category',
                      fixed: 'left',
                      width: 180,
                      sorter: (a, b) => a.category.localeCompare(b.category)
                    },
                    {
                      title: '所属阶段',
                      dataIndex: 'stage',
                      key: 'stage',
                      width: 150,
                      sorter: (a, b) => a.stage.localeCompare(b.stage)
                    },
                    {
                      title: '二级类别数',
                      dataIndex: 'subcategoryCount',
                      key: 'subcategoryCount',
                      width: 120,
                      align: 'right',
                      sorter: (a, b) => a.subcategoryCount - b.subcategoryCount,
                      defaultSortOrder: 'descend'
                    },
                    {
                      title: '数据集数量',
                      dataIndex: 'datasetCount',
                      key: 'datasetCount',
                      width: 120,
                      align: 'right',
                      sorter: (a, b) => a.datasetCount - b.datasetCount
                    },
                    {
                      title: '数据集总Token (DST)',
                      dataIndex: 'tokenCount',
                      key: 'tokenCount',
                      width: 180,
                      align: 'right',
                      sorter: (a, b) => a.tokenCount - b.tokenCount,
                      render: (val) => <Text strong style={{ color: '#faad14' }}>{val.toFixed(2)}</Text>
                    },
                    {
                      title: '实际使用Token (AUT)',
                      dataIndex: 'actualToken',
                      key: 'actualToken',
                      width: 180,
                      align: 'right',
                      sorter: (a, b) => a.actualToken - b.actualToken,
                      render: (val) => <Text strong style={{ color: '#f5222d' }}>{val.toFixed(2)}</Text>
                    },
                    {
                      title: '使用率',
                      dataIndex: 'usageRate',
                      key: 'usageRate',
                      width: 120,
                      align: 'right',
                      sorter: (a, b) => a.usageRate - b.usageRate,
                      render: (val) => {
                        const color = val >= 90 ? '#52c41a' : val >= 70 ? '#faad14' : '#f5222d'
                        return <Text strong style={{ color }}>{val.toFixed(2)}%</Text>
                      }
                    }
                  ]}
                  scroll={{ x: 1200 }}
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          {/* 二级类别Top 10表格 */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title="二级类别Token使用 Top 10" bordered={false}>
                {subcategoryStats.length > 0 ? (
                  <Table
                    dataSource={subcategoryStats.slice(0, 10)}
                    rowKey={(record, index) => index}
                    pagination={false}
                    columns={[
                      {
                        title: '排名',
                        key: 'rank',
                        width: 80,
                        align: 'center',
                        render: (_, __, index) => {
                          const colors = ['#faad14', '#52c41a', '#1890ff']
                          const color = index < 3 ? colors[index] : '#666'
                          return <Text strong style={{ color, fontSize: 16 }}>{index + 1}</Text>
                        }
                      },
                      {
                        title: '二级类别',
                        dataIndex: 'subcategory',
                        key: 'subcategory',
                        width: 180
                      },
                      {
                        title: '一级类别',
                        dataIndex: 'category',
                        key: 'category',
                        width: 150
                      },
                      {
                        title: '所属阶段',
                        dataIndex: 'stage',
                        key: 'stage',
                        width: 120
                      },
                      {
                        title: '数据集数量',
                        dataIndex: 'datasetCount',
                        key: 'datasetCount',
                        width: 120,
                        align: 'right'
                      },
                      {
                        title: '数据集总Token (DST)',
                        dataIndex: 'tokenCount',
                        key: 'tokenCount',
                        width: 180,
                        align: 'right',
                        render: (val) => <Text strong style={{ color: '#faad14' }}>{val.toFixed(2)}</Text>
                      },
                      {
                        title: '实际使用Token (AUT)',
                        dataIndex: 'actualToken',
                        key: 'actualToken',
                        width: 180,
                        align: 'right',
                        render: (val) => <Text strong style={{ color: '#f5222d' }}>{val.toFixed(2)}</Text>
                      }
                    ]}
                    scroll={{ x: 1000 }}
                    size="small"
                  />
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>数据可视化分析</Title>
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
