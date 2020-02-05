import Vue from 'vue'
import Context from './Context'

declare module 'vue/types/vue' {
    interface VueConstructor {
        $wamp: Context,
    }
}

declare module 'vue/types/options' {
    interface ComponentOptions<V extends Vue> {
        wamp?: {
            subscribe?: {},
            register?: {},
        }
    }
}
