
import 'jquery';
import { options, TOP_MESSAGE, RPC_CALC, RPC_RANDOM } from './config'
import Vue from 'vue'
import VueResource from 'vue-resource'
import VueWamp from '../lib/vue-wamp.js'

import './app.scss';

Vue.use(VueResource);

Vue.use(VueWamp, options({
  onopen(session, details) {
    console.log('WAMP client connected', session, details);
  },
  onclose(reason, details) {
    console.log('WAMP client closed: ' + reason, details);
  }
}));

export default Vue
export { Vue, TOP_MESSAGE, RPC_CALC, RPC_RANDOM }