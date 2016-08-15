redux-trigger-middleware
========================

Middleware that lets you call predefined functions on certain actions.

Install it
----------

`npm i -S redux-trigger-middleware`

Test it
-------

`git clone https://github.com/saintcrawler/redux-trigger-middleware.git && cd redux-trigger-middleware`

`npm i && npm test`

Use it
------

It just sits in your middleware chain and listens for trigger actions. You must supply it with triggers configuration object. 

There are 3 types of triggers:
  1. By action type. Triggers if `action.type === trigger.type`.
  2. By predicate. Triggers if `pred(action)` returns `true`.
  3. By array of action types. Triggers if `[type1, type2, type3].some(t => t === action.type)`.

Here is an example config object:

```javascript
const config = {
  actions: [
    {
      trigger: 'STRING_TRIGGER',
      handler: (action, dispatch) => {
        dispatch({type: 'iHaveBeenTriggered!'});
      }
    },
    {
      trigger: (action) => { return action.payload === 777 },
      handler: (a, d) => d({type: 'lucky!'});
    },
    {
      trigger: ['SOMEBODY', 'CALL', 'ME!'],
      handler: (a, d) => d({type: 'thanks'});
    }
  ]
}
```

As you may guess `handler` is a function that will be called on successful trigger.

In order to capture as most actions as possible, you may want to place this middleware at the end of the chain (but, probably, before some loggers, such as `redux-logger`). That's because your other middlewares can dispatch actions too and, sure, you want to catch 'em all.

Here is the complete example:

```javascript
import Trigger from 'redux-trigger-middleware'

const trigger = new Trigger(config); // `config` is from above
const enhancer = applyMiddleware(
  //thunk,
  //myOtherMiddleware,
  trigger.middleware,
  //logger
);
const store = createStore(reducer, {}, enhancer);
// And use it as you wish...
```

Bonus
-----

Also, this is a nice way to perform api calls. Use it together with [redux-call-api](https://github.com/saintcrawler/redux-call-api).


License
-------
ISC