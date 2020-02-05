import Vue from 'vue';
import Connection from "./Connection";
import Context from "./Context";

interface Options {
    auto_reestablish?: boolean,
    auto_close_timeout?: number,

    [key: string]: any,
}

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

export {
    Options,
    Connection,
    Context,
}
