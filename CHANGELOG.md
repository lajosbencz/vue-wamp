# vue-wamp CHANGELOG

## 3.x

### 3.1.0
 * ```wampIsOpen```, ```wampIsConnected``` and ```wampIsRetrying``` are only available on the ```$root``` component, to avoid data pollution. (Events are still emitted on all components)
 
### 3.0.0
 * Scrapped bundling, use your own toolchain to transpile to the desired compatibility level
 * Deprecated config options: ```onopen```, ```onclose```, ```debug```
 * New config options: ```namespace```, ```auto_reestablish```, ```auto_close_timeout```
 * Rudimentary TypeScript support 
 
## 2.x

## 1.x
