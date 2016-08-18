const actions = {
  initialState: (state, rootPath) => {
    return {
      type: 'initialState',
      payload: { state, rootPath },
    }
  },
  change: (state) => {
    return {
      type: 'change',
      payload: state,
    }
  },
  event: (name, path, stat) => {
    return {
      type: 'event',
      payload: { name, path, stat },
    }
  },
  batch: (actions) => {
    return {
      type: 'batch',
      payload: actions,
    }
  },
  response: (id, err, data) => {
    return {
      type: 'response',
      meta: { id },
      error: !! err,
      payload: err ? err : data,
    }
  },
  request: (id, methodName, args) => {
    return {
      type: 'request',
      meta: { id },
      payload: { methodName, args },
    }
  },
  watchPath: (path) => {
    return {
      type: 'watchPath',
      payload: { path },
    }
  },
  rootPath: (path, reset) => {
    return {
      type: 'rootPath',
      payload: { path, reset },
    }
  },
}

export default (type, ...args) => actions[type](...args)
