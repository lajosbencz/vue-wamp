import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

Vue.config.productionTip = false;

import VueWamp from '../../src/index';

Vue.use(VueWamp, {
  url: 'ws://localhost:3443',
  realm: 'realm1',
  onchallenge(session, method, extra) {
    console.log({session, method, extra});
  },
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
