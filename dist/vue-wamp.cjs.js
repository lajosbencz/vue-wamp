/*!
 * vue-wamp v2.0.5
 * https://github.com/lajosbencz/vue-wamp#readme
 * Released under the MIT License.
 */

'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var autobahn = _interopDefault(require('autobahn'));

class Persist {

  constructor(connection) {
    this._con = connection;
    this._reconnectors = [];
    this._subscriptions = [];
    this._registrations = [];
  }

  subscribe(topic, handler, options) {
    options = options || {};
    options.acknowledge = true;
    this._reconnectors.push(() => {
      this._con.subscribe(topic, handler, options)
        .then((subscription) => this._subscriptions.push(subscription))
        .catch(console.error);
    });
  }

  register(procedure, endpoint, options) {
    options = options || {};
    options.acknowledge = true;
    this._reconnectors.push(() => {
      this._con.register(procedure, endpoint, options)
        .then((registration) => this._registrations.push(registration))
        .catch(console.error);
    });
  }

  unsubscribe(subscription) {
    for(let i in this._subscriptions) {
      if(!this._subscriptions.hasOwnProperty(i)) {
        continue;
      }
      const s = this._subscriptions[i];
      if(s === subscription) {
        this._subscriptions = this._subscriptions.splice(i, 1);
      }
    }
  }

  unregister(registration) {
    for(let i in this._registrations) {
      if(!this._registrations.hasOwnProperty(i)) {
        continue;
      }
      const r = this._registrations[i];
      if(r === registration) {
        this._registrations = this._registrations.splice(i, 1);
      }
    }
  }

  clear() {
    this._reconnectors = [];
  }

  reconnected() {
    for(let i in this._reconnectors) {
      const r = this._reconnectors[i];
      r();
    }
  }

  closed() {
    while(this._subscriptions.length > 0) {
      const s = this._subscriptions.shift();
      this._con.unsubscribe(s).catch(() => {});
    }
    while(this._registrations.length >0) {
      const r = this._registrations.shift();
      this._con.unregister(r).catch(() => {});
    }
  }

}

class ConnectionContext  {

  constructor(connection, context, events) {
    this._con = connection;
    this._ctx = context;
    this._persist = new Persist(connection, events);
    events.$on('reconnected', () => {
      this._persist.reconnected();
    });
    events.$on('closed', () => {
      this.closed();
      this._persist.closed();
    });
    this._subscriptions = [];
    this._registrations = [];
  }

  get isConnected() {
    return this._con.isConnected;
  }

  get isOpen() {
    return this._con.isOpen;
  }

  get isRetrying() {
    return this._con.isRetrying;
  }

  open() {
    return this._con.open();
  }

  close(reason, message) {
    return this._con.close(reason, message);
  }

  call(procedure, args, kwargs, options) {
    return this._con.call(procedure, args, kwargs, options)
  }

  subscribe(topic, handler, options) {
    options = options || {};
    options.acknowledge = true;
    const d = this._con.defer();
    this._con.subscribe(topic, handler, options)
      .then(subscription => {
        this._subscriptions.push(subscription);
        d.resolve(subscription);
      }, d.reject)
    ;
    this._persist.subscribe(topic, handler, options);
    return d.promise;
  }

  register(procedure, endpoint, options) {
    options = options || {};
    options.acknowledge = true;
    const d = this._con.defer();
    this._con.register(procedure, endpoint, options)
      .then(registration => {
        this._registrations.push(registration);
        d.resolve(registration);
      }, d.reject)
    ;
    this._persist.register(procedure, endpoint, options);
    return d.promise;
  }

  publish(topic, args, kwargs, options) {
    return this._con.publish(topic, args, kwargs, options);
  }

  unsubscribe(subscription) {
    for(let i in this._subscriptions) {
      if(!this._subscriptions.hasOwnProperty(i)) {
        continue;
      }
      const s = this._subscriptions[i];
      if(s === subscription) {
        this._subscriptions = this._subscriptions.splice(i, 1);
      }
    }
    this._persist.unsubscribe(subscription);
    return this._con.unsubscribe(subscription);
  }

  unregister(registration) {
    for(let i in this._registrations) {
      if(!this._registrations.hasOwnProperty(i)) {
        continue;
      }
      const r = this._registrations[i];
      if(r === registration) {
        this._registrations = this._registrations.splice(i, 1);
      }
    }
    this._persist.unregister(registration);
    return this._con.unregister(registration);
  }

  closed() {
    while(this._subscriptions.length > 0) {
      const s = this._subscriptions.shift();
      this._con.unsubscribe(s).catch(() => {});
    }
    while(this._registrations.length >0) {
      const r = this._registrations.shift();
      this._con.unregister(r).catch(() => {});
    }
  }

  destroy() {
    this.closed();
    this._persist.closed();
    this._persist.clear();
  }

}

const logPrefix = '[vue-wamp]';

const dummyConsole = {
  log: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  },
};

const debugConsole = {
  log: (...a) => {
    console.log(logPrefix, ...a);
  },
  info: (...a) => {
    console.info(logPrefix, ...a);
  },
  warn: (...a) => {
    console.warn(logPrefix, ...a);
  },
  error: (...a) => {
    console.error(logPrefix, ...a);
  },
};

const defaultConfig = {
  debug: false,
};

class Connection extends autobahn.Connection {

  constructor(config, events) {
    config = Object.assign({}, defaultConfig, config);
    super(config);

    // plugin events
    this._vueWampEvents = events;
    // plugin config
    this._vueWampCfg = config;
    // session promise resolve queue
    this._vueWampQRes = [];
    // session promise reject queue
    this._vueWampQRej = [];

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
      this.log.info('Status emit', e);
      events.$emit('status', e);
      if(status.isOpen && !_lastStatus.isOpen) {
        events.$emit('opened', e);
        if(!status.isRetrying && _lastStatus.isRetrying) {
          events.$emit('reconnected', e);
        }
      }
      else if(!status.isOpen && _lastStatus.isOpen) {
        events.$emit('closed', e);
      }
      if(status.isRetrying && !_lastStatus.isRetrying) {
        events.$emit('retrying', e);
      }
      _lastStatus = status;
    };

    this.onopen = (session, details) => {
      this.log.info('Connection opened', {session, details});
      _statusUpdate(details);
      const l = this._vueWampQRes.length;
      while (this._vueWampQRes.length > 0) {
        let resolve = this._vueWampQRes.shift();
        resolve(session);
      }
      this.log.info('Sessions resolved:', l);
      this._vueWampQRej = [];
      if(config.hasOwnProperty('onopen') && typeof config.onopen === "function") {
        config.onopen(session, details);
      }
    };

    this.onclose = (reason, details) => {
      this.log.info('Connection closed', {reason, details});
      let stop = false;
      if(!details.will_retry) {
        this._autoreconnect_reset();
        stop = true;
      }
      _statusUpdate(details);
      const l = this._vueWampQRej.length;
      while (this._vueWampQRej.length > 0) {
        let reject = this._vueWampQRej.shift();
        reject({reason, details});
      }
      this.log.info('Sessions rejected:', l);
      this._vueWampQRes = [];
      if(config.hasOwnProperty('onclose') && typeof config.onclose === "function") {
        config.onclose(session, details);
      }
      return stop;
    };

    this.log.info('Connection create', {Connection: this});
    _statusUpdate(null);
  }

  get log() {
    return this._vueWampCfg.debug ? debugConsole : dummyConsole
  }

  // get isClosed() {
  //   return !(this.isConnected || this.isOpen || this.isRetrying)
  // }

  get sessionPromise() {
    const d = this.defer();
    if (this.isOpen && this.session) {
      d.resolve(this.session);
    }
    else {
      this.open();
      this._vueWampQRes.push(d.resolve);
      this._vueWampQRej.push(d.reject);
    }
    return d.promise;
  }

  withContext(context) {
    return new ConnectionContext(this, context, this._vueWampEvents)
  }

  open() {
    if(this.isConnected || this.isOpen) {
      return;
    }
    this.log.info('Connection open', {Connection: this});
    super.open();
  }

  close(reason, message) {
    if(!this.isConnected && !this.isOpen && !this.isRetrying) {
      return;
    }
    this.log.info('Connection close', {Connection: this, reason, message});
    super.close(reason, message);
  }

  reconnect() {
    this.close('wamp.goodbye.reconnect');
    this.open();
  }

  call(procedure, args, kwargs, options) {
    args = args || [];
    kwargs = kwargs || {};
    options = options || {};
    this.log.info('CALL', {procedure, args, kwargs, options});
    const d = this.defer();
    this.sessionPromise
      .then(session => session.call(procedure, args, kwargs, options).then(d.resolve, d.reject, d.notify))
      .catch(d.reject);
    return d.promise;
  }

  publish(topic, args, kwargs, options) {
    args = args || [];
    kwargs = kwargs || {};
    options = options || {};
    options.acknowledge = true;
    this.log.info('PUBLISH', {topic, args, kwargs, options});
    const d = this.defer();
    this.sessionPromise
      .then(session => session.publish(topic, args, kwargs, options).then(d.resolve, d.reject))
      .catch(d.reject);
    return d.promise;
  }

  register(procedure, endpoint, options) {
    options = options || {};
    options.acknowledge = true;
    this.log.info('REGISTER', {procedure, endpoint, options});
    const d = this.defer();
    this.sessionPromise
      .then(session => session.register(procedure, endpoint, options).then(d.resolve, d.reject))
      .catch(d.reject)
    ;
    return d.promise;
  }

  subscribe(topic, handler, options) {
    options = options || {};
    this.log.info('SUBSCRIBE', {topic, handler, options});
    const d = this.defer();
    this.sessionPromise
      .then(session =>
        session.subscribe(topic, handler, options).then(d.resolve, d.reject)
      )
      .catch(d.reject);
    return d.promise;
  }

  unregister(registration) {
    this.log.info('UNREGISTER', registration);
    const d = this.defer();
    this.sessionPromise
      .then(session =>
        session.unregister(registration).then(d.resolve, d.reject)
      )
      .catch(d.reject);
    return d.promise;
  }

  unsubscribe(subscription) {
    this.log.info('UNSUBSCRIBE', subscription);
    const d = this.defer();
    this.sessionPromise
      .then(session =>
        session.unsubscribe(subscription).then(d.resolve, d.reject)
      )
      .catch(d.reject);
    return d.promise;
  }
}

var index = (Vue, options) => {

  const events = new Vue();

  const C = new Connection(options, events);

  // Expose through global property
  Vue.Wamp = C;

  // Expose through vm property
  Object.defineProperties(Vue.prototype, {
    '$wamp': {
      get() {
        if(!this._vueWampWithContext) {
          this._vueWampWithContext = C.withContext(this);
        }
        return this._vueWampWithContext;
      }
    }
  });

  // Expose through vm options
  Vue.mixin({
    data() {
      return {
        wampIsConnected: false,
        wampIsOpen: false,
        wampIsRetrying: false,
      }
    },
    created() {

      if (this === this.$root) {
        events.$on('status', (e) => {
          this.wampIsConnected = e.status.isConnected;
          this.wampIsOpen = e.status.isOpen;
          this.wampIsRetrying = e.status.isRetrying;
          this.$emit('$wamp.status', e);
        });
        events.$on('opened', (e) => this.$emit('$wamp.opened', e));
        events.$on('closed', (e) => this.$emit('$wamp.closed', e));
        events.$on('retrying', (e) => this.$emit('$wamp.retrying', e));
        events.$on('reconnected', (e) => this.$emit('$wamp.reconnected', e));
      }

      if (!this.$options.wamp)
        return;

      // exposing only these two makes any sense
      const validKeys = ['subscribe', 'register'];

      const $o = this.$options.wamp;

      // loop topics/procedures
      for (let type in validKeys) {
        type = validKeys[type];
        const t = $o[type];

        // loop topic/procedure names
        for (let name in t) {
          if (!t.hasOwnProperty(name))
            continue;

          const o = t[name];
          let handler;
          let options = {
            acknowledge: true,
          };

          if (typeof o === 'function') {
            // no options
            handler = o;
          }
          else {
            // user options
            handler = o.handler;
            options = Object.assign(options, o);
            delete options.handler;
          }
          if (typeof o !== 'function') {
            throw 'vue-wamp handler must be callable'
          }

          // do it!
          this.$wamp[type](name, handler.bind(this), options)
            .then(r => C.log.info('Component option: ' + type + ' ' + name, r))
            .catch(C.log.error)
          ;
        }
      }
    },
    beforeDestroy() {
      this.$wamp.destroy();
    }
  });

};

module.exports = index;
