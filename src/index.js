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
          console.log('$wamp access', {vm: this._uid, con});
          return this['_wampConnectionContext'];
        },
      },
    });

    Vue.mixin({
      beforeCreate() {
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
            this[injectKey][type](name, handler.bind(this), options)
              .then(r => {
                console.info(injectKey + ' ' + type + ': ' + name, r);
              })
              .catch(console.error)
            ;
          }
        }
      },
      async destroyed() {
        await this[injectKey].destroy();
      },
    });

  },
};
