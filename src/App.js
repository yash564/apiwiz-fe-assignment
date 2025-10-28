import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, ReactFlowProvider, useReactFlow } from 'reactflow'
import { toPng } from 'html-to-image'
import 'reactflow/dist/style.css'
import { jsonToFlow } from './utils/buildTree'
import { parseJsonPath, stepsToPath } from './utils/jsonPath'
import "./App.css";
import SearchBar from './Components/SearchBar'
import JsonEditor from './Components/JsonEditor'

const SAMPLE_JSON = `{
  "user": {
    "name": "Alice",
    "age": 30,
    "address": { "city": "Paris", "zip": "75001" },
    "hobbies": ["reading", "yoga"],
    "active": true,
    "scores": [
      { "subject": "math", "grade": 95 },
      { "subject": "science", "grade": 88 }
    ]
  },
  "items": [
    { "id": 1, "name": "Book" },
    { "id": 2, "name": "Pen" }
  ]
}`

function Toolbar({ jsonText, setJsonText, onVisualize, onClear, onDownload, onFitView, search, setSearch, onSearch, parseError, msg, theme, toggleTheme }) {
  return (
    <div className="toolbar">
      <div className="toolbar__top">
        <h1>JSON Tree Visualizer</h1>
        <div className="toolbar__actions">
          <button className="btn" onClick={onFitView}>Fit View</button>
          <button className="btn" onClick={onDownload}>Download Image</button>
          <button className="btn" onClick={toggleTheme}>{theme === 'light' ? 'Dark' : 'Light'} Mode</button>
        </div>
      </div>
      <div className="toolbar__grid">
        <div className="toolbar__left">
          <JsonEditor placeholder={SAMPLE_JSON} value={jsonText} onChange={e => setJsonText(e.target.value)} spellCheck={false} />
        </div>
        <div className="toolbar__right">
          <div className="button-row">
            <button className="btn primary" onClick={onVisualize}>Visualize</button>
            <button className="btn" onClick={() => setJsonText(SAMPLE_JSON)}>Load Sample</button>
            <button className="btn ghost" onClick={onClear}>Clear</button>
          </div>
          <SearchBar search={search} setSearch={setSearch} onSearch={onSearch}  />
          {parseError && <div className="error">{parseError}</div>}
          {msg && <div className="msg">{msg}</div>}
        </div>
      </div>
    </div>
  )
}

function FlowCanvas({ nodes, edges, onNodeClick, fitTick, centerTargetId }) {
  const rf = useReactFlow()

  // Fit view when requested
  useEffect(() => {
    if (fitTick > 0) {
      // small timeout lets RF mount before fitting
      const t = setTimeout(() => rf.fitView({ padding: 0.2 }), 0)
      return () => clearTimeout(t)
    }
  }, [fitTick, rf])

  // Center on a specific node id when requested
  useEffect(() => {
    if (!centerTargetId) return
    const target = nodes.find(n => n.id === centerTargetId)
    if (target) {
      rf.setCenter(target.position.x + 75, target.position.y + 20, { zoom: 1.25, duration: 800 })
    }
  }, [centerTargetId, nodes, rf])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={onNodeClick}
      fitView
      proOptions={{ hideAttribution: true }}
      panOnScroll
      selectionOnDrag={false}
    >
      <Background gap={16} />
      <MiniMap pannable zoomable />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}

export default function App() {
  const [jsonText, setJsonText] = useState('')
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [pathMap, setPathMap] = useState({})
  const [search, setSearch] = useState('')
  const [parseError, setParseError] = useState('')
  const [msg, setMsg] = useState('')
  const [theme, setTheme] = useState('light')
  const [highlightId, setHighlightId] = useState(null)
  const [fitTick, setFitTick] = useState(0)
  const [centerTargetId, setCenterTargetId] = useState(null)

  const reactFlowWrapper = useRef(null)
  const flowWrapperRef = useRef(null)

  const setThemeClass = useCallback((t) => {
    document.documentElement.setAttribute('data-theme', t)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      setThemeClass(next)
      return next
    })
  }, [setThemeClass])

  const onVisualize = useCallback(() => {
    setMsg('')
    setParseError('')
    let obj
    try {
      const text = jsonText.trim() || SAMPLE_JSON
      obj = JSON.parse(text)
    } catch (e) {
      setParseError('Invalid JSON: ' + e.message)
      return
    }
    const { nodes, edges, pathToId } = jsonToFlow(obj)
    setNodes(nodes)
    setEdges(edges)
    setPathMap(pathToId)
    setHighlightId(null)
    // Request fit view
    setFitTick(t => t + 1)
  }, [jsonText])

  const applyHighlight = useCallback((id) => {
    setNodes(nds => nds.map(n => {
      const base = { ...n }
      if (n.id === id) {
        base.style = {
          ...n.style,
          boxShadow: '0 0 0 3px rgba(255,56,96,0.5)',
          border: '3px solid #FF3860',
        }
      } else {
        const prevBorder = n.style?.border || ''
        base.style = {
          ...n.style,
          boxShadow: 'none',
          border: prevBorder.includes('3px') ? prevBorder.replace('3px', '2px') : prevBorder,
        }
      }
      return base
    }))
  }, [])

  const onSearch = useCallback(() => {
    setMsg('')
    const steps = parseJsonPath(search)
    if (!steps) {
      setMsg('No match found')
      setHighlightId(null)
      return
    }
    const path = stepsToPath(steps)
    const id = pathMap[path]
    if (!id) {
      setMsg('No match found')
      setHighlightId(null)
      return
    }
    setMsg('Match found')
    setHighlightId(id)
    applyHighlight(id)
    // Request center on node in canvas
    setCenterTargetId(id)
  }, [search, pathMap, nodes, applyHighlight])

  const onNodeClick = useCallback((evt, node) => {
    const text = node.data?.path || node.id
    navigator.clipboard?.writeText(text)
    setMsg('Copied path: ' + text)
    setHighlightId(node.id)
    applyHighlight(node.id)
  }, [applyHighlight])

  const onClear = useCallback(() => {
    setJsonText('')
    setNodes([])
    setEdges([])
    setPathMap({})
    setSearch('')
    setMsg('Cleared')
    setHighlightId(null)
  }, [])

  const onDownload = useCallback(async () => {
    setMsg('')
    const el = flowWrapperRef.current
    if (!el) { setMsg('Nothing to export'); return }
    try {
      const pixelRatio = 2 // higher quality
      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffffff',
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'json-tree.png'
      a.click()
      setMsg('Downloaded image')
    } catch (e) {
      setMsg('Export failed: ' + (e?.message || String(e)))
    }
  }, [])

  const onFitView = useCallback(() => {
    setFitTick(t => t + 1)
  }, [])

  // Initialize theme
  React.useEffect(() => { setThemeClass('light') }, [setThemeClass])

  return (
    <div className="app" ref={reactFlowWrapper}>
      <Toolbar
        jsonText={jsonText}
        setJsonText={setJsonText}
        onVisualize={onVisualize}
        onClear={onClear}
        onDownload={onDownload}
        onFitView={onFitView}
        search={search}
        setSearch={setSearch}
        onSearch={onSearch}
        parseError={parseError}
        msg={msg}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div className="canvas">
        <ReactFlowProvider>
          <div ref={flowWrapperRef} className="flow-wrapper" style={{ width: '100%', height: '100%' }}>
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodeClick={onNodeClick}
              fitTick={fitTick}
              centerTargetId={centerTargetId}
            />
          </div>
        </ReactFlowProvider>
      </div>
    </div>
  )
}