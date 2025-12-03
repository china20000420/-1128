import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Typography, Input, Button, Table, Upload, Space, message, Modal } from 'antd'
import { DownloadOutlined, UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import axios from 'axios'
import { isAdmin } from '../utils/auth'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const EditableCell = ({ value, record, dataIndex, onSave }) => {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const inputRef = useRef(null)
  const clickTimer = useRef(null)
  const clickCount = useRef(0)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])

  const handleSave = () => {
    setEditing(false)
    if (inputValue !== value) {
      onSave(record.key, dataIndex, inputValue)
    }
  }

  const handleClick = () => {
    if (!isAdmin()) return

    clickCount.current += 1

    if (clickCount.current === 1) {
      clickTimer.current = setTimeout(() => {
        clickCount.current = 0
      }, 300)
    } else if (clickCount.current === 2) {
      clearTimeout(clickTimer.current)
      clickCount.current = 0
      setEditing(true)
    }
  }

  if (!isAdmin()) {
    if (value === '' || value === null || value === undefined) return <span style={{ color: '#ccc' }}>-</span>
    return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{value}</span>
  }

  if (editing) {
    return (
      <TextArea
        ref={inputRef}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onBlur={handleSave}
        autoSize={{ minRows: 2, maxRows: 10 }}
        style={{ margin: '-5px 0' }}
      />
    )
  }

  return (
    <div
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        minHeight: 22,
        padding: '4px 0',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
    >
      {(value !== '' && value !== null && value !== undefined) ? value : <span style={{ color: '#ccc' }}>双击编辑</span>}
    </div>
  )
}

export default function CategoryDetail() {
  const { planName, stageName, categoryName, subcategoryName } = useParams()
  const [description, setDescription] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [tokenCountTotal, setTokenCountTotal] = useState('0')
  const [actualTokenTotal, setActualTokenTotal] = useState('0')
  const autoSaveTimer = useRef(null)

  const stageTitle = {
    stage1: 'Stage 1',
    stage2: 'Stage 2',
    stage3: 'Stage 3',
    stage4: 'Stage 4'
  }[stageName] || stageName

  useEffect(() => {
    loadData()
  }, [planName, stageName, categoryName, subcategoryName, currentPage, pageSize])

  useEffect(() => {
    if (!isAdmin()) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      saveData(true)
    }, 500)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [description])

  const loadData = async () => {
    try {
      const res = await axios.get(`/api/plans/${planName}/stages/${stageName}/categories/${categoryName}/${subcategoryName}`, {
        params: { page: currentPage, page_size: pageSize }
      })
      setDescription(res.data.description || '')
      setRows(res.data.rows || [])
      setTotal(res.data.total || 0)
      setTokenCountTotal(res.data.tokenCountTotal || '0')
      setActualTokenTotal(res.data.actualTokenTotal || '0')
    } catch (error) {
      console.error('Load error:', error)
      message.error('加载数据失败')
    }
  }

  const saveData = async (isAutoSave = false) => {
    if (!isAdmin()) return
    try {
      await axios.patch(`/api/plans/${planName}/stages/${stageName}/categories/${categoryName}/${subcategoryName}/description`, {
        description
      })
      if (!isAutoSave) message.success('保存成功')
    } catch (error) {
      console.error('Save error:', error)
      if (!isAutoSave) message.error('保存失败')
    }
  }

  const handleCellSave = async (key, dataIndex, value) => {
    const updatedRow = rows.find(r => r.key === key)
    if (!updatedRow) return

    const newRow = { ...updatedRow, [dataIndex]: value }
    setRows(prev => prev.map(row => row.key === key ? newRow : row))

    try {
      const res = await axios.patch(`/api/plans/${planName}/stages/${stageName}/categories/${categoryName}/${subcategoryName}/row`, newRow)
      setTokenCountTotal(res.data.tokenCountTotal)
      setActualTokenTotal(res.data.actualTokenTotal)
    } catch (error) {
      console.error('Update error:', error)
      message.error('更新失败')
    }
  }

  const handleRowClick = (record) => {
    setExpandedRowKeys(prev => {
      if (prev.includes(record.key)) {
        return prev.filter(key => key !== record.key)
      } else {
        return [...prev, record.key]
      }
    })
  }

  const expandedRowRender = (record) => {
    return (
      <div style={{ padding: '16px', background: '#fafafa', borderRadius: 4 }}>
        <div style={{ marginBottom: 12 }}>
          <Text strong>v3词表hdfs路径：</Text>
          <div style={{ marginTop: 4, padding: 8, background: '#fff', borderRadius: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {record.hdfs_path || '-'}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Text strong>obs模糊路径：</Text>
          <div style={{ marginTop: 4, padding: 8, background: '#fff', borderRadius: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {record.obs_fuzzy_path || '-'}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Text strong>obs补全路径：</Text>
          <div style={{ marginTop: 4, padding: 8, background: '#fff', borderRadius: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {record.obs_full_path || '-'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <Text strong>数据集总token：</Text>
            <Text style={{ marginLeft: 8 }}>{record.token_count || '-'}</Text>
          </div>
          <div>
            <Text strong>实际使用：</Text>
            <Text style={{ marginLeft: 8 }}>{record.actual_usage || '-'}</Text>
          </div>
          <div>
            <Text strong>实际使用token：</Text>
            <Text style={{ marginLeft: 8 }}>{record.actual_token || '-'}</Text>
          </div>
        </div>
      </div>
    )
  }

  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      fixed: 'left',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1
    },
    {
      title: 'v3词表hdfs路径',
      dataIndex: 'hdfs_path',
      key: 'hdfs_path',
      width: 300,
      ellipsis: true,
      render: (value, record) => (
        <div style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 280
        }}>
          {value || '-'}
        </div>
      )
    },
    {
      title: 'obs模糊路径',
      dataIndex: 'obs_fuzzy_path',
      key: 'obs_fuzzy_path',
      width: 300,
      ellipsis: true,
      render: (value) => (
        <div style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 280
        }}>
          {value || '-'}
        </div>
      )
    },
    {
      title: '数据集总token',
      dataIndex: 'token_count',
      key: 'token_count',
      width: 150,
      render: (value, record) => (
        <EditableCell
          value={value}
          record={record}
          dataIndex="token_count"
          onSave={handleCellSave}
        />
      )
    },
    {
      title: '实际使用',
      dataIndex: 'actual_usage',
      key: 'actual_usage',
      width: 120,
      render: (value, record) => (
        <EditableCell
          value={value}
          record={record}
          dataIndex="actual_usage"
          onSave={handleCellSave}
        />
      )
    },
    {
      title: '实际使用token',
      dataIndex: 'actual_token',
      key: 'actual_token',
      width: 150,
      render: (value, record) => (
        <EditableCell
          value={value}
          record={record}
          dataIndex="actual_token"
          onSave={handleCellSave}
        />
      )
    }
  ]

  const downloadTemplate = () => {
    const headers = ['v3词表hdfs路径', 'obs模糊路径', 'obs补全路径', '数据集总token', '实际使用', '实际使用token']
    const ws = XLSX.utils.aoa_to_sheet([headers])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'category_data_template.xlsx')
    message.success('模板下载成功')
  }

  const downloadExcel = async () => {
    try {
      // 获取所有数据（不分页）
      const res = await axios.get(`/api/plans/${planName}/stages/${stageName}/categories/${categoryName}/${subcategoryName}`, {
        params: { page: 1, page_size: 999999 }
      })
      const allRows = res.data.rows || []

      const headers = ['v3词表hdfs路径', 'obs模糊路径', 'obs补全路径', '数据集总token', '实际使用', '实际使用token']
      const data = allRows.map(row => [
        row.hdfs_path || '',
        row.obs_fuzzy_path || '',
        row.obs_full_path || '',
        row.token_count || '',
        row.actual_usage || '',
        row.actual_token || ''
      ])

      const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Data')

      const filename = `${planName}_${stageName}_${decodeURIComponent(categoryName)}_${decodeURIComponent(subcategoryName)}_数据表.xlsx`
      XLSX.writeFile(wb, filename)
      message.success('导出成功')
    } catch (error) {
      console.error('Export error:', error)
      message.error('导出失败')
    }
  }

  const handleImport = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array', raw: false, cellText: true })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })

        const newRows = jsonData.slice(1).map((row, idx) => ({
          key: Date.now() + idx,
          hdfs_path: String(row[0] || ''),
          obs_fuzzy_path: String(row[1] || ''),
          obs_full_path: String(row[2] || ''),
          token_count: String(row[3] || ''),
          actual_usage: String(row[4] || ''),
          actual_token: String(row[5] || '')
        }))

        setRows(newRows)
        message.success('导入成功')
      } catch (error) {
        console.error('Import error:', error)
        message.error('导入失败: ' + error.message)
      }
    }
    reader.readAsArrayBuffer(file)
    return false
  }

  const insertRow = async () => {
    const newRow = {
      key: Date.now(),
      hdfs_path: '',
      obs_fuzzy_path: '',
      obs_full_path: '',
      token_count: '',
      actual_usage: '',
      actual_token: ''
    }

    try {
      await axios.patch(`/api/plans/${planName}/stages/${stageName}/categories/${categoryName}/${subcategoryName}/row`, newRow)
      setRows(prev => [...prev, newRow])
      setTotal(prev => prev + 1)
      message.success('已插入空行')
    } catch (error) {
      console.error('Insert error:', error)
      message.error('插入失败')
    }
  }

  const deleteRows = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的行')
      return
    }

    try {
      const res = await axios.delete(`/api/plans/${planName}/stages/${stageName}/categories/${categoryName}/${subcategoryName}/rows`, {
        data: { keys: selectedRowKeys }
      })

      setTotal(res.data.total)
      setTokenCountTotal(res.data.tokenCountTotal)
      setActualTokenTotal(res.data.actualTokenTotal)
      setRows(prev => prev.filter(row => !selectedRowKeys.includes(row.key)))
      setSelectedRowKeys([])
      setExpandedRowKeys(prev => prev.filter(key => !selectedRowKeys.includes(key)))
      message.success('删除成功')

      // 如果当前页没有数据了，回到上一页
      if (rows.length === selectedRowKeys.length && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else {
        loadData()
      }
    } catch (error) {
      console.error('Delete error:', error)
      message.error('删除失败')
    }
  }

  return (
    <div>
      <Title level={2}>
        {planName.toUpperCase()}/{stageTitle}/{decodeURIComponent(categoryName)}/{decodeURIComponent(subcategoryName)} - 数据表
        <span style={{ fontSize: '16px', fontWeight: 'normal', marginLeft: '20px', color: '#666' }}>
          数据集总token累计为：{tokenCountTotal}，实际使用token累计为：{actualTokenTotal}
        </span>
      </Title>

      <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <div style={{ marginBottom: 8, fontWeight: 'bold' }}>说明：</div>
        {isAdmin() ? (
          <TextArea
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="输入说明..."
          />
        ) : (
          <Paragraph>{description || '暂无说明'}</Paragraph>
        )}
      </div>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>下载模板</Button>
        <Button icon={<DownloadOutlined />} onClick={downloadExcel} type="primary">导出Excel</Button>
        {isAdmin() && (
          <>
            <Upload beforeUpload={handleImport} showUploadList={false}>
              <Button icon={<UploadOutlined />}>导入Excel</Button>
            </Upload>
            <Button icon={<PlusOutlined />} onClick={insertRow}>插入空行</Button>
            <Button icon={<DeleteOutlined />} danger onClick={deleteRows}>删除选中</Button>
          </>
        )}
      </Space>

      <div style={{ marginBottom: 8, color: '#666', fontSize: 12 }}>
        提示：单击行展开查看完整内容，双击单元格可编辑数据
      </div>

      <Table
        columns={columns}
        dataSource={rows}
        rowKey="key"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (page, size) => {
            setCurrentPage(page)
            setPageSize(size)
          }
        }}
        bordered
        size="small"
        scroll={{ x: 1200 }}
        rowSelection={isAdmin() ? {
          selectedRowKeys,
          onChange: setSelectedRowKeys
        } : undefined}
        expandable={{
          expandedRowKeys,
          onExpand: (expanded, record) => handleRowClick(record),
          expandedRowRender,
          expandIcon: () => null
        }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' }
        })}
      />
    </div>
  )
}
