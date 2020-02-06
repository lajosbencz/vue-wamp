# vue-wamp
### Autobahn wrapper for Vue, served as a plugin 

* Calls to _subscribe, register, publish, call, unsubscribe, unregister_ are deferred, so that they are executed as soon as the Session object of Autobahn is available
* [Plugin packaging](#configuration)
* [Global, static methods](#static-methods)
* [Vue mixin methods](#mixin-methods)
* Automatic garbage collection for Registration and Subscription objects component-wise when used through option (acknowledge option is forced)

Since v2.0.0:
* Automatic re-subscribe/register if the connection was lost then re-established (only works with mixin methods and component config)
* Reactive global state
* Events

Since v3.0.0:
* ```wampIsOpen```, ```wampIsConnected``` and ```wampIsRetrying``` are only available on the ```$root``` component, to avoid data pollution. (Events are still emitted on all components)
* Scrapped bundling, use your own toolchain to transpile to the desired compatibility level
* Deprecated config options:
  * ```onopen {function}```
  * ```onclose {function}```
  * ```debug {boolean}```
* New config options:
  * ```namespace {string}```: The namespace for the plugin, default: ```wamp```
  * ```auto_reestablish {boolean}```: Automatically re-registers and re-subscribes after reconnection
  * ```auto_close_timeout {number}```: Will close the WS connection after amount of idle seconds
* Rudimentary TypeScript support 

## Installation

```
npm install --save vue-wamp
```

## Example

```
cd node_modules/vue-wamp
npm run example
```

You will need to run two browser tabs to see the effects of example 1&2 (or more testers).
WAMP router by courtesy of https://demo.crossbar.io/ws, please obey [their rules](http://crossbar.io/docs/Demo-Instance/) .

Lately the demo router was unavailable, so i changed to config to connect to a local crossbar server instead.

## Configuration

```js
// entry.js
import VueWamp from 'vue-wamp'

Vue.use(VueWamp, {
    debug: true, // Logs will be written to the console
    url: 'ws://demo.crossbar.io/ws',
    realm: 'realm1',
});
```

## Global status

```vue
<template>
    <div>
        <span v-if="$root.wampIsOpen">Connected</span>
        <span v-else-if="$root.wampIsRetrying">Retrying...</span>
        <span v-else>Disconnected</span>    
    </div>
</template>
```

## Events

```js
export default {
  mounted() {
    this.$on('$wamp.status', ({status, lastStatus, details}) => {});
    this.$on('$wamp.opened', ({status, lastStatus, details}) => {});
    this.$on('$wamp.closed', ({status, lastStatus, details}) => {});
    this.$on('$wamp.retrying', ({status, lastStatus, details}) => {});
    this.$on('$wamp.reconnected', ({status, lastStatus, details}) => {});
  },
}
```

## Usage

```vue
// component.vue
<template>
    <div></div>
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
            this.$wamp.publish('some-topic', [], {val, old});
        }
    },
    wamp: {
        subscribe: {
            'some-topic'(args, kwArgs, details) {
                this.someValue = kwArgs.val;
            },
            'another-topic': {
                acknowledge: true,
                handler(args, kwArgs, details) {
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
                handler(args, kwArgs, details) {
                    // more stuff
                }
            }
        }
    }
}
</script>
```

## Static methods

```Vue.Wamp.subscribe```, ```Vue.Wamp.publish```, ```Vue.Wamp.register```, ```Vue.Wamp.call```, ```Vue.Wamp.unsubscribe```, ```Vue.Wamp.unregister```

```js
// main.js
Vue.Wamp.subscribe('some-topic', function(args, kwArgs, details) {
        // context is empty
        console.log(this); // = null
    }, {
    acknowledge: true // option needed for promise
}).then(function(s) {
    console.log('AutobahnJS Subscription object: ', s); 
});
```

## Mixin methods

```this.$wamp.subscribe```, ```this.$wamp.publish```, ```this.$wamp.register```, ```this.$wamp.call```, ```this.$wamp.unsubscribe```, ```this.$wamp.unregister```

```js
export default {
    data() {
      return {
        foo: 'bar',
      };
    },
    mounted() {
        this.$wamp.subscribe('some-topic', function(args, kwArgs, details) {
            // component context is available
            return this.foo;
        }, {
            acknowledge: true // option needed for promise, automatically added
        }).then(function(s) {
            console.log('AutobahnJS Subscription object: ', s); 
        });
    }
}
```

## Todo

* Tests
* Improve on src
* Improve on builder
