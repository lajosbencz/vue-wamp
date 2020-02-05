<script>
import Time from '../components/Time';
export default {
  name: 'Example1',
  components: {Time},
  data() {
    return {
      show: [true, true],
    };
  },
  methods: {
    toggle(n) {
      this.$set(this.show, n, !this.show[n]);
    },
  },
};
</script>

<template>
    <div class="Example1">
        <div>
            <button @click="toggle(0)">toggle 1</button>
            <button @click="toggle(1)">toggle 2</button>
        </div>
        <Time key="ex1" v-if="show[0]" />
        <Time key="ex2" v-if="show[1]" />
    </div>
</template>

<style>
    .Example1 {
    }
</style>
