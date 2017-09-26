
import 'jquery';
import { options, TOP_1, TOP_2, RPC_1, RPC_2 } from './config'
import Vue from 'vue'
import VueResource from 'vue-resource'
import VueWamp from '../lib/vue-wamp.js'
import ComMessage from './components/message.vue'
import ComLabel from './components/label.vue'
import ComSize from './components/size.vue'

import './app.scss';

Vue.use(VueResource);

Vue.use(VueWamp, options({
  url: 'ws://localhost:8080/ws',
  debug: true,
  lazy_open: false,
  max_retries: 15,
  initial_retry_delay: 1.5,
  max_retry_delay: 300,
  retry_delay_growth: 1.5,
  retry_delay_jitter: 0.1,
  onopen(session, details) {
    console.log('WAMP client connected', session, details);
  },
  onclose(reason, details) {
    console.log('WAMP client closed: ' + reason, details);
  }
}));

export default Vue
export { Vue, ComLabel, ComMessage, ComSize, TOP_1, TOP_2, RPC_1, RPC_2 }