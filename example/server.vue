<template>
    <div>
        <nav class="navbar navbar-default">
            <div class="btn-toolbar navbar-controls">
                <div class="btn-group btn-group-sm pull-right">
                    <a class="btn btn-default" :class="{'btn-success':$wampIsConnected}">
                        <span v-if="$wampIsConnected">Connected</span>
                        <span v-else>Connecting...</span>
                    </a>
                    <a class="btn btn-default" :class="{'btn-success':$wampIsOpen}">
                        <span v-if="$wampIsOpen">Open</span>
                        <span v-else>Opening...</span>
                    </a>
                    <a class="btn btn-warning" v-if="$wampIsRetrying">
                        <span>Retrying...</span>
                    </a>
                </div>
                <div class="clearfix"></div>
            </div>
        </nav>

        <h2>Server log</h2>
        <pre v-html="logString"></pre>
    </div>
</template>

<script>
  import deferred from 'deferred'
  import {RPC_1, RPC_2} from './config.js'

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
      subscribe: {
        'vue-wamp-message'(args, kwArgs, details) {
          console.log('Message:',{args,kwArgs,details});
          this.log('Message:',{args,kwArgs,details});
        }
      },
    },
    mounted() {
        this.log('Server mounted');
    }
  }
</script>
