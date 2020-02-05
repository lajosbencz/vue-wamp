/* eslint-disable */

export default class Plugin {
  // Connection events
  connected(connection, session, details) {}
  retry(connection) {}
  closed(connection, reason, details) {}

  // Session events
  call({procedure, args, kwArgs, options}) {}
  called({procedure, args, kwArgs, details}) {}
  publish({topic, args, kwArgs, options}) {}
  register({procedure, endpoint, options}) {}
  registered({registration}) {}
  subscribe({topic, handler, options}) {}
  subscribed({subscription}) {}

  // Errors
  openError({error, details}) {}
  callError({procedure, args, kwArgs, error}) {}
  publishError({topic, args, kwArgs, error}) {}
  registerError(error, details) {}
  subscribeError(error, details) {}
}
