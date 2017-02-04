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


    Vue.use(vuex); // @todo How to have global status data without Vuex?

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

    Vue.Wamp = (function(options) {
        options = options || {};

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

        function _status(clear) {
            const commit = function(){
                store.commit('status', {
                    connected: _connection.isConnected,
                    open:_connection.isOpen,
                    retrying:_connection.isRetrying
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
        function _close(context, reason, message) {
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
            if(i.type.substr(0, 2) == 'un') {
                return _session[i.type](i.name);
            }
            else if(i.type == 'subscribe' || i.type == 'register') {
                var d = defer();
                i.options.acknowledge = true;
                _session[i.type](i.name, i.callback, i.options).then(r => {
                    _collect.push({
                        name: i.name,
                        type: 'un' + i.type,
                        context: i.context,
                        instance: r
                    });
                    d.resolve(r);
                }, d.reject);
                return d.promise;
            } else {
                return _session[i.type](i.name, i.args, i.kwArgs, i.options);
            }
        }
        function _defer(context, type, name, callback, args, kwArgs, options) {
            _open();
            var i = {context, type, name, callback, args, kwArgs, options};
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
                for (let i in _collect) {
                    if (_collect.hasOwnProperty(i)) {
                        const q = _collect[i];
                        if (q.context == context && (q.type == 'unsubscribe' || q.type == 'unregister')) {
                            console.debug('Vue WAMP auto ' + q.type, q);
                            _session[q.type](q.instance);
                        }
                    }
                }
            }
        }
        return {
            isConnected() { return _connection.isConnected },
            isOpen() { return _connection.isOpen },
            isRetrying() { return _connection.isRetrying },
            open: _open,
            defer: _defer,
            detach: _detach,
            close: _close
        };
    })(options);

    Vue.mixin({
        computed: {
            '$wampIsConnected'() { return store.state.isConnected },
            '$wampIsOpen'() { return store.state.isOpen },
            '$wampIsRetrying'() { return store.state.isRetrying }
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
                                Vue.Wamp.defer(this, type, name, options.function, null, null, options)
                                    .then(
                                        r => { console.debug('Vue WAMP auto ' + type, r) },
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

    Vue.prototype.$wamp = { // @todo Object.defineProperties
        subscribe(topic, handler, options) {
            return Vue.Wamp.defer(this, 'subscribe', topic, handler, null, null, options);
        },
        publish(topic, args, kwargs, options) {
            return Vue.Wamp.defer(this, 'publish', topic, null, args, kwargs, options);
        },
        call(procedure, args, kwargs, options) {
            return Vue.Wamp.defer(this, 'call', procedure, null, args, kwargs, options);
        },
        register(procedure, endpoint, options) {
            return Vue.Wamp.defer(this, 'register', procedure, endpoint, null, null, options);
        },
        unsubscribe(topic) {
            return Vue.Wamp.defer(this, 'unsubscribe', topic, null, null, null, null);
        },
        unregister(procedure) {
            return Vue.Wamp.defer(this, 'unregister', procedure, null, null, null, null);
        }
    };
};
