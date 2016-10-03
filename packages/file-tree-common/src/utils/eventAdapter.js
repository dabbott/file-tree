let actionCount = 0

export default (tree, debug) => (payload) => {
  const {name, path, stat, metadata} = payload

  if (debug) {
    console.log('chokidar action', actionCount++, '=>', name, path)
  }

  switch (name) {
    case 'add': {
      tree.addFile(path, stat, metadata)
      break
    }
    case 'addDir': {
      tree.addDir(path, stat, metadata)
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
