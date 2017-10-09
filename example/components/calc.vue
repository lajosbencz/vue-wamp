<template>
    <div class="component-calc">
        <div class="row">
            <span class="col-xs-8">A</span>
            <div class="col-xs-4 text">
                <input class="form-control" v-model.number="input.a" type="number" />
            </div>
        </div>
        <div class="row">
            <span class="col-xs-8">B</span>
            <div class="col-xs-4">
                <input class="form-control" v-model.number="input.b" type="number" />
            </div>
        </div>
        <div class="row">
            <span class="col-xs-8">Operation</span>
            <div class="col-xs-4">
                <select class="form-control" v-model="input.op">
                    <option v-for="type in types">{{ type }}</option>
                </select>
            </div>
        </div>
        <div class="row">
            <div class="col-xs-8">
                <span v-if="!isNaN(result)" class="label label-primary">{{ result }}</span>
                <span v-if="isNaN(result)" class="label label-warning">NaN</span>
            </div>
            <div class="col-xs-4">
                <button @click="generate" class="form-control btn btn-default" :disabled="working">
                    <span v-if="working"><i class="glyphicon glyphicon-repeat normal-right-spinner"></i></span>
                    <span v-else>Calculate</span>
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

  import {RPC_CALC} from '../common.js'

  export default {
    data() {
      return {
        types: ['+', '-', '*', '/'],
        working: false,
        result: NaN,
        input: {
          a: 2,
          b: 5,
          op: '+'
        }
      }
    },
    methods: {
      generate() {
        let self = this;
        this.working = true;
        this.$wamp.call(RPC_CALC, [], this.input).then(
          function (r) {
            self.working = false;
            self.result = r;
          },
          function (e) {
            self.working = false;
            self.result = NaN;
            console.error(e);
          }
        );
      }
    },
    wamp: {
      register: {
      }
    }
  }
</script>
