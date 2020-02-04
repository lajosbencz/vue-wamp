//import Vue from "vue";
import IOptions from "./IOptions";
import Options from "./Options";

export default function (Vue: any, options?: IOptions) {
  options = {...Options, ...options};
  const namespace = options?.namespace;
  const injectKey = '$' + namespace;
  Vue.mixin({
    async created() {
      if (!this.$options[namespace]) {
        return
      }
      const vmOptions = this.$options[namespace]
      const wait = []
      const validKeys = ['subscribe', 'register']
      for (const type of validKeys) {
        const t = vmOptions[type]
        for (const name in t) {
          const opts = t[name]
          let handler
          let defOpts = {
            acknowledge: true,
            handler: undefined,
          }
          if (typeof opts === 'function') {
            handler = opts
          } else {
            handler = opts.handler
            defOpts = Object.assign(defOpts, opts)
            delete defOpts.handler
          }
          if (typeof handler !== 'function') {
            throw new TypeError('handler must be callable')
          }
          wait.push(this[injectKey][type](name, handler.bind(this), defOpts))
        }
      }
      await Promise.all(wait)
    },
    async beforeDestroy() {
      if (this[namespace]) {
        await this[namespace].destroy()
      }
    }
  })
}
