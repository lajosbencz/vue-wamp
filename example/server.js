const autobahn = require('autobahn');

const connection = new autobahn.Connection({
  url: 'ws://ubuntu16:9001',
  realm: 'realm1',
});

let interval = null;

connection.onopen = (session, details) => {
  console.info('WAMP connected');

  // Register RPC
  session.register('com.proc1', (args, kvArgs, details) => {
    return [[1, 2, 3], {"a": 1, "b": 2, "c": 3}];
  }, {acknowledge: true})
    .then(() => {
      console.log('com.proc1 registered!')
    })
    .catch(console.error)
  ;

  // Publish the time periodically
  interval = setInterval(() => {
    const now = new Date().toISOString();
    session.publish('com.time', [], {now}, {acknowledge: true})
      .then(console.info)
      .catch(console.error)
    ;
    console.info('time published!', {now});
  }, 5000);
};

connection.onclose = (reason, details) => {
  console.error('WAMP closed', {reason, details});
  if (interval) {
    clearInterval(interval);
  }
};

connection.open();
