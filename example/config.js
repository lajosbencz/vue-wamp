
const TOP_1 = 'vue-wamp-some-topic';
const TOP_2 = 'vue-wamp-another-topic';
const RPC_1 = 'vue-wamp-some-procedure';
const RPC_2 = 'vue-wamp-another-procedure';

const options = (o) => {
  return Object.assign({
    debug: false,
    url: 'ws://demo.crossbar.io/ws',
    realm: 'realm1'
  }, o);
};

export { options, TOP_1, TOP_2, RPC_1, RPC_2 }

export default options
