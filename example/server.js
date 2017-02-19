
import { Vue } from './common.js'
import AppServer from './server.vue'


/*
 Vue.component('app-message', AppMessage);
 Vue.component('app-label', AppLabel);
 Vue.component('app-size', AppSize);
 */

var vm = new Vue({
  el: '#app-server',
  'template': '<app-server />',
  components: { AppServer }
});
