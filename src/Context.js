// eslint-disable-next-line no-unused-vars
import When from 'when';
// eslint-disable-next-line no-unused-vars
import Vue from 'vue';
// eslint-disable-next-line no-unused-vars
import autobahn, {Registration, Subscription} from 'autobahn';

/**
 * @param {Context} ctx
 * @param {string} type
 * @param {string} name
 * @param {any|autobahn.Subscription|autobahn.Registration} what
 */
function remove(ctx, type, name, what) {
  const obj = ctx[type][name];
  const topic = Object.keys(obj).find((key) => obj[key] === what);
  if (topic) {
    delete ctx[type][name][topic];
  }
}

/**
 * Ties registrations and subscriptions to a vm context
 */
export default class Context {
  /**
   * @param {Connection} connection
   * @param {Vue} vm
   */
  constructor(connection, vm) {
    this._connection = connection;
    this._vm = vm;
    this._registry = {
      subscribe: {},
      register: {},
    };
    this._definitions = {
      subscribe: {},
      register: {},
    };
    this._resumer = async () => {
      await this.resume();
    };
    this._connection.on('open', this._resumer);
  }

  /**
   * @return {When.Promise|void}
   */
  async resume() {
    if (!this._connection.isOpen ||
      !this._connection._options.auto_reestablish) {
      return;
    }
    const wait = [];
    for (const k in this._definitions.subscribe) {
      if (this._definitions.subscribe.hasOwnProperty(k)) {
        const sub = this._definitions.subscribe[k];
        wait.push(this.subscribe(sub.topic, sub.handler, sub.options));
      }
    }
    for (const k in this._definitions.register) {
      if (this._definitions.register.hasOwnProperty(k)) {
        const reg = this._definitions.register[k];
        wait.push(this.subscribe(reg.procedure, reg.endpoint, reg.options));
      }
    }
    await Promise.all(wait);
  }

  /**
   * @return {When.Promise}
   */
  async destroy() {
    this._connection.off('open', this._resumer);
    const wait = [];
    Object.values(this._registry.register).forEach((topic) => {
      wait.push(this.unregister(topic));
    });
    this._registry.register = {};
    Object.values(this._registry.subscribe).forEach((topic) => {
      wait.push(this.unsubscribe(topic));
    });
    this._registry.subscribe = {};
    await Promise.all(wait);
  }

  /**
   * @param {string} event
   * @param {function} fn
   * @return {Context}
   */
  on(event, fn) {
    return this._connection.on(event, fn);
  }

  /**
   * @param {string} event
   * @param {function} fn
   * @return {Context}
   */
  once(event, fn) {
    return this._connection.once(event, fn);
  }

  /**
   * @param {string} [event]
   * @param {function} [fn]
   * @return {Context}
   */
  off(event, fn) {
    return this._connection.off(event, fn);
  }

  /**
   * @param {string} event
   * @param {any} [args]
   * @return {Context}
   */
  emit(event, ...args) {
    return this._connection.emit(event, ...args);
  }

  /**
   * @return {When.Promise}
   */
  getSession() {
    return this._connection.getSession();
  }

  /**
   * @param {string} procedure
   * @param {array} args
   * @param {object} kwArgs
   * @param {object} options
   * @return {When.Promise}
   */
  call(procedure, args = [], kwArgs = {}, options = {}) {
    return this._connection.call(procedure, args, kwArgs, options);
  }

  /**
   * @param {string} procedure
   * @param {callback} endpoint
   * @param {object} options
   * @return {Q.Promise<Registration|Subscription>}
   */
  async register(procedure, endpoint, options = {}) {
    const d = this._connection.defer();
    if (this._registry.register[procedure]) {
      await this.unregister(this._registry.register[procedure]);
    }
    if (this._connection._options.auto_reestablish) {
      this._definitions.register[procedure] = {procedure, endpoint, options};
    }
    this._connection.register(procedure, endpoint, options).then((r) => {
      this._registry.register[procedure] = r;
      d.resolve(r);
    }, d.reject);
    return d.promise;
  }

  /**
   * @param {autobahn.Registration} registration
   * @return {When.Promise}
   */
  unregister(registration) {
    remove(this, '_registry', 'register', registration);
    if (this._connection._options.auto_reestablish) {
      remove(this, '_definitions', 'register', registration);
    }
    return this._connection.unregister(registration);
  }

  /**
   * @param {string} topic
   * @param {array} args
   * @param {object} kwArgs
   * @param {object} options
   * @return {When.Promise}
   */
  publish(topic, args = [], kwArgs = {}, options = {}) {
    options = {
      ...options,
      acknowledge: true,
    };
    return this._connection.publish(topic, args, kwArgs, options);
  }

  /**
   * @param {string} topic
   * @param {callback} handler
   * @param {object} options
   * @return {When.Promise}
   */
  async subscribe(topic, handler, options = {}) {
    const d = this._connection.defer();
    if (this._registry.subscribe[topic]) {
      await this.unsubscribe(this._registry.subscribe[topic]);
    }
    if (this._connection._options.auto_reestablish) {
      this._definitions.subscribe[topic] = {topic, handler, options};
    }
    this._connection.subscribe(topic, handler, options).then((s) => {
      this._registry.subscribe[topic] = s;
      d.resolve(s);
    }, d.reject);
    return d.promise;
  }

  /**
   * @param {autobahn.Subscription} subscription
   * @return {When.Promise}
   */
  unsubscribe(subscription) {
    remove(this, '_registry', 'subscribe', subscription);
    if (this._connection._options.auto_reestablish) {
      remove(this, '_definitions', 'subscribe', subscription);
    }
    return this._connection.unsubscribe(subscription);
  }
}
