<template>
    <div>
        <nav class="navbar navbar-default">
            <div class="btn-toolbar navbar-controls">
                <div class="btn-group btn-group-sm">
                    <a class="btn btn-default" @click="show = !show">
                        <i class="glyphicon"
                           :class="{'glyphicon-ok text-success':show, 'glyphicon-remove text-danger':!show}"></i>
                        <span>server</span>
                    </a>
                </div>
                <div class="btn-group btn-group-sm pull-right">
                </div>
                <div class="clearfix"></div>
            </div>
        </nav>

        <server v-if="show"></server>

    </div>
</template>

<script>

  import server from './components/server.vue'

  export default {
    components: {
      server,
    },
    data() {
      return {
        show: true,
      }
    },
    mounted() {
    },
  }
</script>
