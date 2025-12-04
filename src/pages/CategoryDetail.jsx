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
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        // 使用 raw: true 保持原始值，包括完整精度的数字
        const workbook = XLSX.read(data, { type: 'array', raw: true })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]

        // 手动读取每个单元格，保留原始文本
        const range = XLSX.utils.decode_range(sheet['!ref'])
        const jsonData = []

        for (let row = range.s.r; row <= range.e.r; row++) {
          const rowData = []
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
            const cell = sheet[cellAddress]

            if (!cell) {
              rowData.push('')
              continue
            }

            // 优先使用原始文本 w，如果没有则使用格式化值 v
            let cellValue = ''
            if (cell.w !== undefined) {
              cellValue = String(cell.w)  // 保留显示的文本，如 "8.125%"
            } else if (cell.v !== undefined) {
              cellValue = String(cell.v)
            }

            rowData.push(cellValue)
          }
          jsonData.push(rowData)
        }

        // 跳过标题行，生成数据行
        const newRows = jsonData.slice(1).filter(row => row.some(cell => cell)).map((row, idx) => ({
          key: Date.now() + idx,
          hdfs_path: String(row[0] || ''),
          obs_fuzzy_path: String(row[1] || ''),
          obs_full_path: String(row[2] || ''),
          token_count: String(row[3] || ''),
          actual_usage: String(row[4] || ''),
          actual_token: String(row[5] || '')
        }))

        if (newRows.length === 0) {
          message.warning('Excel文件中没有数据')
          return
        }

        // 【覆盖模式】先清空现有数据，然后导入新数据
        message.loading({ content: '正在清空现有数据...', key: 'import', duration: 0 })

        // 使用POST接口直接覆盖整个数据集
        try {
          const res = await axios.post(
            `/api/plans/${planName}/stages/${stageName}/categories/${categoryName}/${subcategoryName}`,
            {
              description: description, // 保留原有描述
              rows: newRows,
              tokenCountTotal: '0', // 后端会重新计算
              actualTokenTotal: '0'
            }
          )

          // 更新Token统计
          setTokenCountTotal(res.data.tokenCountTotal || '0')
          setActualTokenTotal(res.data.actualTokenTotal || '0')

          message.success({ content: `成功导入 ${newRows.length} 条数据（覆盖模式）`, key: 'import' })

          // 重新加载第一页数据
          setCurrentPage(1)
          loadData(1)
        } catch (error) {
          console.error('Import error:', error)
          message.error({ content: '导入失败: ' + (error.response?.data?.detail || error.message), key: 'import' })
        }

      } catch (error) {
        console.error('Import error:', error)
        message.error({ content: '导入失败: ' + error.message, key: 'import' })
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

      // 更新Token统计
      setTokenCountTotal(res.data.tokenCountTotal || '0')
      setActualTokenTotal(res.data.actualTokenTotal || '0')

      // 清空选中状态
      setSelectedRowKeys([])

      message.success(`成功删除 ${selectedRowKeys.length} 条数据`)

      // 重新加载当前页数据
      loadData(currentPage)
    } catch (error) {
      console.error('Delete error:', error)
      message.error('删除失败: ' + (error.response?.data?.detail || error.message))
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
