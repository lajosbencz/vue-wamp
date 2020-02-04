import When from 'when'
import autobahn, {
  ICallOptions,
  IPublication,
  IPublishOptions,
  IRegisterOptions,
  IRegistration,
  ISubscribeOptions,
  ISubscription,
  RegisterEndpoint,
  SubscribeHandler
} from 'autobahn'
import IOptions from './IOptions'

export const DEFAULT_OPTIONS = {
  realm: 'realm1',
  ssr_close_timeout: 0,
};

export default class Connection extends autobahn.Connection {

  private _wampSession: autobahn.Session | null;
  private _wampSessionDefer: When.Deferred<autobahn.Session> | null;

  // private _wampCloseTimeout: number | NodeJS.Timeout | null;

  constructor(options: IOptions | undefined) {
    if (typeof options == 'undefined') {
      options = DEFAULT_OPTIONS;
    } else {
      options = {...DEFAULT_OPTIONS, ...options};
    }
    super(options);
    this._wampSession = null;
    this._wampSessionDefer = null;
    // this._wampCloseTimeout = null;

    this.onopen = function (session: autobahn.Session, details: any) {
      if (this._wampSessionDefer) {
        this._wampSessionDefer.resolve(session);
      }
    };

    this.onclose = function (reason: string, details: any): boolean {
      if (this._wampSessionDefer) {
        this._wampSessionDefer.reject({reason, details})
      }
      this._wampSessionDefer = null;
      this._wampSession = null;
      return true;
    }
  }

  public open(): void {
    super.open();
  }

  public close(reason: string, message: string): void {
    try {
      super.close(reason, message)
    } catch (e) {
    }
  }

  public getSession(): When.Promise<autobahn.Session> {
    if (!this._wampSession && !this._wampSessionDefer) {
      setTimeout(() => this.open(), 0);
    }
    if (!this._wampSessionDefer) {
      this._wampSessionDefer = this.defer<autobahn.Session>();
    }
    return this._wampSessionDefer.promise;
  }

  // protected _debounceClose(timeout: number = 0): void {
  //   if (timeout < 0) {
  //     if (this._wampCloseTimeout) {
  //       clearTimeout(this._wampCloseTimeout);
  //     }
  //     return;
  //   } else if (timeout === 0) {
  //     timeout = this._options.ssr_close_timeout;
  //   }
  //   if (timeout <= 0) {
  //     return;
  //   }
  //   this._debounceClose(-1);
  //   this._wampCloseTimeout = setTimeout(
  //     () => this.close('close', 'ssr_close_timeout'),
  //     timeout
  //   );
  // }

  protected _deferredSessionCall(method: string, args: []): When.Promise<any> {
    const d = this.defer<>();
    //this._debounceClose(-1);
    this.getSession().then((session) => {
      try {
        session[method](...args)
          .then(d.resolve, d.reject, d.notify)
        //.finally(() => this._debounceClose())
        ;
      } catch (e) {
        //this._debounceClose();
        d.reject(e);
      }
    }, d.reject);
    return d.promise;
  }

  public call(procedure: string, args?: any[] | any, kwargs?: any, options?: ICallOptions): When.Promise<any> {
    return this._deferredSessionCall('call', [procedure, args, kwargs, options]);
  }

  public register(procedure: string, endpoint: RegisterEndpoint, options?: IRegisterOptions): When.Promise<IRegistration> {
    return deferredSessionCall(this, 'register', [procedure, endpoint, options]);
  }

  public unregister(registration: IRegistration): When.Promise<any> {
    return deferredSessionCall(this, 'unregister', [registration]);
  }

  public publish(topic: string, args?: any[], kwargs?: any, options?: IPublishOptions): When.Promise<IPublication> {
    options = {
      ...options,
      acknowledge: true
    };
    return deferredSessionCall(this, 'publish', [topic, args, kwargs, options]);
  }

  public subscribe(topic: string, handler: SubscribeHandler, options?: ISubscribeOptions): When.Promise<ISubscription> {
    return deferredSessionCall(this, 'subscribe', [topic, handler, options]);
  }

  public unsubscribe(subscription: ISubscription): When.Promise<any> {
    return deferredSessionCall(this, 'unsubscribe', [subscription]);
  }

}
