<template>
    <div>
        <nav class="navbar navbar-default">
            <div class="btn-toolbar navbar-controls">
                <div class="btn-group btn-group-sm">
                    <a class="btn btn-default" v-for="(t, i) in show" @click="show[i] = !t">
                        <i class="glyphicon"
                           :class="{'glyphicon-ok text-success':t, 'glyphicon-remove text-danger':!t}"></i>
                        <span>{{ i }}</span>
                    </a>
                </div>
                <div class="btn-group btn-group-sm pull-right">
                </div>
                <div class="clearfix"></div>
            </div>
        </nav>

        <div v-for="(e, k) in show" :key="k" v-if="show[k]">
            <h2>{{ k }}</h2>
            <component :is="'com-'+k"></component>
        </div>

    </div>
</template>

<script>
  import ComMessage from './components/message.vue'
  import ComRandom from './components/random.vue'
  import ComCalc from './components/calc.vue'

  export default {
    components: {ComMessage,ComRandom,ComCalc},
    data() {
      return {
        show: {
          random: true,
          calc: true,
          message: true,
        }
      }
    },
    mounted() {
    }
  }
</script>
