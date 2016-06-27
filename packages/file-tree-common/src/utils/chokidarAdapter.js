let actionCount = 0

export default (tree, debug) => (eventName, path, stat) => {
  if (debug) {
    console.log('action', actionCount++, '=>', eventName, path)
  }

  switch (eventName) {
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
