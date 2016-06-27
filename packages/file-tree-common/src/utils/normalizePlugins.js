
// Normalize plugins to an array of arrays,
// where the plugin is [plugin, options].
export default (plugins, pluginMap) => {
  return plugins.map(plugin => {
    if (! Array.isArray(plugin)) {
      plugin = [plugin, {}]
    }

    if (typeof plugin[0] === 'string') {
      const [name, options] = plugin
      const resolved = pluginMap[name]

      if (! resolved) {
        throw new Error(`Couldn't find plugin ${name}`)
      }

      return [resolved, options || {}]
    }

    return plugin
  })
}
