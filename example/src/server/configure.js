// const proxy = require('express-http-proxy');
const autobahn = require('autobahn');

const fastify = require('fastify');
const fastifyWamp = require('fastify-wamp-router');

const fy = fastify();

fy.register(fastifyWamp, {
  port: 3443,
  realms: ['realm1'],
});

fy.listen(3000);

const abc = new autobahn.Connection({
  url: 'ws://localhost:3443',
  realm: 'realm1',
});

/**
 * Returns current time string
 * @return {string}
 */
function getTime() {
  return (new Date()).toLocaleString();
}

abc.onopen = (session, details) => {
  session.register('time', () => {
    return getTime();
  });
  setInterval(() => {
    session.publish('time', [], {time: getTime()});
  }, 2000);
};

abc.open();

module.exports = (app) => {
  // app.use('/ws/', proxy('http://localhost:3443'));
};
