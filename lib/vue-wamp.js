/**
 * @module vue-wamp/plugin
 * @author Lajos Bencz <lazos@lazos.me>
 * @version 0.1.0
 *
 * @param {Object} Vue
 * @param {Object} [options]
 */
module.exports.install = function(Vue, options) {

    const
        vuex = require('vuex'),
        defer = require('deferred'),
        ab = require('autobahn');

    Vue.use(vuex);

    const
        store = new vuex.Store({
            state: {
                isConnected: false,
                isOpen: false,
                isRetrying: false
            },
            mutations: {
                status(state, {connected, open, retrying}) {
                    state.isConnected = connected;
                    state.isOpen = open;
                    state.isRetrying = retrying;
                }
            }
        });

    /* static */ var
        _connection = new ab.Connection(options),
        _session = null,
        _queue = [],
        _collect = [],
        _interval = null;

    options = Object.assign({
        debug: false
    }, options);

    _connection.onopen = function(session, details) {
        _session = session;
        if(options.hasOwnProperty('onopen') && typeof options['onopen'] == 'function') {
            options.onopen.apply(_connection, [session, details]);
        }
        _connected();
    };
    _connection.onclose = function(reason, details) {
        if(options.hasOwnProperty('onclose') && typeof options['onclose'] == 'function') {
            options.onclose.apply(_connection, [reason, details]);
        }
        _closed();
    };
    function _log(...args) {
        if(options.debug) {
            console.debug(...args);
        }
    }
    function _kebab(string) {
        return string.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, function (match) {
            return '-' + match.toLowerCase();
        });
    }
    function _key(context) {
        let key = _kebab(context.constructor.name) + '-' + context._uid;
        if (key.substring(0, 3) === 'vm-')
            key = key.substring(3);
        return key;
    }
    function _status(clear) {
        const commit = function(){
            store.commit('status', {
                connected: _connection.isConnected,
                open: _connection.isOpen,
                retrying: _connection.isRetrying
            });
        };
        if(_interval) {
            if(clear) {
                clearInterval(_interval);
            }
        }
        else {
            _interval = setInterval(commit, 250);
        }
        commit();
    }
    function _open() {
        if(!_connection.isConnected) {
            _connection.open();
            _status();
        }
        return true;
    }
    function _close(reason, message) {
        if(_connection.isOpen) {
            _detach(context);
            _connection.close(reason, message);
            _status();
        }
    }
    function _connected() {
        _status(true);
        let i;
        while(i = _queue.shift()) {
            _relay(i).then(i.defer.resolve, i.defer.reject, i.defer.notify);
        }
    }
    function _closed() {
        _status(true);
        _session = null;
        _queue = [];
        _collect = [];
    }
    function _relay(i) {
        _log('$wamp::_relay', i);
        if(i.type.substr(0, 2) == 'un') {
            return _session[i.type](i.name);
        }
        else if(i.type == 'subscribe' || i.type == 'register') {
            var d = defer();
            i.options.acknowledge = true;
            _session[i.type](i.name, i.callback, i.options).then(r => {
                if(i.context !== null) {
                    const k = _key(i.context);
                    if (!_collect.hasOwnProperty(k)) {
                        _collect[k] = [];
                    }
                    _collect[k].push({
                        name: i.name,
                        type: 'un' + i.type,
                        context: i.context,
                        instance: r
                    });
                    _log('$wamp::_relay collected', r);
                }
                _log('$wamp::_relay resolved', r);
                d.resolve(r);
            }, d.reject);
            return d.promise;
        } else {
            return _session[i.type](i.name, i.args, i.kwArgs, i.options);
        }
    }
    function _defer(context, type, name, callback, args, kwArgs, options) {
        var i = {context, type, name, callback, args, kwArgs, options};
        _log('$wamp::_defer', i);
        _open();
        if(i.callback) {
            i.callback = i.callback.bind(i.context);
        }
        if(!_session) {
            i.defer = defer();
            _queue.push(i);
            return i.defer.promise;
        }
        return _relay(i);
    }
    function _detach(context) {
        if(_connection.isConnected) {
            const k = _key(context);
            if(_collect.hasOwnProperty(k)) {
                let q;
                while (q = _collect[k].shift()) {
                    if (q.context == context && (q.type == 'unsubscribe' || q.type == 'unregister')) {
                        _log('Vue WAMP auto ' + q.type, q);
                        _session[q.type](q.instance);
                    }
                }
            }
        }
    }

    Vue.mixin({
        computed: {
            '$wampIsConnected'() { return store.state.isConnected },
            '$wampIsOpen'() { return store.state.isOpen },
            '$wampIsRetrying'() { return store.state.isRetrying }
        },
        methods: {
            '$wampSubscribe'(topic, handler, options) {
                if(!options || !options.acknowledge) _log('$wamp forcing acknowledge:');
                options = Object.assign(options||{}, { acknowledge: true });
                _log('$wampSubscribe', topic, options);
                return _defer(this, 'subscribe', topic, handler, null, null, options);
            },
            '$wampPublish'(topic, args, kwArgs, options) {
                _log('$wampPublish', topic, args, kwArgs, options);
                return _defer(this, 'publish', topic, null, args, kwArgs, options);
            },
            '$wampRegister'(procedure, options) {
                if(!options || !options.acknowledge) _log('$wamp forcing acknowledge:');
                options = Object.assign(options||{}, { acknowledge: true });
                _log('$wampRegister', procedure, endpoint, options);
                return _defer(this, 'register', procedure, endpoint, null, null, options);
            },
            '$wampCall'(procedure, args, kwArgs, options) {
                _log('$wampCall', procedure, args, kwArgs, options);
                return _defer(this, 'call', procedure, null, args, kwArgs, options);
            },
            '$wampUnsubscribe'(topic) {
                _log('$wampUnsubscribe', topic);
                return _defer(this, 'unsubscribe', topic, null, null, null, null);
            },
            '$wampUnregister'(procedure) {
                _log('$wampUnregister', procedure);
                return _defer(this, 'unregister', procedure, null, null, null, null);
            }
        },
        created() {
            if (this.$options.wamp) {
                const o = this.$options.wamp;
                for(let type in o) {
                    if (o.hasOwnProperty(type) && (type == 'subscribe' || type == 'register')) {
                        for (let name in o[type]) {
                            if (o[type].hasOwnProperty(name)) {
                                const t = typeof o[type][name];
                                let options;
                                if(t == 'function') {
                                    options = { 'function': o[type][name] };
                                }
                                else {
                                    options = o[type][name];
                                }
                                options.acknowledge = true; // needed for .then
                                _defer(this, type, name, options.function, null, null, options)
                                  .then(
                                    r => { _log('Vue WAMP auto ' + type, r) },
                                    e => { console.error('Vue WAMP auto failed:' + e) }
                                  );
                            }
                        }
                    }
                }
            }
        },
        beforeDestroy() {
            Vue.Wamp.detach(this);
        }
    });

    const proto = {
        isConnected() { return _connection.isConnected },
        isOpen() { return _connection.isOpen },
        isRetrying() { return _connection.isRetrying },
        open: _open,
        close: _close,
        subscribe(topic, handler, options) {
            _log('$wamp.subscribe', topic, options);
            return _defer(null, 'subscribe', topic, handler, null, null, options);
        },
        publish(topic, args, kwargs, options) {
            _log('$wamp.publish', topic, args, kwargs, options);
            return _defer(null, 'publish', topic, null, args, kwargs, options);
        },
        call(procedure, args, kwargs, options) {
            _log('$wamp.call', topic, args, kwargs, options);
            return _defer(null, 'call', procedure, null, args, kwargs, options);
        },
        register(procedure, endpoint, options) {
            _log('$wamp.register', procedure, options);
            return _defer(null, 'register', procedure, endpoint, null, null, options);
        },
        unsubscribe(topic) {
            _log('$wamp.unsubscribe', topic, options);
            return _defer(null, 'unsubscribe', topic, null, null, null, null);
        },
        unregister(procedure) {
            _log('$wamp.unregister', procedure, options);
            return _defer(null, 'unregister', procedure, null, null, null, null);
        }
    };

    Vue.prototype.$wamp = proto;
    Vue.Wamp = proto;

};
