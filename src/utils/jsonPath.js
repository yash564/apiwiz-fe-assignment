export function parseJsonPath(input) {
  if (!input || typeof input !== 'string') return null
  let s = input.trim()
  if (s.startsWith('$')) s = s.slice(1)
  if (s.startsWith('.')) s = s.slice(1)

  const steps = []
  let i = 0
  while (i < s.length) {
    if (s[i] === '[') {
      // array index, e.g., [0]
      const end = s.indexOf(']', i)
      if (end === -1) return null
      const inside = s.slice(i + 1, end).trim()
      // Only numeric indexes supported
      if (!/^\d+$/.test(inside)) return null
      steps.push(Number(inside))
      i = end + 1
      if (s[i] === '.') i++
    } else {
      // read until next . or [
      let j = i
      while (j < s.length && s[j] !== '.' && s[j] !== '[') j++
      const key = s.slice(i, j)
      if (!key) return null
      steps.push(key)
      i = j
      if (s[i] === '.') i++
    }
  }
  return steps
}

// Build path string we used as ids during graph creation from steps
export function stepsToPath(steps) {
  let path = '$'
  for (const step of steps) {
    if (typeof step === 'number') path += `[${step}]`
    else path += `.${step}`
  }
  return path
}