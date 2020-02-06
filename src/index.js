/* eslint-disable */

import Connection from './Connection';
import Context from './Context';
import defaultOptions from './Options';

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

    // legacy global name
    // @deprecate in next minor
    if (!Vue.Wamp) {
      Object.defineProperties(Vue, {
        Wamp: {
          get() {
            return con;
          },
        },
      });
    }
    if (!Vue[injectKey]) {
      Object.defineProperties(Vue, {
        [injectKey]: {
          get() {
            return con;
          },
        },
      });
    }

    if (!Vue.prototype[injectKey]) {
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
              [namespace + 'IsConnected']: false,
              [namespace + 'IsOpen']: false,
              [namespace + 'IsRetrying']: false,
            };
          } else {
            return {};
          }
        },
        beforeCreate() {
          if (this === this.$root) {
            con.on('status', (e) => {
              this[namespace + 'IsConnected'] = e.status.isConnected;
              this[namespace + 'IsOpen'] = e.status.isOpen;
              this[namespace + 'IsRetrying'] = e.status.isRetrying;
              this.$emit(injectKey + '.status', e);
            });
            con.on('opened', (e) => this.$emit(injectKey + '.opened', e));
            con.on('closed', (e) => this.$emit(injectKey + '.closed', e));
            con.on('retrying', (e) => this.$emit(injectKey + '.retrying', e));
            con.on('reconnected', (e) => this.$emit(injectKey + '.reconnected', e));
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
    }


  },
};
