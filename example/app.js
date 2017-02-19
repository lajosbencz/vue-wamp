
import 'jquery';
import { options, TOP_1, TOP_2, RPC_1, RPC_2 } from './config'
import Vue from 'vue'
import VueWamp from '../lib/vue-wamp.js'
import AppMessage from './message.vue'
import AppLabel from './label.vue'
import AppSize from './size.vue'
import abServer from './server'
abServer.open();

import './app.scss';

Vue.use(VueWamp, options({
    onopen(session, details) {
        console.log('WAMP client connected', session, details);
    },
    onclose(reason, details) {
        console.log('WAMP client closed: ' + reason, details);
    }
}));

Vue.component('app-message', AppMessage);
Vue.component('app-label', AppLabel);
Vue.component('app-size', AppSize);


var app = new Vue({
    el: '#vue-wamp-example',
    data: {
        labels: ['foo','bar','baz','bax'],
        color: '#0ff',
        show: {
            message: true,
            label: true,
            size: true
        }
    }
});
