import path from 'path'

import { split } from './pathUtils'

export const createDirectoryNode = (filePath) => {
  return {
    type: 'directory',
    name: path.basename(filePath),
    path: filePath,
    children: {},
  }
}

export const createFileNode = (filePath) => {
  return {
    type: 'file',
    name: path.basename(filePath),
    path: filePath,
  }
}

// Sort nodes by directory first, then name
export const sortNodes = (children) => {
  const nodes = Object.keys(children).map((key) => {
    return children[key]
  })

  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      if (a.type === 'directory') {
        return -1
      } else {
        return 1
      }
    }

    return a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase())
  })
}

export const getVisibleNodesByIndex = (root, metadata, targetIndex = 0, targetCount = Infinity) => {
  let currentIndex = 0
  let currentCount = 0
  const nodes = []

  const getNode = (node, depth) => {
    if (currentCount >= targetCount) {
      return
    }

    if (currentIndex >= targetIndex) {
      nodes.push({
        node,
        depth,
      })
      currentCount++
    }

    currentIndex++

    if (metadata[node.path] && metadata[node.path].expanded) {
      const children = sortNodes(node.children)
      for (var i = 0; i < children.length; i++) {
        getNode(children[i], depth + 1)
      }
    }
  }

  getNode(root, 0)

  return nodes
}

export const countVisibleNodes = (node, metadata) => {
  let count = 1

  if (metadata[node.path] && metadata[node.path].expanded) {
    const children = node.children
    for (var key in children) {
      count += countVisibleNodes(children[key], metadata)
    }
  }

  return count
}

export const traverse = (node, f, filePath) => {
  filePath = filePath || node.path

  const result = f(node, filePath)

  // Exit early if false is returned
  if (result === false) return result

  if (node.type === 'directory') {
    const {children} = node

    for (let key in children) {
      const result = traverse(children[key], f, path.join(filePath, key))

      if (result === false) return result
    }
  }
}

export const filter = (node, f, limit = Infinity) => {
  const items = []

  traverse(node, (node, filePath) => {
    f(node) && items.push(node)

    if (items.length >= limit) return false
  })

  return items
}

export const search = (node, matcher, type, limit) => {
  const f = (node) => {
    if (type && node.type !== type) {
      return false
    } else {
      return node.path.match(matcher)
    }
  }

  return filter(node, f, limit)
}

export const ensureNode = (dirPath, state) => {
  const parts = split(dirPath)
  const {root} = path.parse ? path.parse(dirPath) : {root: '/'}

  state = state || createDirectoryNode(root)

  let lastPart = state
  let currentPath = root
  while (parts.length) {
    const part = parts[0]
    currentPath = path.join(currentPath, part)

    // Create node if it doesn't exist
    if (! lastPart.children[part]) {
      lastPart.children[part] = createDirectoryNode(currentPath)
    }

    lastPart = lastPart.children[part]
    parts.shift()
  }

  return state
}
