/* eslint-disable */

import Connection from '../src/Connection';

const con = new Connection({
  realm: 'realm1',
  url: 'ws://localhost/ws/',
  auto_close_timeout: 0,
  auto_reestablish: true,
  max_retries: 1,
});

test('unconnected state', () => {
  expect(con.session).toBe(null);
});

test('session promise', (done) => {
  con.getSession().then(session => {
    expect(con.session).toEqual(session);
    done();
  }, done);
  con.open();
});
