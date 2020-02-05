/**
 * Extends object with EventEmitter methods
 * @param {Object} obj
 * @param {String} [namespace]
 * @constructor
 */
export default function eventify(obj, namespace = '_eventifyEvents') {
  obj[namespace] = {};

  obj.on = (event, listener) => {
    if (!obj[namespace].hasOwnProperty(event)) {
      obj[namespace][event] = [];
    }
    obj[namespace][event].push(listener);
  };

  obj.emit = (event, ...args) => {
    if (!obj[namespace].hasOwnProperty(event)) {
      return;
    }
    obj[namespace][event].forEach((listener) => {
      listener.apply(obj, args);
    });
  };

  obj.off = (event, listener) => {
    if (!event) {
      obj[namespace] = {};
    }
    if (!obj[namespace].hasOwnProperty(event)) {
      return;
    }
    if (listener) {
      const i = obj[namespace][event].findIndex(l => l === listener);
      if (i >= 0) {
        obj[namespace][event].splice(i, 1);
      }
    } else {
      delete obj[namespace][event];
    }
  };

  obj.once = (event, listener) => {
    obj.on(event, function handler(...args) {
      obj.off(event, handler);
      listener.apply(obj, args);
    });
  };
};
