let actionCount = 0

export default (tree, debug) => ({path, stats}) => {
  if (debug) {
    console.log('walk action', actionCount++, '=>', path)
  }

  if (stats.isFile(path)) {
    tree.addFile(path, stats)
  } else if (stats.isDirectory(path)) {
    tree.addDir(path, stats)
  }
}
