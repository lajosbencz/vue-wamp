/* eslint-disable */

import Connection from '../src/Connection';
import { createFyServer, createWsClient } from './utils.js'

describe('Connection', () => {

  const fy = createFyServer(4334);
  fy.listen(4333);
  const wsClient = createWsClient(4334);
  wsClient.open();

  const con = new Connection({
    realm: 'realm1',
    url: 'ws://localhost:3443',
    auto_close_timeout: 0,
    auto_reestablish: true,
    max_retries: 1,
  });

  it('should be without session', () => {
    expect(con.session).toBe(null);
  });

  it('should connect successfully', (done) => {
    con.getSession().then(session => {
      expect(con.session).toEqual(session);
      con.on('close', () => {
        done();
      });
      con.close();
    }, done);
    con.open();
  })

});

