

class ConnectionContext  {

  constructor(Connection, context) {
    this._con = Connection;
    this._ctx = context;
    this._subscriptions = [];
    this._regisrations = [];
    this._reconnectors = [];
    this._con._viewWampEvents.$on('status', ({status, lastStatus, details}) => {
      if(lastStatus.isOpen !== status.isOpen && status.isOpen) {
        for(let i in this._reconnectors) {
          if(this._reconnectors.hasOwnProperty(i)) {
              const r = this._reconnectors[i];
              r.call(this);
          }
        }
        // while(this._reconnectors.length > 0) {
        //   const r = this._reconnectors.shift();
        //   r.call(this);
        // }
      }
    })
  }

  get isClosed() {
    return this._con.isClosed;
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
    this._reconnectors.push(() => {
      this._con.subscribe(topic, handler, options)
        .then(subscription => {
          this._subscriptions.push(subscription);
        }, console.error)
      ;
    });
    return d.promise;
  }

  register(procedure, endpoint, options) {
    options = options || {};
    options.acknowledge = true;
    const d = this._con.defer();
    this._con.register(procedure, endpoint, options)
      .then(registration => {
        this._regisrations.push(registration);
        d.resolve(registration);
      }, d.reject)
    ;
    this._reconnectors.push(() => {
      this._con.register(procedure, endpoint, options)
        .then(registration => {
          this._regisrations.push(registration);
        }, console.error)
      ;
    });
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

  destroy() {
    while(this._regisrations.length > 0) {
      const i = this._regisrations.shift();
      this.unregister(i).catch(() => {});
    }
    while(this._subscriptions.length > 0) {
      const i = this._subscriptions.shift();
      this.unsubscribe(i).catch(() => {});
    }
  }

}

export default ConnectionContext
