import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Input, Button, Card, List, Space, Modal, Form, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import axios from 'axios'
import { isAdmin } from '../utils/auth'

const { Title, Paragraph } = Typography
const { TextArea } = Input

export default function StageDetail() {
  const { planName, stageName } = useParams()
  const navigate = useNavigate()
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [subModalVisible, setSubModalVisible] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [currentCategory, setCurrentCategory] = useState(null)
  const [form] = Form.useForm()
  const [subForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [planName, stageName])

  useEffect(() => {
    if (!isAdmin()) return
    const timer = setTimeout(() => {
      saveData(true)
    }, 1000)
    return () => clearTimeout(timer)
  }, [description, categories])

  const loadData = async () => {
    try {
      const res = await axios.get(`/api/plans/${planName}/stages/${stageName}/categories`)
      setDescription(res.data.description || '')

      // Load categories with their totals
      const categoriesData = res.data.categories || []
      const categoriesWithTotals = await Promise.all(
        categoriesData.map(async (category) => {
          const subcategoriesWithTotals = await Promise.all(
            (category.subcategories || []).map(async (sub) => {
              try {
                const detailRes = await axios.get(
                  `/api/plans/${planName}/stages/${stageName}/categories/${encodeURIComponent(category.name)}/${encodeURIComponent(sub.name)}`
                )
                return {
                  ...sub,
                  tokenCountTotal: detailRes.data.tokenCountTotal || '0',
                  actualTokenTotal: detailRes.data.actualTokenTotal || '0'
                }
              } catch (error) {
                return {
                  ...sub,
                  tokenCountTotal: '0',
                  actualTokenTotal: '0'
                }
              }
            })
          )

          // Calculate category totals from subcategories
          const categoryTokenCount = subcategoriesWithTotals.reduce(
            (sum, sub) => sum + (parseFloat(sub.tokenCountTotal) || 0), 0
          ).toFixed(2)
          const categoryActualToken = subcategoriesWithTotals.reduce(
            (sum, sub) => sum + (parseFloat(sub.actualTokenTotal) || 0), 0
          ).toFixed(2)

          return {
            ...category,
            subcategories: subcategoriesWithTotals,
            tokenCountTotal: categoryTokenCount,
            actualTokenTotal: categoryActualToken
          }
        })
      )

      setCategories(categoriesWithTotals)
    } catch (error) {
      console.error('Load error:', error)
      message.error('加载数据失败')
    }
  }

  const saveData = async (isAutoSave = false) => {
    if (!isAdmin()) return
    try {
      await axios.post(`/api/plans/${planName}/stages/${stageName}/categories`, {
        description,
        categories
      })
      if (!isAutoSave) message.success('保存成功')
    } catch (error) {
      console.error('Save error:', error)
      if (!isAutoSave) message.error('保存失败')
    }
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    form.setFieldsValue({ name: category.name })
    setModalVisible(true)
  }

  const handleDeleteCategory = async (categoryId) => {
    const newCategories = categories.filter(c => c.id !== categoryId)
    setCategories(newCategories)
    message.success('删除成功')
    await axios.post(`/api/plans/${planName}/stages/${stageName}/categories`, {
      description,
      categories: newCategories
    })
  }

  const handleCategorySubmit = async () => {
    const values = await form.validateFields()
    let newCategories
    if (editingCategory) {
      newCategories = categories.map(c =>
        c.id === editingCategory.id ? { ...c, name: values.name } : c
      )
      setCategories(newCategories)
      message.success('修改成功')
    } else {
      const newCategory = {
        id: Date.now(),
        name: values.name,
        subcategories: []
      }
      newCategories = [...categories, newCategory]
      setCategories(newCategories)
      message.success('添加成功')
    }
    setModalVisible(false)
    await axios.post(`/api/plans/${planName}/stages/${stageName}/categories`, {
      description,
      categories: newCategories
    })
  }

  const handleAddSubcategory = (category) => {
    setCurrentCategory(category)
    setEditingSubcategory(null)
    subForm.resetFields()
    setSubModalVisible(true)
  }

  const handleEditSubcategory = (category, subcategory) => {
    setCurrentCategory(category)
    setEditingSubcategory(subcategory)
    subForm.setFieldsValue({ name: subcategory.name })
    setSubModalVisible(true)
  }

  const handleDeleteSubcategory = async (categoryId, subcategoryId) => {
    const newCategories = categories.map(c =>
      c.id === categoryId
        ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subcategoryId) }
        : c
    )
    setCategories(newCategories)
    message.success('删除成功')
    await axios.post(`/api/plans/${planName}/stages/${stageName}/categories`, {
      description,
      categories: newCategories
    })
  }

  const handleSubcategorySubmit = async () => {
    const values = await subForm.validateFields()
    let newCategories
    if (editingSubcategory) {
      newCategories = categories.map(c =>
        c.id === currentCategory.id
          ? {
              ...c,
              subcategories: c.subcategories.map(s =>
                s.id === editingSubcategory.id ? { ...s, name: values.name } : s
              )
            }
          : c
      )
      setCategories(newCategories)
      message.success('修改成功')
    } else {
      const newSubcategory = {
        id: Date.now(),
        name: values.name
      }
      newCategories = categories.map(c =>
        c.id === currentCategory.id
          ? { ...c, subcategories: [...(c.subcategories || []), newSubcategory] }
          : c
      )
      setCategories(newCategories)
      message.success('添加成功')
    }
    setSubModalVisible(false)
    await axios.post(`/api/plans/${planName}/stages/${stageName}/categories`, {
      description,
      categories: newCategories
    })
  }

  const stageTitle = {
    stage1: 'Stage 1',
    stage2: 'Stage 2',
    stage3: 'Stage 3',
    stage4: 'Stage 4'
  }[stageName] || stageName

  return (
    <div>
      <Title level={2}>{planName.toUpperCase()}/{stageTitle} - 类别管理</Title>

      <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <div style={{ marginBottom: 8, fontWeight: 'bold' }}>阶段说明：</div>
        {isAdmin() ? (
          <TextArea
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="输入阶段说明..."
          />
        ) : (
          <Paragraph>{description || '暂无说明'}</Paragraph>
        )}
      </div>

      {isAdmin() && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddCategory}
          style={{ marginBottom: 16 }}
        >
          添加一级类别
        </Button>
      )}

      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
        dataSource={categories}
        renderItem={category => (
          <List.Item>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span>{category.name}</span>
                    <div style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginTop: 4 }}>
                      数据集总token: {category.tokenCountTotal || '0'} | 实际使用token: {category.actualTokenTotal || '0'}
                    </div>
                  </div>
                  {isAdmin() && (
                    <Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditCategory(category)}
                      />
                      <Popconfirm
                        title="确定删除此一级类别及其所有二级类别吗？"
                        onConfirm={() => handleDeleteCategory(category.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  )}
                </div>
              }
              size="small"
            >
              {isAdmin() && (
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddSubcategory(category)}
                  style={{ marginBottom: 8, width: '100%' }}
                >
                  添加二级类别
                </Button>
              )}
              <List
                size="small"
                dataSource={category.subcategories || []}
                locale={{ emptyText: <div style={{ padding: '8px 0', fontSize: '12px', color: '#999' }}>暂无数据</div> }}
                renderItem={sub => (
                  <List.Item
                    actions={isAdmin() ? [
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditSubcategory(category, sub)}
                      />,
                      <Popconfirm
                        title="确定删除此二级类别吗？"
                        onConfirm={() => handleDeleteSubcategory(category.id, sub.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    ] : []}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <a
                        onClick={() => navigate(`/plan/${planName}/${stageName}/${encodeURIComponent(category.name)}/${encodeURIComponent(sub.name)}`)}
                        style={{ cursor: 'pointer', color: '#1890ff' }}
                      >
                        {sub.name}
                      </a>
                      <span style={{ fontSize: '11px', color: '#999', marginLeft: 8 }}>
                        DST: {sub.tokenCountTotal || '0'} | AUT: {sub.actualTokenTotal || '0'}
                      </span>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title={editingCategory ? '编辑一级类别' : '添加一级类别'}
        open={modalVisible}
        onOk={handleCategorySubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="类别名称"
            rules={[{ required: true, message: '请输入类别名称' }]}
          >
            <Input placeholder="请输入类别名称" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSubcategory ? '编辑二级类别' : '添加二级类别'}
        open={subModalVisible}
        onOk={handleSubcategorySubmit}
        onCancel={() => setSubModalVisible(false)}
      >
        <Form form={subForm} layout="vertical">
          <Form.Item
            name="name"
            label="子类别名称"
            rules={[{ required: true, message: '请输入子类别名称' }]}
          >
            <Input placeholder="请输入子类别名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
