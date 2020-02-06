const FoxRouter = require('fox-wamp');
const autobahn = require('autobahn');

module.exports = (app, server) => {
  return;
  const router = new FoxRouter();
  router.listenWAMP({server: app, path: '/ws/'});

  const connection = new autobahn.Connection({
    url: 'ws://localhost:3000/ws/',
    realm: 'realm1',
  });

  connection.onopen = (session, details) => {
    setInterval(() => {
      const time = (new Date).toLocaleString();
      session.publish('time', [time], {time});
    }, 2000);

    session.register('add', (args) => {
      let sum = 0;
      args.forEach((v) => sum += v);
      return sum;
    });
  };

  connection.open();
};
