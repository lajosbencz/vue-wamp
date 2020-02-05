// eslint-disable-next-line
import When from 'when'
import autobahn from 'autobahn';

const defaultOptions = {
  namespace: 'wamp',
  auto_reestablish: true,
  auto_close_timeout: 0,
};

/**
 * @param {Connection} connection
 * @param {string} method
 * @param {array} [args]
 * @return {When.Promise}
 */
function deferredSession(connection, method, args = []) {
  const d = connection.defer();
  debounceClose(connection, -1);
  connection.getSession().then((session) => {
    try {
      session[method](...args)
          .then(d.resolve, d.reject, d.notify)
          .finally(() => {
            debounceClose(connection);
          });
    } catch (e) {
      debounceClose(connection);
      d.reject(e);
    }
  }, (...args) => {
    debounceClose(connection);
    d.reject(...args);
  });
  return d.promise;
}

/**
 * @param {Connection} connection
 * @param {int} timeout
 */
function debounceClose(connection, timeout = 0) {
  if (timeout < 0) {
    if (connection._wampCloseTimeout) {
      clearTimeout(connection._wampCloseTimeout);
    }
    return;
  }
  if (timeout === 0) {
    timeout = connection._options.auto_close_timeout;
  }
  if (connection._wampCloseTimeout) {
    clearTimeout(connection._wampCloseTimeout);
  }
  connection._wampCloseTimeout = setTimeout(() => {
    connection.close();
  }, timeout);
}

/**
 * Exposes session methods on autobahn connection
 */
export default class Connection extends autobahn.Connection {
  /**
   * @param {object} [options]
   */
  constructor(options = {}) {
    options = {...defaultOptions, ...options};
    super(options);

    this._wampSessionDefer = null;
    this._wampCloseTimeout = null;

    if (options.onchallenge) {
      this.onchallenge = options.onchallenge;
    }

    this.onopen = function(session, details) {
      if (this._wampSessionDefer) {
        this._wampSessionDefer.resolve(session, details);
      }
    };

    this.onclose = function(reason, details) {
      if (this._wampSessionDefer) {
        this._wampSessionDefer.reject(reason || 'closed', details);
      }
      this._wampSessionDefer = null;
    };
  }

  /**
   * Safe open
   */
  open() {
    if (!this._transport) {
      super.open();
    }
  }

  /**
   * Safe close
   */
  close() {
    if (this._transport || this._is_retrying) {
      super.close();
    }
  }

  /**
   * @return {When.Promise}
   */
  getSession() {
    if (!this.session && !this._wampSessionDefer) {
      setTimeout(() => this.open());
    }
    if (!this._wampSessionDefer) {
      this._wampSessionDefer = this.defer();
    }
    return this._wampSessionDefer.promise;
  }

  /**
   * @param {string} shortcut
   * @param {string} prefix
   * @return {When.Promise}
   */
  prefix(shortcut, prefix) {
    return deferredSession(this, 'prefix', [shortcut, prefix]);
  }

  /**
   * @param {string} procedure
   * @param {array} [args]
   * @param {object} [kwArgs]
   * @param {object} [options]
   * @return {When.Promise}
   */
  call(procedure, args, kwArgs, options) {
    return deferredSession(this, 'call', [procedure, args, kwArgs, options]);
  }

  /**
   * @param {string} procedure
   * @param {callback} endpoint
   * @param {object} [options]
   * @return {When.Promise}
   */
  register(procedure, endpoint, options) {
    return deferredSession(this, 'register', [procedure, endpoint, options]);
  }

  /**
   * @param {autobahn.Registration} registration
   * @return {When.Promise}
   */
  unregister(registration) {
    return deferredSession(this, 'unregister', [registration]);
  }

  /**
   * @param {string} topic
   * @param {array} [args]
   * @param {object} [kwArgs]
   * @param {object} [options]
   * @return {When.Promise}
   */
  publish(topic, args, kwArgs, options) {
    options = {
      ...options,
      acknowledge: true,
    };
    return deferredSession(this, 'publish', [topic, args, kwArgs, options]);
  }

  /**
   * @param {string} topic
   * @param {callback} handler
   * @param {object} [options]
   * @return {When.Promise}
   */
  subscribe(topic, handler, options) {
    return deferredSession(this, 'subscribe', [topic, handler, options]);
  }

  /**
   * @param {autobahn.Subscription} subscription
   * @return {When.Promise}
   */
  unsubscribe(subscription) {
    return deferredSession(this, 'unsubscribe', [subscription]);
  }
}
