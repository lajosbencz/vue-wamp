import Vue from 'vue';
import Connection from "./Connection";
import Context from "./Context";
import Options from "./Options";

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
