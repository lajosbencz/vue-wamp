
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
    import { RPC_1, RPC_2 } from './config.js'
    export default {
        data() {
            return {
                logString: ''
            }
        },
        methods: {
            log(format) {
                let args = [];
                for(let i in arguments) {
                    if(arguments.hasOwnProperty(i)) {
                        const a = arguments[i];
                        args.push((typeof a == 'object') ? JSON.stringify(a, null, 2) : a + '');
                    }
                }
                this.logString+= args.join(', ') + "\r\n";
            }
        },
        mounted() {
            const self = this;
            this.log('Server mounted');
            this.$wampRegister(RPC_1, function(args, kwArgs, details) {
                self.log('Calling: ' + RPC_1, {args, kwArgs, details});
                kwArgs = Object.assign({ length: 10, type: 'hex1', size: 2 }, kwArgs);
                let defer = deferred();
                let url = 'https://qrng.anu.edu.au/API/jsonI.php';
                this.$http.get(url, { params: kwArgs }).then(
                        function(r) {
                            //this.log('Random API response: ', r);
                            if(r.body.success) {
                                self.log('Resolved: ' + RPC_1, {args, kwArgs, r});
                                defer.resolve(r.body.data);
                            } else {
                                self.log('Failed: ' + RPC_1, {args, kwArgs, r});
                                defer.reject(url + ' responded with: ' + r.statusText);
                            }
                        }
                );
                return defer.promise;
            }, { acknowledge: true, invoke: 'roundrobin' });
        }
    }
</script>
