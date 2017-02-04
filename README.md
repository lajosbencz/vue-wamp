# vue-wamp
AutobahnJS wrapper library fo Vue.js

```
npm install --save vue-wamp
npm run example
```

You will need to run two browser tabs to see the effects of example 1&2 (or more testers).
WAMP router by courtesy of https://demo.crossbar.io/ws, please obey [their rules](http://crossbar.io/docs/Demo-Instance/) .

## Configuration

```js
// entry.js
import VueWamp from 'vue-wamp'

Vue.use(VueWamp, {
    url: 'ws://demo.crossbar.io/ws',
    realm: 'realm1',
    onopen: function(session, details) {
        console.log('WAMP connected', session, details);
    },
    onclose: function(reason, details) {
        console.log('WAMP closed: ' + reason, details);
    }
});
```

### Usage

```js
// component.vue
<script>
export default {
    data() {
        return {
            someValue: 'foobar'
        };
    },
    watch: {
        someValue(val, old) {
            this.$wamp.publish('some-topic', [val, old]);
        }
    },
    wamp: {
        subscribe: {
            'some-topic'(args, kwArgs, details) {
                this.someValue = kwArgs.value;
            },
            'another-topic': {
                acknowledge: true,
                function(args, kwArgs, details) {
                    // do stuff
                }
            }
        },
        register: {
            'some-rpc'(args, kwArgs, details) {
                return args[0] + ' I am useful!';
            },
            'another-rpc': {
                invoke: 'random',
                function(args, kwArgs, details) {
                    // more stuff
                }
            }
        }
    }
}
</script>
```

### Global status

```html
<div class="btn-group btn-group-sm">
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
```