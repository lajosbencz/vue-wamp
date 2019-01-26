
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
        .catch(console.error)
    });
  }

  register(procedure, endpoint, options) {
    options = options || {};
    options.acknowledge = true;
    this._reconnectors.push(() => {
      this._con.register(procedure, endpoint, options)
        .then((registration) => this._registrations.push(registration))
        .catch(console.error)
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

export default Persist
