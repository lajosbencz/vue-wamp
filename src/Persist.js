
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
