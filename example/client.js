
import { Vue } from './common.js'
import AppClient from './client.vue'


/*
Vue.component('app-message', AppMessage);
Vue.component('app-label', AppLabel);
Vue.component('app-size', AppSize);
*/

var vm = new Vue({
    el: '#app-client',
    'template': '<app-client />',
    components: { AppClient }
});
