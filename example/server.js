
import ab from 'autobahn'
import { options, TOP_1, TOP_2, RPC_1, RPC_2 } from './config'


const abConnection = new ab.Connection(options({}));

abConnection.onopen = (session, details) => {
  console.log('WAMP server connected', session, details);
  session
    .register(RPC_1, (args, kwArgs, details) => {}, { invoke:'roundrobin', acknowledge:true })
    .then(r => console.log('Server registered:', r), console.error);
  session
    .subscribe(TOP_1, (args, kwArgs, details) => {}, { acknowledge: true })
    .then(s => console.log('Server subscribed:', s), console.error);
};

export default abConnection;
