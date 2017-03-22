
<style scoped lang="sass" rel="stylesheet/scss"></style>

<template>
    <div class="row">
        <div class="col-md-6">
            <div class="btn-toolbar">
                <div class="btn-group">
                    <a class="btn btn-default" v-for="i in items" :class="{'btn-primary': i == display.label}" @click="$wampPublish('vue-wamp-label',[i])">{{ i }}</a>
                </div>
                <div class="btn-group">
                    <a class="btn btn-danger" @click="$wampPublish('vue-wamp-label',[''])"><i class="glyphicon glyphicon-remove"></i></a>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="alert alert-info" v-if="display.label">
                <label>{{ display.label }}</label>
            </div>
        </div>
    </div>
</template>

<script>
    const
            topic = 'vue-wamp-label';
    let
            subscribe = {},
            register = {};

    subscribe[topic] = function(args, kwArgs) {
        console.log(topic, args, kwArgs);
        this.display.label = args[0];
    };

    export default {
        props: ['items'],
        data() {
            return {
                display: {
                    label: ''
                }
            };
        },
        mounted() {
            this.$wampSubscribe(topic, subscribe[topic]);
        }
    }

</script>
