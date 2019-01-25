const autobahn = require('autobahn');

const connection = new autobahn.Connection({
  url: 'ws://vue-wamp.demo.server:9001/ws/',
  realm: 'realm1',
});

let timeInterval = null;

connection.onopen = (session, details) => {
  console.log('WAMP connected');

  // Simple RPC
  session.register('rpc.sum', (args, kwargs, details) => {
    console.log('rpc.sum called', {args, kwargs, details});
    let r = 0;
    for (let i in args) {
      if (args.hasOwnProperty(i)) {
        r += parseFloat(args[i])
      }
    }
    return r;
  }, {acknowledge: true})
    .then(() => console.log('rpc.sum registered'))
    .catch(console.error)
  ;

  // Progressive RPC
  session.register('rpc.progress', (args, kwargs, details) => {
    if (!details.progress) {
      throw 'receive_progress must be true'
    }
    console.log('rpc.progress called', {args, kwargs, details});
    const d = connection.defer();
    const p = Object.assign({count: 10, time: 10}, kwargs);
    let i = 0;
    let t = setInterval(() => {
      details.progress([i]);
      i++;
      if (i >= p.count) {
        clearInterval(t);
        d.resolve(i)
      }
    }, p.time * 1000 / p.count);
    return d.promise;
  }, {acknowledge: true, invoke: 'single'})
    .then(() => console.log('rpc.progress registered'))
    .catch(console.error)
  ;

  // Initiate a call
  session.subscribe('com.callback', (args, kwargs, details) => {
    console.log('com.callback message', {args, kwargs, details});
    session.call('rpc.callback-' + args[0], [], {args, kwargs, details}, {})
      .then(() => console.log('rpc.callback-' + args[0] + ' called'))
      .catch(console.error)
  }, {acknowledge: true})
    .then(() => console.log('com.callback subscribed'))
    .catch(console.error)
  ;

  // Publish the time periodically
  timeInterval = setInterval(() => {
    const now = new Date().toISOString();
    session.publish('com.time', [], {now}, {acknowledge: true})
      .then(() => console.log('com.time published', {now}))
      .catch(console.error)
    ;
  }, 1000);
};

connection.onclose = (reason, details) => {
  console.error('WAMP closed', {reason, details});
  if (timeInterval) {
    clearInterval(timeInterval);
  }
};

connection.open();
