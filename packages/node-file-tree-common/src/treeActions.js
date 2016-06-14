let actionCount = 0

export default (tree, debug) => (eventName, path, metadata) => {
  if (debug) {
    console.log('action', actionCount++, '=>', eventName, path)
  }

  switch (eventName) {
    case 'add':
      tree.addFile(path, metadata)
    break
    case 'addDir':
      tree.addDir(path, metadata)
    break
    case 'unlink':
      tree.removeFile(path)
    break
    case 'unlinkDir':
      tree.removeDir(path)
    break
  }
}
