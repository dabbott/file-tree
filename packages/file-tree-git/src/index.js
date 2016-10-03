import GitUtils from 'git-utils'

let repo

module.exports = {
  rootPath(rootPath) {
    repo = GitUtils.open(rootPath)
  },
  event({payload}) {
    if (!repo) return

    const {name, path, stat} = payload

    stat.trackedByGit = !repo.isIgnored(repo.relativize(path))
  },
}
