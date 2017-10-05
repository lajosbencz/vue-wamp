# vue-wamp
### Autobahn wrapper for Vue, served as a plugin 

__This release only supports VueJS 2, I have no plan to create a VueJS 1 compatible branch, but pull requests are always welcome!__

Since v0.0.1:
* Calls to _subscribe, register, publish, call, unsubscribe, unregister_ are deferred, so that they are executed as soon as the Session object of Autobahn is available
* [Plugin packaging](#configuration)
* [Global, static methods](#static-methods)
* [Vue prototype methods](#prototype-methods)
* Automatic garbage collection for Registration and Subscription objects component-wise when used through option (acknowledge option is forced)

Since v1.3.0:
* Automatic re-subscribe/register if the connection was lost then re-established

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

## Prototype methods

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

## Mixin methods

!**Deprecated since 1.3.0**!

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