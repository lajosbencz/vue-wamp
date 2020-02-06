// eslint-disable-next-line
import When from 'when';
import autobahn from 'autobahn';
import eventify from './eventify';

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
  if (timeout > 0) {
    connection._wampCloseTimeout = setTimeout(() => {
      connection.close();
    }, timeout);
  }
}

/**
 * Exposes session methods on autobahn connection
 */
class Connection extends autobahn.Connection {
  /**
   * @param {object} options
   */
  constructor(options) {
    super(options);
    eventify(this);

    this._wampSessionDefer = this.defer();
    this._wampCloseTimeout = null;

    let _lastStatus = {
      isConnected: false,
      isOpen: false,
      isRetrying: false,
    };

    const _statusUpdate = (details) => {
      const status = {
        isConnected: this.isConnected,
        isOpen: this.isOpen,
        isRetrying: this.isRetrying,
      };
      const e = {status, lastStatus: _lastStatus, details};
      this.emit('status', e);
      if (status.isOpen && !_lastStatus.isOpen) {
        this.emit('opened', e);
        if (!status.isRetrying && _lastStatus.isRetrying) {
          this.emit('reconnected', e);
        }
      } else if (!status.isOpen && _lastStatus.isOpen) {
        this.emit('closed', e);
      }
      if (status.isRetrying && !_lastStatus.isRetrying) {
        this.emit('retrying', e);
      }
      _lastStatus = status;
    };

    this.onopen = function(session, details) {
      if (this._wampSessionDefer) {
        this._wampSessionDefer.resolve(session);
      }
      this.emit('open', session, details);
      _statusUpdate(details);
    };

    this.onclose = function(reason, details) {
      if (this._wampSessionDefer) {
        this._wampSessionDefer.reject(reason || 'closed', details);
      }
      this._session = null;
      this._wampSessionDefer = this.defer();
      this.emit('close', reason, details);
      _statusUpdate(details);
    };

    _statusUpdate(null);
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
   * @param {string} [reason]
   * @param {string} [message]
   */
  close(reason, message) {
    if (this._transport || this._is_retrying) {
      super.close(reason || 'closed', message || '');
    }
  }

  /**
   * @return {When.Promise}
   */
  getSession() {
    if (!this._session) {
      setTimeout(() => this.open());
      return this._wampSessionDefer.promise;
    }
    return When.Promise.resolve(this._session);
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
  call(procedure, args = [], kwArgs = {}, options = {}) {
    return deferredSession(this, 'call', [procedure, args, kwArgs, options]);
  }

  /**
   * @param {string} procedure
   * @param {callback} endpoint
   * @param {object} [options]
   * @return {When.Promise}
   */
  register(procedure, endpoint, options = {}) {
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
  publish(topic, args = [], kwArgs = {}, options = {}) {
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
  subscribe(topic, handler, options = {}) {
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

export default Connection;
