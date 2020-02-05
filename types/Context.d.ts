import When from 'when'
import autobahn from 'autobahn'
import Connection from './Connection'

export default interface Context {
    getConnection(): Connection;

    getSession(): When.Promise;

    on(event: string, fn: (...args: any) => any): void;

    once(event: string, fn: (...args: any) => any): void;

    off(event?: string, fn?: (...args: any) => any): void;

    call(procedure: string, args?: [], kwArgs?: {}, options?: {}): When.Promise;

    register(procedure: string, endpoint: (args: [], kwArgs: {}, details: {}) => any, options?: {}): When.Promise;

    unregister(registration: autobahn.Registration): When.Promise;

    publish(topic: string, args?: [], kwArgs?: {}, options?: {}): When.Promise;

    subscribe(topic: string, handler: (args: [], kwArgs: {}, details: {}) => any, options?: {}): When.Promise;

    unsubscribe(subscription: autobahn.Subscription): When.Promise;

    resume(): When.Promise;

    destroy(): When.Promise;
}
