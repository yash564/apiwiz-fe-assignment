const TYPE_COLORS = {
  object: { bg: '#E8E8FF', border: '#6C63FF' },
  array: { bg: '#E8F9EE', border: '#2FAE66' },
  primitive: { bg: '#FFF4E5', border: '#FF9800' },
  highlight: { border: '#FF3860' },
}

// Build an intermediate tree to compute layout easily
function buildTree(value, key = 'root', path = '$') {
  const type = getType(value)
  const node = { key, path, type, value, children: [] }

  if (type === 'object') {
    for (const k of Object.keys(value)) {
      node.children.push(buildTree(value[k], k, path + '.' + escapeKey(k)))
    }
  } else if (type === 'array') {
    for (let i = 0; i < value.length; i++) {
      node.children.push(buildTree(value[i], `[${i}]`, path + `[${i}]`))
    }
  }

  return node
}

function escapeKey(k) {
  // If key has special chars, leave as-is in display but keep dot path, not bracket notation
  return k
}

function getType(v) {
  if (v === null) return 'primitive'
  if (Array.isArray(v)) return 'array'
  if (typeof v === 'object') return 'object'
  return 'primitive'
}

// Compute x,y positions: y by depth, x by DFS leaf order. Parents centered over children.
export function jsonToFlow(json, options = {}) {
  const rootTree = buildTree(json)
  const vGap = options.verticalGap || 100
  const hGap = options.horizontalGap || 200

  let leafIndex = 0

  function layout(node, depth) {
    node.depth = depth
    if (!node.children.length) {
      node.x = leafIndex * hGap
      node.y = depth * vGap
      leafIndex++
      return { minX: node.x, maxX: node.x }
    }
    let minX = Infinity
    let maxX = -Infinity
    for (const child of node.children) {
      const range = layout(child, depth + 1)
      minX = Math.min(minX, range.minX)
      maxX = Math.max(maxX, range.maxX)
    }
    node.x = (minX + maxX) / 2
    node.y = depth * vGap
    return { minX, maxX }
  }

  layout(rootTree, 0)

  // Normalize x to start near 0
  const minX = (function getMinX(n) {
    let m = n.x
    for (const c of n.children) m = Math.min(m, getMinX(c))
    return m
  })(rootTree)

  const nodes = []
  const edges = []
  const pathToId = {}

  function toLabel(n) {
    if (n.type === 'primitive') {
      return `${n.key}: ${formatPrimitive(n.value)}`
    }
    if (n.type === 'object') return `${n.key} {}`
    if (n.type === 'array') return `${n.key} []`
    return `${n.key}`
  }

  function colorOf(n) {
    return TYPE_COLORS[n.type]
  }

  function walk(n, parentId = null) {
    const id = n.path
    pathToId[n.path] = id
    const colors = colorOf(n)
    nodes.push({
      id,
      position: { x: n.x - minX + 50, y: n.y + 50 },
      data: { label: toLabel(n), path: n.path, type: n.type, value: n.value },
      style: {
        padding: 8,
        borderRadius: 8,
        border: `2px solid ${colors.border}`,
        background: colors.bg,
        fontFamily: 'Inter, system-ui, Segoe UI, Arial',
        fontSize: 12,
        color: '#222',
      },
    })

    if (parentId) {
      edges.push({ id: `e-${parentId}-${id}`, source: parentId, target: id })
    }

    for (const c of n.children) walk(c, id)
  }

  walk(rootTree)

  return { nodes, edges, pathToId, typeColors: TYPE_COLORS }
}

function formatPrimitive(v) {
  if (typeof v === 'string') return JSON.stringify(v)
  return String(v)
}