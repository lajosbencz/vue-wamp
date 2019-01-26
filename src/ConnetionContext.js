
import Persist from './Persist.js'

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
    return this._con.unsubscribe(subscription);
  }

  unregister(registration) {
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

export default ConnectionContext
