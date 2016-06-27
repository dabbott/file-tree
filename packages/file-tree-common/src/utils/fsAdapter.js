
export default (tree) => (methodName, ...args) => {
  switch (methodName) {
    case 'writeFile': {
      const [filePath] = args
      tree.addFile(filePath, {loading: true})
      break
    }
    case 'mkdir': {
      const [filePath] = args
      tree.addDir(filePath, {loading: true})
      break
    }
    case 'rename': {
      const [oldPath, newPath] = args
      tree.move(oldPath, newPath)
      break
    }
    case 'remove': {
      const [filePath] = args
      const node = tree.get(filePath)
      if (node) {
        if (node.type === 'directory') {
          tree.removeDir(filePath)
        } else {
          tree.removeFile(filePath)
        }
      }
      break
    }
  }
}
