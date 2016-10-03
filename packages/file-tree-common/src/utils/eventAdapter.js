let actionCount = 0

export default (tree, debug) => (payload) => {
  const {name, path, stat} = payload

  if (debug) {
    console.log('chokidar action', actionCount++, '=>', name, path)
  }

  switch (name) {
    case 'add': {
      tree.addFile(path, stat)
      break
    }
    case 'addDir': {
      tree.addDir(path, stat)
      break
    }
    case 'unlink': {
      tree.removeFile(path)
      break
    }
    case 'unlinkDir': {
      tree.removeDir(path)
      break
    }
  }
}
