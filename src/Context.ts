import Vue from 'vue'
import When from 'when'
import {
  ICallOptions,
  IPublication,
  IPublishOptions,
  IRegisterOptions,
  IRegistration,
  ISubscribeOptions,
  ISubscription,
  RegisterEndpoint,
  Session,
  SubscribeHandler
} from "autobahn";
import Connection from "./Connection";

export default class Context {
  protected _connection: Connection;
  protected _vm: Vue;
  protected _registry: {
    subscribe: { [topic: string]: ISubscription },
    register: { [procedure: string]: IRegistration },
  };

  constructor(connection: Connection, vm: Vue) {
    this._connection = connection;
    this._vm = vm;
  }

  public async destroy() {
    const wait: [When.Promise<any>?] = [];
    Object.values(this._registry.register).forEach((topic) => {
      wait.push(this.unregister(topic));
    });
    this._registry.register = {};
    Object.values(this._registry.subscribe).forEach((topic) => {
      wait.push(this.unsubscribe(topic));
    });
    this._registry.subscribe = {};
    await Promise.all(wait);
  }

  public call(procedure: string, args?: any[] | any, kwargs?: any, options?: ICallOptions): When.Promise<any> {
    return this._connection.call(procedure, args, kwargs, options);
  }

  public register(procedure: string, endpoint: RegisterEndpoint, options?: IRegisterOptions): When.Promise<IRegistration> {
    return this._connection.register(procedure, endpoint, options);
  }

  public unregister(registration: IRegistration): When.Promise<any> {
    return this._connection.unregister(registration);
  }

  public publish(topic: string, args?: any[], kwargs?: any, options?: IPublishOptions): When.Promise<IPublication> {
    options = {
      ...options,
      acknowledge: true
    };
    return this._connection.publish(topic, args, kwargs, options);
  }

  public subscribe(topic: string, handler: SubscribeHandler, options?: ISubscribeOptions): When.Promise<ISubscription> {
    return this._connection.subscribe(topic, handler, options);
  }

  public unsubscribe(subscription: ISubscription): When.Promise<any> {
    return this._connection.unsubscribe(subscription);
  }

}
