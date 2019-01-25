import autobahn from 'autobahn'
import pkg from '../package.json'

const logPrefix = '[' + pkg.name + ']';

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

    // plugin config
    this._vueWampCfg = config;
    // session promise resolve queue
    this._vueWampQRes = [];
    // session promise reject queue
    this._vueWampQRej = [];

    let _statusUpdate = (details) => {
      const status = {
        isOpen: this.isOpen,
        isRetrying: this.isRetrying,
      };
      this.log.info('Status emit', {status, details});
      events.$emit('status', {status, details});
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
    };

    this.onclose = (reason, details) => {
      this.log.info('Connection closed', {reason, details});
      let stop = false;
      if(!details.will_retry) {
        this._autoreconnect_reset();
        stop = true;
      }
      switch (reason) {
        default:
        case 'lost':
        case 'unreachable':
          break;
        case 'closed':
        case 'unsupported':
          break;
      }
      _statusUpdate(details);
      const l = this._vueWampQRej.length;
      while (this._vueWampQRej.length > 0) {
        let reject = this._vueWampQRej.shift();
        reject({reason, details});
      }
      this.log.info('Sessions rejected:', l);
      this._vueWampQRes = [];
      return stop;
    };

    this.log.info('New connection', {Connection: this});
    _statusUpdate(null);
  }

  open() {
    this.log.info('Connection open', {Connection: this});
    super.open();
  }

  close(reason, message) {
    this.log.info('Connection close', {Connection: this, reason, message});
    super.close(reason, message);
  }

  get version() {
    return pkg.version;
  }

  get log() {
    return this._vueWampCfg.debug ? debugConsole : dummyConsole
  }

  get isClosed() {
    return !(this.isOpen || this.isRetrying)
  }

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

  call(procedure, args, kvArgs, options) {
    args = args || [];
    kvArgs = kvArgs || {};
    options = options || {};
    this.log.info('CALL', {procedure, args, kvArgs, options});
    const d = this.defer();
    this.sessionPromise
      .then(session => session.call(procedure, args, kvArgs, options).then(d.resolve, d.reject, d.notify))
      .catch(d.reject);
    return d.promise;
  }

  publish(topic, args, kvArgs, options) {
    args = args || [];
    kvArgs = kvArgs || {};
    options = options || {};
    options.acknowledge = true;
    this.log.info('PUBLISH', {topic, args, kvArgs, options});
    const d = this.defer();
    this.sessionPromise
      .then(session => session.publish(topic, args, kvArgs, options).then(d.resolve, d.reject))
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
    this.log.info('UNREGISTER', subscription);
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
