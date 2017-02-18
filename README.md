# vue-wamp
### Autobahn wrapper for Vue, served as a plugin 

* Calls to _subscribe, register, publish, call, unsubscribe, unregister_ are deferred, so that they are executed as soon as the Session object of Autobahn is available
* [Plugin packaging](#configuration)
* [Global, computed status variables](#global-status)
* [Global, static methods](#static-methods)
* [Vue prototype methods](#prototype-methods)
* [Vue mixin methods](#mixin-methods)
* Automatic garbage collection for Registration and Subscription objects component-wise when used with ```this.$wampSubscribe``` and ```this.$wampRegister``` (acknowledge options is forced)

```
npm install --save vue-wamp
```

## Example

```
cd node_modules/vue-wamp && npm run example
```

You will need to run two browser tabs to see the effects of example 1&2 (or more testers).
WAMP router by courtesy of https://demo.crossbar.io/ws, please obey [their rules](http://crossbar.io/docs/Demo-Instance/) .

## Configuration

```js
// entry.js
import VueWamp from 'vue-wamp'

Vue.use(VueWamp, {
    debug: true,
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

## Usage

```vue
// component.vue
<template>
    <div>
        <p>Connected: {{ $wampIsConnected }}</p>
    </div>
</template>
<script>
export default {
    data() {
        return {
            someValue: 'foobar'
        };
    },
    watch: {
        someValue(val, old) {
            this.$wampPublish('some-topic', [], {val, old});
        }
    },
    wamp: {
        subscribe: {
            'some-topic'(args, kwArgs, details) {
                this.someValue = kwArgs.val;
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

## Global status

```this.$wampIsConnected```, ```this.$wampIsOpen```, ```this.$wampIsRetrying```

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

## Static methods

```Vue.Wamp.subscribe```, ```Vue.Wamp.publish```, ```Vue.Wamp.register```, ```Vue.Wamp.call```, ```Vue.Wamp.unsubscribe```, ```Vue.Wamp.unregister```

```js
// main.js
Vue.Wamp.subscribe('some-topic', function(args, kwArgs, details) {
        // context is empty
    }, {
    acknowledge: true // option needed for promise
}).then(function(s) {
    console.log('AutobahnJS Subscription object: ', s); 
});
```

## Prototype methods

```this.$wamp.subscribe```, ```this.$wamp.publish```, ```this.$wamp.register```, ```this.$wamp.call```, ```this.$wamp.unsubscribe```, ```this.$wamp.unregister```

```js
export default {
    mounted() {
        this.$wamp.subscribe('some-topic', function(args, kwArgs, details) {
            // context is still empty
        }, {
            acknowledge: true // option needed for promise
        }).then(function(s) {
            console.log('AutobahnJS Subscription object: ', s); 
        });
    }
}
```

## Mixin methods

```this.$wampSubscribe```, ```this.$wampPublish```, ```this.$wampRegister```, ```this.$wampCall```, ```this.$wampUnsubscribe```, ```this.$wampUnregister```

```js
export default {
    mounted() {
        this.$wampSubscribe('some-topic', function(args, kwArgs, details) {
            // context is VueComponent, Subscription will be unsubscribed if component is destroyed
        }, {
            // acknowledge: true // option not needed anymore, it's forced
        }).then(function(s) {
            console.log('AutobahnJS Subscription object: ', s); 
        });
    }
}
```