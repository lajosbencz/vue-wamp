/* eslint-disable */

const {createLocalVue, mount} = require('@vue/test-utils');
const localVue = createLocalVue();
const autobahn = require('autobahn');
const fastify = require('fastify');
const fastifyWamp = require('fastify-wamp-router');

function createFyServer(wsPort = 3443) {
  const fy = fastify();
  fy.register(fastifyWamp, {
    port: wsPort,
    realms: ['realm1'],
  });
  return fy;
}

function createWsClient(wsPort = 3443) {
  return new autobahn.Connection({
    url: 'ws://localhost:' + wsPort,
    realm: 'realm1',
  });
}

module.exports = {
  localVue,
  mount,
  createFyServer,
  createWsClient,
};
