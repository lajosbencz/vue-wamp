/**
 * @module vue-wamp/plugin
 * @license MIT
 * @author Lajos Bencz <lazos@lazos.me>
 * @see https://github.com/lajosbencz/vue-wamp
 */

import ab from 'autobahn'
import defer from 'deferred'

/* static */
let
  _lost = false,
  _connection = null,
  _session = null,
  _queue = [],
  _collect = [],
  _debug = false;

function _log(...args) {
  if (_debug) {
    console.debug(...args);
  }
}

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

function _open() {
  if (!_connection.isConnected) {
    _connection.open();
  }
  return true;
}

function _close(reason, message) {
  if (_connection.isOpen) {
    _detach(null);
    _connection.close(reason, message);
  }
}

function _reconnect() {
  _close('wamp.goodbye.reconnect');
  _lost = true;
  _open();
}

function _opened() {
  let i;
  for(let q in _queue) {
    if(_queue.hasOwnProperty(q)) {
      i = _queue[q];
      _relay(i).then(i.defer.resolve, i.defer.reject, i.defer.notify);
      if(!i.persist) {
        delete _queue[q];
      }
    }
  }

  if(_lost) {
    _log('$wamp::opened re-established connection after lost');
  }
  else {
    _log('$wamp::opened handling backlog');
  }
  _lost = false;
}

function _closed() {
  _session = null;
  _queue = [];
  _collect = [];
}

function _defer(context, type, name, callback, args, kwArgs, options) {
  _open();
  if(!options) {
    options = {};
  }
  options.acknowledge = true;
  let i = {context, type, name, callback, args, kwArgs, options};
  if (i.callback && i.context) {
    i.callback = i.callback.bind(i.context);
  }
  i.persist = options && options.persist;
  if (!_session) {
    i.defer = defer();
    _queue.push(i);
    return i.defer.promise;
  }
  return _relay(i);
}

function _relay(i) {
  if (i.type.substr(0, 2) === 'un') {
    return _session[i.type](i.name);
  }
  else if (i.type === 'subscribe' || i.type === 'register') {
    let d = defer();
    _session[i.type](i.name, i.callback, i.options).then(r => {
      if (i.context !== null) {
        const k = _key(i.context);
        if (!_collect.hasOwnProperty(k)) {
          _collect[k] = [];
        }
        _collect[k].push({
          name: i.name,
          type: i.type,
          context: i.context,
          instance: r,
        });
      }
      d.resolve(r);
    }, d.reject);
    return d.promise;
  } else {
    return _session[i.type](i.name, i.args, i.kwArgs, i.options);
  }
}

function _detachItem(item) {
  if (item.type === 'subscribe' || item.type === 'register') {
    let t = 'un' + item.type;
    _log('Vue WAMP auto ' + t, item);
    _session[t](item.instance);
  }
}

function _detach(context) {
  if (_connection.isConnected) {
    if (context === null) {
      let c;
      while (c = _collect.shift()) {
        let q;
        while (q = c.shift()) {
          _detachItem(q);
        }
      }
    }
    else {
      const k = _key(context);
      if (_collect.hasOwnProperty(k)) {
        let q;
        while (q = _collect[k].shift()) {
          _detachItem(q);
        }
      }
    }
  }
}

function plugin(Vue, options) {

  options = Object.assign({
    debug: false,
    lazy_open: true
  }, options);

  _debug = options.debug;

  _connection = new ab.Connection(options);

  _connection.onopen = function (session, details) {
    _session = session;
    if (options.hasOwnProperty('onopen') && typeof options['onopen'] === 'function') {
      options.onopen.apply(_connection, [session, details]);
    }
    _opened();
  };

  _connection.onclose = function (reason, details) {
    _lost = reason === 'lost';
    if (options.hasOwnProperty('onclose') && typeof options['onclose'] === 'function') {
      options.onclose.apply(_connection, [reason, details]);
    }
    _closed();
  };

  if (!options.lazy_open) {
    _open();
  }

  Vue.mixin({
    created() {
      if (this.$options.wamp) {
        const o = this.$options.wamp;
        for (let type in o) {
          if (o.hasOwnProperty(type) && (type === 'subscribe' || type === 'register')) {
            for (let name in o[type]) {
              if (o[type].hasOwnProperty(name)) {
                const t = o[type][name];
                let options = {};
                let callback;
                if (typeof t === 'function') {
                  callback = o[type][name];
                  options = {};
                }
                else {
                  callback = o[type][name].function;
                  options = o[type][name];
                  delete options.function;
                }
                _defer(this, type, name, callback, null, null, options)
                  .then(
                    r => {
                      _log('Vue WAMP auto ' + type, r)
                    },
                    e => {
                      console.error('Vue WAMP auto ' + type + ' failed:' + e)
                    }
                  );
              }
            }
          }
        }
      }
    },
    beforeDestroy() {
      _detach(this);
    }
  });

  Object.defineProperties(Vue.prototype, {
    $wamp: {
      get() {
        let self = this;
        return {
          isConnected() {
            return _connection.isConnected
          },
          isOpen() {
            return _connection.isOpen
          },
          isRetrying() {
            return _connection.isRetrying
          },
          open: _open,
          close: _close,
          reconnect: _reconnect,
          subscribe(topic, handler, options) {
            _log('$wamp.subscribe', topic, options);
            return _defer(self, 'subscribe', topic, handler, null, null, options);
          },
          publish(topic, args, kwargs, options) {
            _log('$wamp.publish', topic, args, kwargs, options);
            return _defer(self, 'publish', topic, null, args, kwargs, options);
          },
          call(procedure, args, kwargs, options) {
            _log('$wamp.call', procedure, args, kwargs, options);
            return _defer(self, 'call', procedure, null, args, kwargs, options);
          },
          register(procedure, endpoint, options) {
            _log('$wamp.register', procedure, options);
            return _defer(self, 'register', procedure, endpoint, null, null, options);
          },
          unsubscribe(topic) {
            _log('$wamp.unsubscribe', topic, options);
            return _defer(self, 'unsubscribe', topic, null, null, null, null);
          },
          unregister(procedure) {
            _log('$wamp.unregister', procedure, options);
            return _defer(self, 'unregister', procedure, null, null, null, null);
          }
        };
      }
    }
  });

  Vue.Wamp = {
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
      _log('Wamp.subscribe', topic, options);
      return _defer(null, 'subscribe', topic, handler, null, null, options);
    },
    publish(topic, args, kwargs, options) {
      _log('Wamp.publish', topic, args, kwargs, options);
      return _defer(null, 'publish', topic, null, args, kwargs, options);
    },
    call(procedure, args, kwargs, options) {
      _log('Wamp.call', procedure, args, kwargs, options);
      return _defer(null, 'call', procedure, null, args, kwargs, options);
    },
    register(procedure, endpoint, options) {
      _log('Wamp.register', procedure, options);
      return _defer(null, 'register', procedure, endpoint, null, null, options);
    },
    unsubscribe(topic) {
      _log('Wamp.unsubscribe', topic, options);
      return _defer(null, 'unsubscribe', topic, null, null, null, null);
    },
    unregister(procedure) {
      _log('Wamp.unregister', procedure, options);
      return _defer(null, 'unregister', procedure, null, null, null, null);
    }
  };
}

export default plugin;
