import _ from 'lodash';

/**
 * Extends object with EventEmitter methods
 * @param {Object} obj
 * @constructor
 */
export default function eventify(obj) {
  obj._events = {};

  obj.on = (event, listener) => {
    if (_.isNil(obj._events[event])) {
      obj._events[event] = [];
    }
    obj._events[event].push(listener);
  };

  obj.emit = (event, ...args) => {
    if (_.isNil(obj._events[event])) {
      return;
    }
    _.forEach(obj._events[event], (listener) => {
      listener.apply(obj, args);
    });
  };

  obj.off = (event, listener) => {
    if (_.isNil(obj._events[event])) {
      return;
    }
    _.pull(obj._events[event], listener);
  };

  obj.once = (event, listener) => {
    obj.on(event, function handler(...args) {
      obj.removeListener(event, handler);
      listener.apply(obj, args);
    });
  };
};
