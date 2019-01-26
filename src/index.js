import Connection from './Connection'

export default (Vue, options) => {

  const events = new Vue();

  const C = new Connection(options, events);

  // Expose through global property
  Vue.Wamp = C;

  // Expose through vm property
  Object.defineProperties(Vue.prototype, {
    '$wamp': {
      get() {
        if(!this._vueWampWithContext) {
          this._vueWampWithContext = C.withContext(this);
        }
        return this._vueWampWithContext;
      }
    }
  });

  // Expose through vm options
  Vue.mixin({
    data() {
      return {
        wampIsConnected: false,
        wampIsOpen: false,
        wampIsRetrying: false,
      }
    },
    created() {

      if (this === this.$root) {
        events.$on('status', (e) => {
          this.wampIsConnected = e.status.isConnected;
          this.wampIsOpen = e.status.isOpen;
          this.wampIsRetrying = e.status.isRetrying;
          this.$emit('$wamp.status', e);
        });
        events.$on('opened', (e) => this.$emit('$wamp.opened', e));
        events.$on('closed', (e) => this.$emit('$wamp.closed', e));
        events.$on('retrying', (e) => this.$emit('$wamp.retrying', e));
        events.$on('reconnected', (e) => this.$emit('$wamp.reconnected', e));
      }

      if (!this.$options.wamp)
        return;

      // exposing only these two makes any sense
      const validKeys = ['subscribe', 'register'];

      const $o = this.$options.wamp;

      // loop topics/procedures
      for (let type in validKeys) {
        type = validKeys[type];
        const t = $o[type];

        // loop topic/procedure names
        for (let name in t) {
          if (!t.hasOwnProperty(name))
            continue;

          const o = t[name];
          let handler;
          let options = {
            acknowledge: true,
          };

          if (typeof o === 'function') {
            // no options
            handler = o;
          }
          else {
            // user options
            handler = o.handler;
            options = Object.assign(options, o);
            delete options.handler;
          }
          if (typeof o !== 'function') {
            throw 'vue-wamp handler must be callable'
          }

          // do it!
          this.$wamp[type](name, handler.bind(this), options)
            .then(r => C.log.info('Component option: ' + type + ' ' + name, r))
            .catch(C.log.error)
          ;
        }
      }
    },
    beforeDestroy() {
      this.$wamp.destroy();
    }
  })

}
