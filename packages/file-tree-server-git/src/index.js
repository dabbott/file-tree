module.exports = (GitUtils) => {
  let repo

  return {
    rootPath(rootPath) {
      repo = GitUtils.open(rootPath)
    },
    event({payload}) {
      if (!repo) return

      let {path, stat, metadata} = payload

      const ignoredByGit = repo.isIgnored(repo.relativize(path))

      if (ignoredByGit) {
        metadata = metadata || {}
        metadata.ignoredByGit = ignoredByGit
        payload.metadata = metadata
      }
    },
  }
}
