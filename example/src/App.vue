<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/ex1">Example 1</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <div>
      <span v-if="$root.wampIsOpen">Open</span>
      <span v-else>Closed</span> |
      <span v-if="$root.wampIsConnected">Connected</span>
      <span v-else>Unconnected</span> |
      <span v-if="$root.wampIsRetrying">Retrying</span>
      <span v-else>Not retrying</span>
    </div>
    <router-view/>
  </div>
</template>
