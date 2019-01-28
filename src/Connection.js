import autobahn from 'autobahn'

import ConnectionContext from './ConnetionContext'
import pkg from "../package";

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
    console.log(logPrefix, ...a)
  },
  info: (...a) => {
    console.info(logPrefix, ...a)
  },
  warn: (...a) => {
    console.warn(logPrefix, ...a)
  },
  error: (...a) => {
    console.error(logPrefix, ...a)
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
      d.resolve(this.session)
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

export default Connection
