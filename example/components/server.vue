<template>
    <div>
        <h2>Server log</h2>
        <pre v-html="logString"></pre>
    </div>
</template>

<script>
  import deferred from 'deferred'
  import {TOP_MESSAGE, RPC_CALC, RPC_RANDOM} from '../config.js'

  function randomString(length, chars) {
    let mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    let result = '';
    for (let i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
  }

  export default {
    data() {
      return {
        logString: ''
      }
    },
    methods: {
      log(format) {
        let args = [];
        for (let i in arguments) {
          if (arguments.hasOwnProperty(i)) {
            const a = arguments[i];
            args.push((typeof a === 'object') ? JSON.stringify(a, null, 2) : a + '');
          }
        }
        this.logString += args.join(', ') + "\r\n";
      }
    },
    wamp: {
      register: {
        [RPC_CALC]: {
          invoke: 'roundrobin',
          function(args, kwArgs, details) {
            this.log(RPC_CALC + ':', {args,kwArgs,details});
            switch (kwArgs.op) {
              default:
              case '+':
              case 'add':
                return parseInt(kwArgs.a) + parseInt(kwArgs.b);
                break;
              case '-':
              case 'sub':
                return parseInt(kwArgs.a) - parseInt(kwArgs.b);
                break;
              case '*':
              case 'mul':
                return parseInt(kwArgs.a) * parseInt(kwArgs.b);
                break;
              case '/':
              case 'div':
                return parseInt(kwArgs.a) / parseInt(kwArgs.b);
                break;
            }
          }
        },
        [RPC_RANDOM]: {
          invoke: 'roundrobin',
          function(args, kwArgs, details) {
            this.log(RPC_RANDOM + ':', {args,kwArgs,details});
            const length = Math.max(1, parseInt(kwArgs.length));
            const count = Math.max(1, parseInt(kwArgs.count));
            const type = kwArgs.type;
            let r = [];
            for(let n=0; n<count; n++) {
              r.push(randomString(length, type));
            }
            return r;
          }
        },
      },
      subscribe: {
        [TOP_MESSAGE](args, kwArgs, details) {
          this.log(TOP_MESSAGE, {args, kwArgs, details});
        },
      },
    },
    mounted() {
      this.log('Server mounted');
    }
  }
</script>
