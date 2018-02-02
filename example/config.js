
const TOP_MESSAGE = 'vue-wamp-some-topic';
const RPC_CALC = 'vue-wamp-some-procedure';
const RPC_RANDOM = 'vue-wamp-another-procedure';

const options = (o) => {
  return Object.assign({
    realm: 'realm1',
    lazy_open: true,
    debug: true,
  }, o);
};

export { options, TOP_MESSAGE, RPC_CALC, RPC_RANDOM }

export default options
