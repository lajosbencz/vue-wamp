/* eslint-disable */

import Connection from './Connection';
import Context from './Context';

export function install(Vue, options) {
  if (this.installed) return;
  this.installed = true;

  const {namespace} = options;
  const injectKey = '$' + namespace;

  const con = new Connection(options);

  Object.defineProperty(Vue, injectKey, {
    get() {
      return con;
    },
  });

  Vue.mixin({
    beforeCreate() {
      this._wampConnectionContext = new Context(con, this);
      Object.defineProperty(this, injectKey, {
        get() {
          return this._wampConnectionContext;
        }
      });
    },
    async beforeDestroy() {
      await this[namespace].destroy();
    },
  });

}
