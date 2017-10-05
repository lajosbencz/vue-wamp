
import 'jquery';
import { options, TOP_1, TOP_2, RPC_1, RPC_2 } from './config'
import Vue from 'vue'
import VueResource from 'vue-resource'
import VueWamp from '../lib/vue-wamp.js'

import './app.scss';

Vue.use(VueResource);

Vue.use(VueWamp, options({
  url: 'ws://localhost:8080/ws',
  debug: true,
  lazy_open: true,
  onopen(session, details) {
    console.log('WAMP client connected', session, details);
  },
  onclose(reason, details) {
    console.log('WAMP client closed: ' + reason, details);
  }
}));

export default Vue
export { Vue, TOP_1, TOP_2, RPC_1, RPC_2 }