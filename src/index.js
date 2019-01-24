
import autobahn from 'autobahn'
import pkg from '../package.json'


const defaultOptions = {
  url: '/ws/',
  realm: 'realm1',
  lazy_open: true,
  debug: false,
};

function _kebab(string) {
  return string.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, function (match) {
    return '-' + match.toLowerCase();
  });
}

function _key(context) {
  let key = _kebab(context.constructor.name) + '-' + context._uid;
  if (key.substring(0, 3) === 'vm-')
    key = key.substring(3);
  return key;
}

export default (Vue, options) => {

  let _backlog = [];
  let _registrations = [];
  let _lost = false;
  let _session = null;

  const _options = Object.assign({}, defaultOptions, options);
  const _connection = new autobahn.Connection(Object.assign({}, defaultOptions, options));

  _connection.onopen = (session, details) => {
    _session = session;
    if(_options.hasOwnProperty('onopen') && typeof _options['onopen'] === "function") {
      _options.onopen.apply(_connection, [session, details]);
    }
    _opened();
  };

  _connection.onclose = (reason, details) => {
    if(_options.hasOwnProperty('onclose') && typeof _options['onclose'] === "function") {
      _options.onopen.apply(_connection, [reason, details]);
    }
    _closed();
  };

  Object.defineProperties(Vue.prototype, {
    '$wamp': {
      get() {
        const self = this;
        return {
          version: pkg.version,
          open: _open,
          close: _close,
          reconnect: _reconnect,
          isConnected() {
            return _connection.isConnected
          },
          isOpen() {
            return _connection.isOpen
          },
          isRetrying() {
            return _connection.isRetrying
          },
          subscribe(topic, handler, options) {
            _log('subscribe', {topic, options});
            return _queue(self, 'subscribe', topic, handler, null, null, options);
          },
          publish(topic, args, kvArgs, options) {
            _log('publish', {topic, args, kvArgs, options});
            return _queue(self, 'publish', topic, null, args, kvArgs, options);
          },
          call(procedure, args, kvArgs, options) {
            _log('call', {procedure, args, kvArgs, options});
            return _queue(self, 'call', procedure, null, args, kvArgs, options);
          },
          register(procedure, endpoint, options) {
            _log('register', {procedure, options});
            return _queue(self, 'register', procedure, endpoint, null, null, options);
          },
          unsubscribe(topic) {
            _log('unsubscribe', {topic, options});
            return _queue(self, 'unsubscribe', topic, null, null, null, null);
          },
          unregister(procedure) {
            _log('unregister', {procedure, options});
            return _queue(self, 'unregister', procedure, null, null, null, null);
          }
        }
      }
    }
  });

  function _log(...args) {
    if(_options.debug) {
      console.log("[vue-wamp]", ...args);
    }
  }

  function _open() {
    if (!_connection.isConnected) {
      _connection.open();
    }
    return true;
  }

  function _opened() {
    if(_lost) {
      _log('opened, re-established connection after lost');
    }
    else {
      _log('opened, handling backlog');
    }
    _lost = false;
  }

  function _close(reason, message) {
    if (_connection.isOpen) {
      //_detach(null);
      _connection.close(reason, message);
    }
  }

  function _closed() {
    _log('closed');
    _session = null;
    _backlog = [];
    _registrations = [];
  }

  function _reconnect() {
    _log('reconnecting');
    _close('wamp.goodbye.reconnect');
    _lost = true;
    _open();
  }

  function _queue(context, type, name, callback, args, kvArgs, options) {
    if(_session && _connection.isConnected) {
      return _session[type](name, args, kvArgs, options);
    }
    return new Promise((resolve, reject) => {
    });
  }

  if(!options.lazy_open) {
    _open();
  }

}
