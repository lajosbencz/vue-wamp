
<template>
    <div>
        <nav class="navbar navbar-default">
            <div class="btn-toolbar navbar-controls">
                <div class="btn-group btn-group-sm">
                    <a class="btn btn-default" v-for="(t, i) in show" @click="show[i] = !t">
                        <i class="glyphicon" :class="{'glyphicon-ok text-success':t, 'glyphicon-remove text-danger':!t}"></i>
                        <span>{{ i }}</span>
                    </a>
                </div>
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

        <h2>Random</h2>
        <com-random />

    </div>
</template>

<script>
    import ComRandom from './components/random.vue'
    export default {
        components: { ComRandom },
        data() {
            return {
                show: []
            }
        }
    }
</script>
