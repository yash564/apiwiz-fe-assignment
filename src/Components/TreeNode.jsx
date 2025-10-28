import React from 'react'

const COLORS = {
  object: { bg: '#EEF0FF', border: '#6C63FF', text: '#1f2937', badge: '#6C63FF' },
  array: { bg: '#E8F9EE', border: '#2FAE66', text: '#1f2937', badge: '#2FAE66' },
  primitive: { bg: '#FFF4E5', border: '#FF9800', text: '#1f2937', badge: '#FF9800' },
}

export default function TreeNode({ id, data }) {
  const { label, path, kind, value, highlighted } = data || {}
  const c = COLORS[kind] || COLORS.primitive
  const key = String(label ?? '')

  return (
    <div className="json-node" style={{
      background: c.bg,
      border: `${highlighted ? 3 : 2}px solid ${highlighted ? '#FF3860' : c.border}`,
      boxShadow: highlighted ? '0 0 0 4px rgba(255,56,96,0.25)' : '0 1px 0 rgba(0,0,0,0.04)',
      color: c.text,
    }}>
      <div className="json-node__header">
        <span className="json-node__badge" style={{ background: c.badge }}>
          {kind === 'object' ? '{}' : kind === 'array' ? '[]' : '∴'}
        </span>
        <span className="json-node__label">{key}</span>
      </div>
      {kind === 'primitive' && (
        <div className="json-node__value" title={String(value)}>
          {String(value)}
        </div>
      )}
      <div className="json-node__tooltip">
        <div><strong>Path:</strong> {path}</div>
        {kind === 'primitive' && <div><strong>Value:</strong> {String(value)}</div>}
        <div><strong>Type:</strong> {kind}</div>
      </div>
    </div>
  )
}