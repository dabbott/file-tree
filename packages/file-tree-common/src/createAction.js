const actions = {
  initialState: (state, rootPath) => {
    return {
      type: "initialState",
      payload: { state, rootPath },
    }
  },
  change: (state) => {
    return {
      type: "change",
      payload: state,
    }
  },
  event: (name, path, stat) => {
    return {
      type: name,
      payload: { path, stat },
    }
  },
}

export default (type, ...args) => actions[type](...args)
