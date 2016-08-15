export default function Trigger(config) {
  this._config = undefined;

  this.middleware = store => next => action => {
    const { config } = this;
    if (!config) throw new Error('You must specify a config object');
    
    const result = next(action);
    
    config.actions.forEach(value => {
      if (shouldCall(action, value.trigger)) {
        value.handler(action, store.dispatch, store.getState);
      }
    });
    
    return result;
  };
  
  function validateConfig(config) {
    if (!config) {
      throw new Error('Config can not be undefined');
    } 
    if (!config.actions) { 
      throw new Error('Config must have an `actions` property');
    }
    if (!Array.isArray(config.actions)) {
      throw new Error('`actions` must be an array of objects');
    }
    config.actions.forEach((value) => {
      if (typeof value !== 'object') {
        throw new Error('`actions` item must be an object');
      }
      if (!value.trigger || !value.handler) {
        throw new Error('`actions` item must have `trigger` and `handler` properties');
      }
      if (typeof value.trigger !== 'string' &&
          typeof value.trigger !== 'function' &&
          !Array.isArray(value.trigger)) {
        throw new Error('`trigger` must be either a string or a function taking an action or an array of strings');
      }
      if (typeof value.handler !== 'function') {
        throw new Error('`handler` must be a function taking an action');
      }
    });
  }
  
  function shouldCall(action, trigger) {
    if (typeof trigger === 'string') {
      return action.type === trigger;
    }
    if (typeof trigger === 'function') {
      return trigger(action);
    }
    if (Array.isArray(trigger)) {
      return trigger.some(t => t === action.type);
    }
  }

  function setConfig(config) {
    validateConfig(config);
    this._config = config;
  }

  Object.defineProperties(this, {
    'config': {
      'get': () => this._config,
      'set': setConfig
    }
  });
  
  if (config) this.config = config;  
}