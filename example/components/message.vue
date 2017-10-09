<style scoped lang="sass" rel="stylesheet/scss"></style>

<template>
    <div class="row">
        <div class="col-md-6">
            <div class="input-group input-group-sm">
                <input class="form-control" placeholder="Message" v-model="input.message"/>
                <div class="input-group-btn">
                    <button @click="sendMessage()" class="btn btn-success">Send</button>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="well well-sm" v-if="display.message">{{ display.message }}</div>
        </div>
    </div>
</template>

<script>

  import {TOP_MESSAGE} from '../common'

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
      subscribe: {
        [TOP_MESSAGE](args, kwArgs, details) {
          this.display.message = args[0];
        }
      }
    },
    methods: {
      sendMessage() {
        this.$wamp.publish(TOP_MESSAGE, [this.input.message]);
      }
    },
  }

</script>
