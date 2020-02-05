<script>
export default {
  name: 'Time',
  data() {
    return {
      time: '',
    };
  },
  computed: {
    vmid() {
      return this._uid;
    },
  },
  created() {
    this.$watch();
    // console.log(this.$wamp._vm);
    // this.$wamp.subscribe('time', (args, kwArgs, details) => {
    //   console.log({vm: this._uid, time: kwArgs.time});
    //   this.time = kwArgs.time;
    // });
  },
  wamp: {
    subscribe: {
      time(args, kwArgs, details) {
        // console.log({vm: this._uid, time: kwArgs.time});
        this.time = kwArgs.time;
      },
    },
  },
};
</script>

<template>
    <div class="Time">
        {{ vmid }}
        The time is now:
        {{ time }}
    </div>
</template>

<style>
    .Time {
    }
</style>
