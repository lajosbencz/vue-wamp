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
        return C;
      }
    }
  });

  // Expose through vm options
  Vue.mixin({
    data() {
      return {
        wampIsOpen: false,
        wampIsRetrying: false,
      }
    },
    created() {

      if (this === this.$root) {
        events.$on('status', ({status, details}) => {
          C.log.info('Status changed', status);
          this.wampIsOpen = !!status.isOpen;
          this.wampIsRetrying = !!status.isRetrying;
          this.$emit('$wamp.status', {status, details});
          if (this.wampIsOpen)
            this.$emit('$wamp.opened', details);
          else if (this.wampIsRetrying)
            this.$emit('$wamp.retrying', details);
          else
            this.$emit('$wamp.closed', details);
        });
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
          C[type](name, handler.bind(this), options)
            .then(r => C.log.info('Component option: ' + type + ' ' + name, r))
            .catch(C.log.error)
          ;
        }
      }
    },
    beforeDestroy() {
    }
  })

}
