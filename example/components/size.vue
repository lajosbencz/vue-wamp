
<style scoped lang="sass" rel="stylesheet/scss">
    .area {
        display: table-cell;
        vertical-align: middle;
        text-align: center;
    }
</style>

<template>
    <div class="row">
        <div class="col-md-6">
            <div class="form-inline">
                <div class="form-group form-group-sm">
                    <label for="inp_width">Width</label>
                    <input type="number" class="form-control" id="inp_width" v-model="input.width" min="100" max="600" />
                </div>
                <div class="form-group form-group-sm">
                    <label for="inp_height">Height</label>
                    <input type="number" class="form-control" id="inp_height" v-model="input.height" min="2" max="200" />
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="alert alert-info pull-left">
                <div class="area" :style="{width: display.width+'px', height: display.height+'px'}">
                    <strong>{{ display.area }}</strong>
                    <br/>
                    {{ display.width }} x {{ display.height }}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    const
            _ = require('underscore'),
            topic = 'vue-wamp-size';
    let
            subscribe = {},
            register = {},
            calc;

    register[topic] = {
        invoke: 'random',
        function(args, kwArgs) {
            let w = args[0]+50, h = args[1]-20;
            return [w * h, w, h];
        }
    };

    export default {
        mounted() {
            let self = this;
            calc = _.debounce(function(width, height) {
                self.$wamp.call(topic, [width, height]).then(
                        function(r) {
                            self.display.width = r[1];
                            self.display.height = r[2];
                            self.display.area = r[0];
                        },
                        function(e) {
                            console.error(e);
                            self.display.width = width;
                            self.display.height = height;
                            self.display.area = 0;
                        }
                );
            }, 500);
        },
        watch: {
            'input.width'(val, old) {
                calc(this.input.width, this.input.height);
            },
            'input.height'(val, old) {
                calc(this.input.width, this.input.height);
            }
        },
        data() {
            return {
                color: '#0ff',
                input: {
                    width: 300,
                    height: 200
                },
                display: {
                    width: 300,
                    height: 200,
                    area: NaN
                }
            };
        },
        wamp: {
            subscribe, register
        }
    }
</script>
