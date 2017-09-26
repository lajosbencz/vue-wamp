<template>
    <div class="component-random">
        <div class="row">
            <span class="col-xs-8">Length</span>
            <div class="col-xs-4 text">
                <input class="form-control" v-model.number="input.length" type="number" min="1" max="1024"/>
            </div>
        </div>
        <div class="row">
            <span class="col-xs-8">Type</span>
            <div class="col-xs-4">
                <select class="form-control" v-model="input.type">
                    <option v-for="type in types">{{ type }}</option>
                </select>
            </div>
        </div>
        <div class="row">
            <span class="col-xs-8">Size</span>
            <div class="col-xs-4">
                <input class="form-control" v-model.number="input.size" type="number" min="1" max="1024"/>
            </div>
        </div>
        <div class="row">
            <div class="col-xs-8">
                <div class="pull-left result-value" v-for="v in values">
                    <span class="label label-primary">{{ v }}</span>
                </div>
                <div class="clearfix"></div>
            </div>
            <div class="col-xs-4">
                <button @click="generate" class="form-control btn btn-default" :disabled="working">
                    <span v-if="working"><i class="glyphicon glyphicon-repeat normal-right-spinner"></i></span>
                    <span v-else>Generate</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style>
    .component-random {
    }

    .component-random button {
        text-align: center;
    }

    .component-random .result-value {
        font-family: "Lucida Console", Monaco, monospace;
        padding: 1px 2px;
    }

    .component-random .result-value > .label {
        padding: 4px 6px;
    }
</style>

<script>

  function rnd(length, chars) {
    if(!chars) {
      chars = 'aA#!';
    }
    let mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    let result = '';
    for (let i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
  }

  import {RPC_1} from '../common.js'

  export default {
    data() {
      return {
        types: ['uint8', 'uint16', 'hex16'],
        working: false,
        values: [],
        input: {
          size: 1,
          type: 'hex16',
          length: 3
        }
      }
    },
    methods: {
      generate() {
        let self = this;
        this.working = true;
        this.$wamp.call('vue-wamp-random', [], this.input).then(
          function (r) {
            self.working = false;
            self.values = r;
          },
          function (e) {
            self.working = false;
            self.values = [];
            console.error(e);
          }
        );
      }
    },
    wamp: {
      register: {
        'vue-wamp-random': {
          function(args, kwArgs, details) {
            let r = [];
            for(let x=0; x<kwArgs.size; x++) {
              r.push(rnd(kwArgs.length));
            }
            return r;
          },
          persist: true,
        }
      }
    }
  }
</script>
