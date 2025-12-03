import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Typography, Input, Button, Collapse, Table, Upload, Space, message, Modal, Form, Popconfirm } from 'antd'
import { DownloadOutlined, UploadOutlined, PlusOutlined, DeleteOutlined, MergeCellsOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import axios from 'axios'
import { isAdmin } from '../utils/auth'

const { Title, Paragraph } = Typography
const { TextArea } = Input
const { Panel } = Collapse

export default function PlanDetail() {
  const navigate = useNavigate()
  const { planName } = useParams()
  const [description, setDescription] = useState('')
  const [stages, setStages] = useState({})
  const [stagesList, setStagesList] = useState([])
  const [selectedRows, setSelectedRows] = useState({})
  const [selectedCells, setSelectedCells] = useState({})
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [editingCell, setEditingCell] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stageModalVisible, setStageModalVisible] = useState(false)
  const [editingStage, setEditingStage] = useState(null)
  const [form] = Form.useForm()
  const autoSaveTimer = useRef(null)

  useEffect(() => {
    loadData()
  }, [planName])

  useEffect(() => {
    if (!isAdmin()) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      saveData(true)
    }, 500)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [description, stages])

  const loadData = async () => {
    try {
      const res = await axios.get(`/api/plan${planName}`)
      setDescription(res.data.description || '')
      const stagesData = res.data.stages || {}
      Object.keys(stagesData).forEach(key => {
        if (!stagesData[key].rows) stagesData[key].rows = []
        if (!stagesData[key].merges) stagesData[key].merges = []
      })
      setStages(stagesData)
      // Convert stages object to list for rendering
      const list = Object.keys(stagesData).map(key => ({ key, name: key }))
      setStagesList(list)
    } catch (error) {
      console.error('Load error:', error)
      message.error('加载数据失败')
    }
  }

  const saveData = async (isAutoSave = false) => {
    if (!isAdmin()) return
    setLoading(true)
    try {
      await axios.post(`/api/plan${planName}`, { description, stages })
      if (!isAutoSave) message.success('保存成功')
    } catch (error) {
      console.error('Save error:', error)
      if (!isAutoSave) message.error('保存失败')
    }
    setLoading(false)
  }

  const handleAddStage = () => {
    setEditingStage(null)
    form.resetFields()
    setStageModalVisible(true)
  }

  const handleEditStage = (stage) => {
    setEditingStage(stage)
    form.setFieldsValue({ name: stage.key })
    setStageModalVisible(true)
  }

  const handleDeleteStage = async (stageKey) => {
    const newStages = { ...stages }
    delete newStages[stageKey]
    setStages(newStages)
    setStagesList(stagesList.filter(s => s.key !== stageKey))
    message.success('删除成功')
    // Save and notify
    await axios.post(`/api/plan${planName}`, { description, stages: newStages })
    window.dispatchEvent(new Event('plansChanged'))
  }

  const handleStageSubmit = async () => {
    const values = await form.validateFields()
    const stageName = values.name.toLowerCase()

    if (editingStage) {
      // Rename stage
      const newStages = {}
      Object.keys(stages).forEach(key => {
        if (key === editingStage.key) {
          newStages[stageName] = stages[key]
        } else {
          newStages[key] = stages[key]
        }
      })
      setStages(newStages)
      setStagesList(stagesList.map(s => s.key === editingStage.key ? { key: stageName, name: stageName } : s))
      message.success('修改成功')
      await axios.post(`/api/plan${planName}`, { description, stages: newStages })
    } else {
      // Add new stage
      if (stages[stageName]) {
        message.error('Stage名称已存在')
        return
      }

      // 找到最后一个stage作为模板
      const lastStageKey = stagesList.length > 0 ? stagesList[stagesList.length - 1].key : null

      // 先创建空stage
      const newStages = { ...stages, [stageName]: { rows: [], merges: [] } }
      setStages(newStages)
      setStagesList([...stagesList, { key: stageName, name: stageName }])

      // 保存新stage
      await axios.post(`/api/plan${planName}`, { description, stages: newStages })

      // 如果有上一个stage，复制其类别结构
      if (lastStageKey) {
        try {
          // 获取上一个stage的类别结构
          const categoriesRes = await axios.get(`/api/plans/${planName}/stages/${lastStageKey}/categories`)
          const templateCategories = categoriesRes.data.categories || []

          // 复制类别结构（不包含数据）
          const newCategories = templateCategories.map(cat => ({
            ...cat,
            subcategories: (cat.subcategories || []).map(sub => ({
              id: Date.now() + Math.random(), // 生成新的ID
              name: sub.name
            }))
          }))

          // 保存新stage的类别结构
          await axios.post(`/api/plans/${planName}/stages/${stageName}/categories`, {
            description: categoriesRes.data.description || '',
            categories: newCategories
          })

          message.success(`添加成功，已复制 ${lastStageKey.toUpperCase()} 的类别结构`)
        } catch (error) {
          console.error('复制类别结构失败:', error)
          message.success('添加成功')
        }
      } else {
        message.success('添加成功')
      }
    }
    setStageModalVisible(false)
    window.dispatchEvent(new Event('plansChanged'))
  }

  const columns = [
    { title: '类别', dataIndex: 'category', key: 'category', width: 100 },
    { title: '子类别', dataIndex: 'subcategory', key: 'subcategory', width: 100 },
    { title: '总token数', dataIndex: 'total_tokens', key: 'total_tokens', width: 110 },
    { title: '本次采样比例', dataIndex: 'sample_ratio', key: 'sample_ratio', width: 120 },
    { title: '累计比例', dataIndex: 'cumulative_ratio', key: 'cumulative_ratio', width: 100 },
    { title: '本次采样token数', dataIndex: 'sample_tokens', key: 'sample_tokens', width: 140 },
    { title: '本次采样后类别占比', dataIndex: 'category_ratio', key: 'category_ratio', width: 160 },
    { title: '交付part1', dataIndex: 'part1', key: 'part1', width: 100 },
    { title: '交付part2', dataIndex: 'part2', key: 'part2', width: 100 },
    { title: '交付part3', dataIndex: 'part3', key: 'part3', width: 100 },
    { title: '交付part4', dataIndex: 'part4', key: 'part4', width: 100 },
    { title: '交付part5', dataIndex: 'part5', key: 'part5', width: 100 },
    { title: '备注', dataIndex: 'note', key: 'note', width: 150 }
  ]

  const downloadTemplate = () => {
    const headers = columns.map(col => col.title)
    const ws = XLSX.utils.aoa_to_sheet([headers])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'stage_template.xlsx')
    message.success('模板下载成功')
  }

  const downloadStageExcel = (stageKey) => {
    const stageData = stages[stageKey]
    if (!stageData || !stageData.rows || stageData.rows.length === 0) {
      message.warning('该阶段暂无数据')
      return
    }

    const headers = columns.map(col => col.title)
    const data = stageData.rows.map(row => [
      row.category || '',
      row.subcategory || '',
      row.total_tokens || '',
      row.sample_ratio || '',
      row.cumulative_ratio || '',
      row.sample_tokens || '',
      row.category_ratio || '',
      row.part1 || '',
      row.part2 || '',
      row.part3 || '',
      row.part4 || '',
      row.part5 || '',
      row.note || ''
    ])

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')

    const filename = `${planName}_${stageKey}_概览表.xlsx`
    XLSX.writeFile(wb, filename)
    message.success('导出成功')
  }

  const handleImport = (file, stageKey) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

        const merges = sheet['!merges'] || []
        const mergeInfo = merges.map(m => ({
          startRow: m.s.r - 1,
          endRow: m.e.r - 1,
          startCol: m.s.c,
          endCol: m.e.c
        }))

        const formatCell = (value, colIdx, rowIdx) => {
          if (value === '' || value === null || value === undefined) return ''

          // 获取实际单元格引用
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx })
          const cell = sheet[cellRef]

          // 如果是数字类型
          if (typeof value === 'number') {
            // 检查是否是百分比格式
            if (cell && cell.z && (cell.z.includes('%') || cell.z.includes('0.00%'))) {
              // 如果原始值已经是小数（如0.5代表50%），直接乘100
              return (value * 100) + '%'
            }

            // 处理科学计数法：转换为普通数字字符串
            if (Math.abs(value) < 1 && Math.abs(value) > 0) {
              // 小数：保留足够的精度
              return value.toFixed(10).replace(/\.?0+$/, '')
            } else if (Math.abs(value) >= 1000000) {
              // 大数：保持原样但转为字符串
              return value.toString()
            } else {
              // 普通数字
              return value.toString()
            }
          }

          return String(value)
        }

        const rows = jsonData.slice(1).map((row, idx) => ({
          key: Date.now() + idx,
          category: formatCell(row[0], 0, idx),
          subcategory: formatCell(row[1], 1, idx),
          total_tokens: formatCell(row[2], 2, idx),
          sample_ratio: formatCell(row[3], 3, idx),
          cumulative_ratio: formatCell(row[4], 4, idx),
          sample_tokens: formatCell(row[5], 5, idx),
          category_ratio: formatCell(row[6], 6, idx),
          part1: formatCell(row[7], 7, idx),
          part2: formatCell(row[8], 8, idx),
          part3: formatCell(row[9], 9, idx),
          part4: formatCell(row[10], 10, idx),
          part5: formatCell(row[11], 11, idx),
          note: formatCell(row[12], 12, idx)
        }))

        setStages(prev => ({ ...prev, [stageKey]: { rows, merges: mergeInfo } }))
        message.success('导入成功，已保留合并单元格')
      } catch (error) {
        console.error('Import error:', error)
        message.error('导入失败: ' + error.message)
      }
    }
    reader.readAsArrayBuffer(file)
    return false
  }

  const insertRow = (stageKey) => {
    const newRow = {
      key: Date.now(),
      category: '', subcategory: '', total_tokens: '', sample_ratio: '',
      cumulative_ratio: '', sample_tokens: '', category_ratio: '',
      part1: '', part2: '', part3: '', part4: '', part5: '', note: ''
    }
    setStages(prev => ({
      ...prev,
      [stageKey]: { ...prev[stageKey], rows: [...prev[stageKey].rows, newRow] }
    }))
    message.success('已插入空行')
  }

  const deleteRows = (stageKey) => {
    const selected = selectedRows[stageKey] || []
    if (selected.length === 0) {
      message.warning('请选择要删除的行')
      return
    }

    const stageData = stages[stageKey]
    const deletedIndices = stageData.rows
      .map((row, idx) => selected.includes(row.key) ? idx : -1)
      .filter(idx => idx !== -1)
      .sort((a, b) => a - b)

    const newRows = stageData.rows.filter(row => !selected.includes(row.key))

    const newMerges = (stageData.merges || [])
      .map(merge => {
        let newStartRow = merge.startRow
        let newEndRow = merge.endRow

        deletedIndices.forEach(deletedIdx => {
          if (deletedIdx < merge.startRow) {
            newStartRow--
            newEndRow--
          } else if (deletedIdx >= merge.startRow && deletedIdx <= merge.endRow) {
            newEndRow--
          }
        })

        if (newEndRow < newStartRow) return null
        return { ...merge, startRow: newStartRow, endRow: newEndRow }
      })
      .filter(merge => merge !== null)

    setStages(prev => ({
      ...prev,
      [stageKey]: {
        ...prev[stageKey],
        rows: newRows,
        merges: newMerges
      }
    }))
    setSelectedRows(prev => ({ ...prev, [stageKey]: [] }))
    message.success('删除成功')
  }

  const mergeCells = (stageKey) => {
    const selected = selectedCells[stageKey] || []
    if (selected.length < 2) {
      message.warning('请选择至少2个单元格进行合并')
      return
    }

    const rowIndices = [...new Set(selected.map(c => c.row))]
    const colIndices = [...new Set(selected.map(c => c.col))]

    const newMerge = {
      startRow: Math.min(...rowIndices),
      endRow: Math.max(...rowIndices),
      startCol: Math.min(...colIndices),
      endCol: Math.max(...colIndices)
    }

    setStages(prev => ({
      ...prev,
      [stageKey]: {
        ...prev[stageKey],
        merges: [...(prev[stageKey].merges || []), newMerge]
      }
    }))
    setSelectedCells(prev => ({ ...prev, [stageKey]: [] }))
    message.success('单元格已合并')
  }

  const unmergeCells = (stageKey) => {
    const selected = selectedCells[stageKey] || []
    if (selected.length === 0) {
      message.warning('请选择要取消合并的单元格')
      return
    }

    const stageData = stages[stageKey]
    const newMerges = (stageData.merges || []).filter(merge => {
      return !selected.some(cell =>
        cell.row >= merge.startRow && cell.row <= merge.endRow &&
        cell.col >= merge.startCol && cell.col <= merge.endCol
      )
    })

    setStages(prev => ({
      ...prev,
      [stageKey]: {
        ...prev[stageKey],
        merges: newMerges
      }
    }))
    setSelectedCells(prev => ({ ...prev, [stageKey]: [] }))
    message.success('已取消合并')
  }

  const handleCellMouseDown = (stageKey, rowIdx, colIdx, e) => {
    if (!isAdmin() || editingCell) return

    if (e.target.closest('.ant-checkbox-wrapper') || e.target.closest('.ant-table-selection-column')) return

    if (e.detail === 2) return

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setSelectedCells(prev => {
        const current = prev[stageKey] || []
        const exists = current.find(c => c.row === rowIdx && c.col === colIdx)
        if (exists) {
          return { ...prev, [stageKey]: current.filter(c => !(c.row === rowIdx && c.col === colIdx)) }
        } else {
          return { ...prev, [stageKey]: [...current, { row: rowIdx, col: colIdx }] }
        }
      })
    } else {
      setIsDragging(true)
      setDragStart({ stageKey, row: rowIdx, col: colIdx })
      setSelectedCells({ [stageKey]: [{ row: rowIdx, col: colIdx }] })
    }
  }

  const handleCellMouseEnter = (stageKey, rowIdx, colIdx) => {
    if (!isDragging || !dragStart || dragStart.stageKey !== stageKey) return

    const minRow = Math.min(dragStart.row, rowIdx)
    const maxRow = Math.max(dragStart.row, rowIdx)
    const minCol = Math.min(dragStart.col, colIdx)
    const maxCol = Math.max(dragStart.col, colIdx)

    const cells = []
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        cells.push({ row: r, col: c })
      }
    }
    setSelectedCells({ [stageKey]: cells })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
  }

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  const isCellSelected = (stageKey, rowIdx, colIdx) => {
    const selected = selectedCells[stageKey] || []
    return selected.some(c => c.row === rowIdx && c.col === colIdx)
  }

  const handleCellEdit = (stageKey, recordKey, dataIndex, value) => {
    setStages(prev => ({
      ...prev,
      [stageKey]: {
        ...prev[stageKey],
        rows: prev[stageKey].rows.map(row =>
          row.key === recordKey ? { ...row, [dataIndex]: value } : row
        )
      }
    }))
  }

  const getCellMergeInfo = (stageKey, rowIndex, colIndex) => {
    const stageData = stages[stageKey]
    if (!stageData || !stageData.merges) return null

    for (const merge of stageData.merges) {
      if (rowIndex >= merge.startRow && rowIndex <= merge.endRow &&
          colIndex >= merge.startCol && colIndex <= merge.endCol) {
        if (rowIndex === merge.startRow && colIndex === merge.startCol) {
          return {
            rowSpan: merge.endRow - merge.startRow + 1,
            colSpan: merge.endCol - merge.startCol + 1
          }
        }
        return { rowSpan: 0, colSpan: 0 }
      }
    }
    return null
  }

  const EditableCell = ({ editing, dataIndex, record, children, stageKey, rowIndex, colIndex, ...restProps }) => {
    const [value, setValue] = useState(record?.[dataIndex] || '')

    useEffect(() => {
      setValue(record?.[dataIndex] || '')
    }, [record, dataIndex])

    const save = () => {
      handleCellEdit(stageKey, record.key, dataIndex, value)
      setEditingCell(null)
    }

    const isSelected = isCellSelected(stageKey, rowIndex, colIndex)
    const mergeInfo = getCellMergeInfo(stageKey, rowIndex, colIndex)

    if (mergeInfo && (mergeInfo.rowSpan === 0 || mergeInfo.colSpan === 0)) {
      return null
    }

    return (
      <td
        {...restProps}
        rowSpan={mergeInfo?.rowSpan || 1}
        colSpan={mergeInfo?.colSpan || 1}
        onMouseDown={(e) => handleCellMouseDown(stageKey, rowIndex, colIndex, e)}
        onMouseEnter={() => handleCellMouseEnter(stageKey, rowIndex, colIndex)}
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (isAdmin()) {
            setEditingCell({ key: record.key, field: dataIndex })
          }
        }}
        style={{
          ...restProps.style,
          backgroundColor: isSelected ? '#e6f7ff' : undefined,
          cursor: isAdmin() ? (editing ? 'text' : 'cell') : 'default',
          userSelect: 'none'
        }}
      >
        {editing ? (
          <Input
            value={value}
            onChange={e => setValue(e.target.value)}
            onPressEnter={save}
            onBlur={save}
            autoFocus
            size="small"
          />
        ) : (
          <div>{children}</div>
        )}
      </td>
    )
  }

  const mergedColumns = (stageKey) => columns.map((col, colIdx) => ({
    ...col,
    onCell: (record, rowIdx) => ({
      record,
      dataIndex: col.dataIndex,
      editing: editingCell?.key === record.key && editingCell?.field === col.dataIndex,
      stageKey,
      rowIndex: rowIdx,
      colIndex: colIdx
    })
  }))

  const renderStageTable = (stage) => {
    const stageKey = stage.key
    const stageName = stage.name.toUpperCase()
    const stageData = stages[stageKey] || { rows: [], merges: [] }

    return (
      <Panel
        header={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>{stageName}</span>
            <Space>
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={(e) => { e.stopPropagation(); navigate(`/plan/${planName}/${stageKey}`) }}
              >
                查看详情
              </Button>
              {isAdmin() && (
                <>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => { e.stopPropagation(); handleEditStage(stage) }}
                  />
                  <Popconfirm
                    title="确定删除此Stage吗？会删除所有相关数据！"
                    onConfirm={(e) => { e?.stopPropagation(); handleDeleteStage(stageKey) }}
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
                </>
              )}
            </Space>
          </div>
        }
        key={stageKey}
      >
        <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>下载模板</Button>
          <Button icon={<DownloadOutlined />} onClick={() => downloadStageExcel(stageKey)} type="primary">导出Excel</Button>
          {isAdmin() && (
            <>
              <Upload beforeUpload={(file) => handleImport(file, stageKey)} showUploadList={false}>
                <Button icon={<UploadOutlined />}>导入Excel</Button>
              </Upload>
              <Button icon={<PlusOutlined />} onClick={() => insertRow(stageKey)}>插入空行</Button>
              <Button icon={<DeleteOutlined />} danger onClick={() => deleteRows(stageKey)}>删除选中</Button>
              <Button icon={<MergeCellsOutlined />} onClick={() => mergeCells(stageKey)}>合并单元格</Button>
              <Button onClick={() => unmergeCells(stageKey)}>取消合并</Button>
            </>
          )}
        </Space>
        <Table
          components={{ body: { cell: EditableCell } }}
          columns={mergedColumns(stageKey)}
          dataSource={stageData.rows}
          rowKey="key"
          pagination={false}
          bordered
          size="small"
          style={{ width: '100%' }}
          rowSelection={isAdmin() ? {
            selectedRowKeys: selectedRows[stageKey] || [],
            onChange: (keys) => setSelectedRows(prev => ({ ...prev, [stageKey]: keys }))
          } : undefined}
        />
      </Panel>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>{planName.toUpperCase()} 训练计划</Title>
        {isAdmin() && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddStage}
          >
            添加Stage
          </Button>
        )}
      </div>

      <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <div style={{ marginBottom: 8, fontWeight: 'bold' }}>计划说明：</div>
        {isAdmin() ? (
          <TextArea
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="输入计划说明，支持换行..."
          />
        ) : (
          <Paragraph>{description || '暂无说明'}</Paragraph>
        )}
      </div>

      <Collapse defaultActiveKey={stagesList.length > 0 ? [stagesList[0].key] : []}>
        {stagesList.map(stage => renderStageTable(stage))}
      </Collapse>

      <Modal
        title={editingStage ? '修改Stage名称' : '添加新Stage'}
        open={stageModalVisible}
        onOk={handleStageSubmit}
        onCancel={() => setStageModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Stage名称"
            rules={[
              { required: true, message: '请输入Stage名称' }
            ]}
          >
            <Input placeholder="例如：stage1、stage_v2、training-phase" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
