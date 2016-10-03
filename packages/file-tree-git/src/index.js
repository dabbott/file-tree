import GitUtils from 'git-utils'

let repo

module.exports = {
  rootPath(rootPath) {
    repo = GitUtils.open(rootPath)
  },
  event({payload}) {
    if (!repo) return

    let {path, stat, metadata} = payload

    const trackedByGit = !repo.isIgnored(repo.relativize(path))

    if (trackedByGit) {
      metadata = metadata || {}
      metadata.trackedByGit = trackedByGit
      payload.metadata = metadata
    }
  },
}
