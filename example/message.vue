
<style scoped lang="sass" rel="stylesheet/scss"></style>

<template>
    <div class="row">
        <div class="col-md-6">
            <div class="input-group input-group-sm">
                <input type="text" class="form-control" id="inp_message" placeholder="Message" v-model="input.message" />
                <div class="input-group-btn">
                    <button @click="$wampPublish('vue-wamp-message',[input.message])" class="btn btn-success">Send</button>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="well well-sm" v-if="display.message">{{ display.message }}</div>
        </div>
    </div>
</template>

<script>
    const
            topic = 'vue-wamp-message';
    let
            subscribe = {},
            register = {};

    subscribe[topic] = function(args, kwArgs) {
        console.log(topic, args, kwArgs);
        this.display.message = args[0];
    };

    export default {
        data() {
            return {
                input: {
                    message: 'Hello World!'
                },
                display: {
                    message: ''
                }
            };
        },
        wamp: {
            subscribe, register
        },
        watch: {
            'input.message': function(value, old) {
                this.$wampPublish(topic, [value]);
            }
        }
    }

</script>
