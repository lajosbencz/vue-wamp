/**
 * @module vue-wamp/plugin
 * @license MIT
 * @author Lajos Bencz <lazos@lazos.me>
 * @see https://github.com/lajosbencz/vue-wamp
 */

import Vue from 'vue'
import Vuex from 'vuex'
import defer from 'deferred'
import ab from 'autobahn'

Vue.use(Vuex);

function plugin(Vue, options) {

  const
    store = new Vuex.Store({
      state: {
        isConnected: false,
        isOpen: false,
        isRetrying: false
      },
      mutations: {
        status(state, {connected, open, retrying}) {
          state.isConnected = connected;
          state.isOpen = open;
          state.isRetrying = retrying;
        }
      }
    });

  /* static */
  let
    _connection = new ab.Connection(options),
    _session = null,
    _queue = [],
    _collect = [],
    _interval = null;

  options = Object.assign({
    debug: false,
    lazy_open: true
  }, options);

  _connection.onopen = function (session, details) {
    _session = session;
    if (options.hasOwnProperty('onopen') && typeof options['onopen'] === 'function') {
      options.onopen.apply(_connection, [session, details]);
    }
    _opened();
  };
  _connection.onclose = function (reason, details) {
    if (options.hasOwnProperty('onclose') && typeof options['onclose'] === 'function') {
      options.onclose.apply(_connection, [reason, details]);
    }
    _closed();
  };
  if (!options.lazy_open) {
    _open();
  }

  function _log(...args) {
    if (options.debug) {
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

  function _status(clear) {
    const commit = function () {
      store.commit('status', {
        connected: _connection.isConnected,
        open: _connection.isOpen,
        retrying: _connection.isRetrying
      });
    };
    if (_interval) {
      if (clear) {
        clearInterval(_interval);
      }
    }
    else {
      _interval = setInterval(commit, 250);
    }
    commit();
  }

  function _open() {
    if (!_connection.isConnected) {
      _connection.open();
      _status();
    }
    return true;
  }

  function _close(reason, message) {
    if (_connection.isOpen) {
      _detach(null);
      _connection.close(reason, message);
      _status();
    }
  }

  function _reconnect() {
    _close('wamp.goodbye.reconnect');
    _open();
  }

  function _opened() {
    _status(true);
    let i;
    while (i = _queue.shift()) {
      _relay(i).then(i.defer.resolve, i.defer.reject, i.defer.notify);
    }
  }

  function _closed() {
    _status(true);
    _session = null;
    _queue = [];
    _collect = [];
  }

  function _relay(i) {
    _log('$wamp::_relay', i);
    if (i.type.substr(0, 2) === 'un') {
      return _session[i.type](i.name);
    }
    else if (i.type === 'subscribe' || i.type === 'register') {
      let d = defer();
      i.options.acknowledge = true;
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
          _log('$wamp::_relay collected', r);
        }
        _log('$wamp::_relay resolved', r);
        d.resolve(r);
      }, d.reject);
      return d.promise;
    } else {
      return _session[i.type](i.name, i.args, i.kwArgs, i.options);
    }
  }

  function _defer(context, type, name, callback, args, kwArgs, options) {
    let i = {context, type, name, callback, args, kwArgs, options};
    _log('$wamp::_defer', i);
    _open();
    if (i.callback) {
      i.callback = i.callback.bind(i.context);
    }
    if (!_session) {
      i.defer = defer();
      _queue.push(i);
      return i.defer.promise;
    }
    return _relay(i);
  }

  function _detachItem(item) {
    if (item.type === 'subscribe' || item.type === 'register') {
      _log('Vue WAMP auto ' + item.type, item);
      _session['un' + item.type](item.instance);
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

  Vue.mixin({
    computed: {
      '$wampIsConnected'() {
        return store.state.isConnected
      },
      '$wampIsOpen'() {
        return store.state.isOpen
      },
      '$wampIsRetrying'() {
        return store.state.isRetrying
      }
    },
    methods: {
      '$wampSubscribe'(topic, handler, options) {
        if (!options || !options.acknowledge) _log('$wamp forcing acknowledge:');
        options = Object.assign(options || {}, {acknowledge: true});
        _log('$wampSubscribe', topic, options);
        return _defer(this, 'subscribe', topic, handler, null, null, options);
      },
      '$wampPublish'(topic, args, kwArgs, options) {
        _log('$wampPublish', topic, args, kwArgs, options);
        return _defer(this, 'publish', topic, null, args, kwArgs, options);
      },
      '$wampRegister'(procedure, endpoint, options) {
        if (!options || !options.acknowledge) _log('$wamp forcing acknowledge:');
        options = Object.assign(options || {}, {acknowledge: true});
        _log('$wampRegister', procedure, endpoint, options);
        return _defer(this, 'register', procedure, endpoint, null, null, options);
      },
      '$wampCall'(procedure, args, kwArgs, options) {
        _log('$wampCall', procedure, args, kwArgs, options);
        return _defer(this, 'call', procedure, null, args, kwArgs, options);
      },
      '$wampUnsubscribe'(topic) {
        _log('$wampUnsubscribe', topic);
        return _defer(this, 'unsubscribe', topic, null, null, null, null);
      },
      '$wampUnregister'(procedure) {
        _log('$wampUnregister', procedure);
        return _defer(this, 'unregister', procedure, null, null, null, null);
      }
    },
    created() {
      if (this.$options.wamp) {
        const o = this.$options.wamp;
        for (let type in o) {
          if (o.hasOwnProperty(type) && (type === 'subscribe' || type === 'register')) {
            for (let name in o[type]) {
              if (o[type].hasOwnProperty(name)) {
                const t = typeof o[type][name];
                let options = {};
                let callback;
                if (t !== 'function') {
                  callback = o[type].function;
                  options = o[type];
                  delete options.function;
                }
                else {
                  callback = o[type];
                  options = {};
                }
                options.acknowledge = true; // needed for .then
                _defer(this, type, name, callback, null, null, options)
                  .then(
                    r => {
                      _log('Vue WAMP auto ' + type, r)
                    },
                    e => {
                      console.error('Vue WAMP auto failed:' + e)
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
      return _defer(null, 'subscribe', topic, handler, null, null, options);
    },
    publish(topic, args, kwargs, options) {
      _log('$wamp.publish', topic, args, kwargs, options);
      return _defer(null, 'publish', topic, null, args, kwargs, options);
    },
    call(procedure, args, kwargs, options) {
      _log('$wamp.call', procedure, args, kwargs, options);
      return _defer(null, 'call', procedure, null, args, kwargs, options);
    },
    register(procedure, endpoint, options) {
      _log('$wamp.register', procedure, options);
      return _defer(null, 'register', procedure, endpoint, null, null, options);
    },
    unsubscribe(topic) {
      _log('$wamp.unsubscribe', topic, options);
      return _defer(null, 'unsubscribe', topic, null, null, null, null);
    },
    unregister(procedure) {
      _log('$wamp.unregister', procedure, options);
      return _defer(null, 'unregister', procedure, null, null, null, null);
    }
  };
}

export default plugin;
