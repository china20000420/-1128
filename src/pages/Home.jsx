import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Divider, Button, Modal, Form, Input, message, Popconfirm, Space } from 'antd'
import { DatabaseOutlined, FileTextOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { isAdmin } from '../utils/auth'

const { Title, Paragraph } = Typography
const { TextArea } = Input

export default function Home() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const res = await axios.get('/api/plans')
      setPlans(res.data.plans || [])
    } catch (error) {
      console.error('Load error:', error)
      message.error('加载计划列表失败')
    }
  }

  const handleAddPlan = () => {
    setEditingPlan(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEditPlan = (plan, e) => {
    e.stopPropagation()
    setEditingPlan(plan)
    form.setFieldsValue({
      name: plan.name,
      description: plan.description
    })
    setModalVisible(true)
  }

  const handleDeletePlan = async (planKey, e) => {
    e.stopPropagation()
    try {
      await axios.delete(`/api/plans/${planKey}`)
      message.success('删除成功')
      loadPlans()
      // Notify App.jsx to reload menu
      window.dispatchEvent(new Event('plansChanged'))
    } catch (error) {
      console.error('Delete error:', error)
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    try {
      if (editingPlan) {
        await axios.put(`/api/plans/${editingPlan.key}`, values)
        message.success('修改成功')
      } else {
        await axios.post('/api/plans', values)
        message.success('添加成功')
      }
      setModalVisible(false)
      loadPlans()
      // Notify App.jsx to reload menu
      window.dispatchEvent(new Event('plansChanged'))
    } catch (error) {
      console.error('Submit error:', error)
      message.error(editingPlan ? '修改失败' : '添加失败')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={2}>欢迎使用数据版本管理系统</Title>
          <Paragraph style={{ fontSize: 16, color: '#666' }}>
            管理大模型训练数据版本，支持多计划、多阶段的数据管理和Excel导入导出
          </Paragraph>
        </div>
        {isAdmin() && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddPlan}
            size="large"
          >
            创建新计划
          </Button>
        )}
      </div>

      <Divider />

      <Title level={3}>训练计划概览</Title>
      <Row gutter={[24, 24]}>
        {plans.map(plan => (
          <Col xs={24} sm={12} lg={8} key={plan.key}>
            <Card
              hoverable
              onClick={() => navigate(`/plan/${plan.key}`)}
              style={{ height: '100%' }}
              extra={isAdmin() && (
                <Space onClick={e => e.stopPropagation()}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => handleEditPlan(plan, e)}
                  />
                  <Popconfirm
                    title="确定删除此训练计划吗？"
                    onConfirm={(e) => handleDeletePlan(plan.key, e)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={e => e.stopPropagation()}
                    />
                  </Popconfirm>
                </Space>
              )}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <DatabaseOutlined style={{ fontSize: 32, color: '#1890ff', marginRight: 12 }} />
                <Title level={4} style={{ margin: 0 }}>{plan.name}</Title>
              </div>
              <Paragraph style={{ color: '#666', marginBottom: 16 }}>{plan.description}</Paragraph>
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>包含阶段：{plan.stage_count || 0} 个</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={editingPlan ? '编辑训练计划' : '创建新训练计划'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="计划名称"
            rules={[
              { required: true, message: '请输入计划名称' }
            ]}
          >
            <Input placeholder="例如：72B、训练计划1、下_iuhiu" disabled={!!editingPlan} />
          </Form.Item>
          <Form.Item
            name="description"
            label="计划描述"
            rules={[{ required: true, message: '请输入计划描述' }]}
          >
            <TextArea rows={4} placeholder="请输入计划描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
