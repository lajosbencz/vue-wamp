
import 'jquery';
//import uniqid from 'uniqid';
import Vue from 'vue'
import VueWamp from '../lib/vue-wamp.js'
import AppMessage from './message.vue'
import AppLabel from './label.vue'
import AppSize from './size.vue'

import './app.scss';

Vue.use(VueWamp, {
    url: 'ws://demo.crossbar.io/ws',
    realm: 'realm1',
    onopen: function(session, details) {
        console.log('WAMP connected', session, details);
    },
    onclose: function(reason, details) {
        console.log('WAMP closed: ' + reason, details);
    }
});

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
