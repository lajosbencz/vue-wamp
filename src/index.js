/* eslint-disable */

import Connection from './Connection';
import Context from './Context';

const defaultOptions = {
  namespace: 'wamp',
  auto_reestablish: true,
  auto_close_timeout: 0,
};

export default {
  install(Vue, options) {

    options = {...defaultOptions, ...options};

    const {namespace} = options;
    const injectKey = '$' + namespace;

    if (this.installed) {
      return;
    }
    this.installed = true;

    const con = new Connection(options);

    Object.defineProperties(Vue, {
      // legacy global name
      // @deprecate in next minor
      Wamp: {
        get() {
          return con;
        },
      },
      [injectKey]: {
        get() {
          return con;
        },
      },
    });

    Object.defineProperties(Vue.prototype, {
      [injectKey]: {
        get() {
          if (!this['_wampConnectionContext']) {
            this['_wampConnectionContext'] = new Context(con, this);
          }
          return this['_wampConnectionContext'];
        },
      },
    });

    Vue.mixin({
      data() {
        if (this === this.$root) {
          return {
            wampIsConnected: false,
            wampIsOpen: false,
            wampIsRetrying: false,
          };
        } else {
          return {};
        }
      },
      beforeCreate() {
        if (this === this.$root) {
          con.on('status', (e) => {
            this.wampIsConnected = e.status.isConnected;
            this.wampIsOpen = e.status.isOpen;
            this.wampIsRetrying = e.status.isRetrying;
            this.$emit('$wamp.status', e);
          });
          con.on('opened', (e) => this.$emit('$wamp.opened', e));
          con.on('closed', (e) => this.$emit('$wamp.closed', e));
          con.on('retrying', (e) => this.$emit('$wamp.retrying', e));
          con.on('reconnected', (e) => this.$emit('$wamp.reconnected', e));
        }
        if (!this['$options'][namespace]) {
          return;
        }
        const validTypes = ['subscribe', 'register'];
        const vmOpts = this['$options'][namespace];
        for (const type of validTypes) {
          const defs = vmOpts[type];
          for (const name in defs) {
            if (!defs.hasOwnProperty(name)) {
              continue;
            }
            const def = defs[name];
            let handler;
            let options = {
              acknowledge: true,
            };
            if (typeof def === 'function') {
              // no options
              handler = def;
            } else {
              // user options
              handler = def.handler;
              options = {...options, ...def};
              delete options['handler'];
            }
            if (typeof handler !== 'function') {
              throw new Error('handler must be callable');
            }
            this[injectKey][type](name, handler.bind(this), options).catch(console.error);
          }
        }
      },
      async destroyed() {
        await this[injectKey].destroy();
      },
    });

  },
};
