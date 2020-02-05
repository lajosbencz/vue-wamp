import When from 'when'
import autobahn from 'autobahn'

export default interface Connection {
    open(): void;

    close(reason?: string, message?: string): void;

    prefix(alias: string, prefix: string): void

    getSession(): When.Promise;

    call(procedure: string, args?: [], kwArgs?: {}, options?: {}): When.Promise;

    register(procedure: string, endpoint: (args: [], kwArgs: {}, details: {}) => any, options?: {}): When.Promise;

    unregister(registration: autobahn.Registration): When.Promise;

    publish(topic: string, args?: [], kwArgs?: {}, options?: {}): When.Promise;

    subscribe(topic: string, handler: (args: [], kwArgs: {}, details: {}) => any, options?: {}): When.Promise;

    unsubscribe(subscription: autobahn.Subscription): When.Promise;
}
