import { createStore, applyMiddleware } from 'redux'
import { expect } from 'chai'

import Trigger from '../trigger'

function HelperMiddleware() {
  this.counter = 0;
  this.middleware = () => next => action => {
    ++this.counter;
    return next(action);
  }
}

describe('Trigger', function() {
  let store;
  let trigger;
  let helperMiddleware;
  let checkArgsFn;
  const config = {
    actions: [
      {
        trigger: 'STRING_TRIGGER',
        handler: (action, dispatch) => { dispatch({type: 'BY_STRING'}); }
      },
      {
        trigger: 'BAR',
        handler: (action, dispatch) => { dispatch({type: 'BY_STRING'}); }
      },
      {
        trigger: 'CHECK_ARGS',
        handler: (action, dispatch, getState) => {
          checkArgsFn(action, dispatch, getState);
        }
      },
      {
        trigger: (action) => { return action.payload === 777; },
        handler: (action, dispatch) => { dispatch({type: 'BY_PREDICATE'}); }
      },
      {
        trigger: (action) => { return action.type.match(/AR$/); },
        handler: (action, dispatch) => { dispatch({type: 'BY_PREDICATE'}); }
      },
      {
        trigger: ['FOO', 'BAR', 'BAZ'],
        handler: (action, dispatch) => { dispatch({type: 'BY_STRING_ARRAY'}); }
      }
    ]
  };
  const reducer = (state, action) => {
    switch (action.type) {
      case 'TEST':
        return { ...state, isNotTriggered: true }
      case 'STRING_TRIGGER':
        return { ...state, stringTrigger: true }
      case 'BY_STRING':
        return { ...state, byString: true }
      case 'BY_PREDICATE':
        return { ...state, byPredicate: true }
      case 'BY_STRING_ARRAY':
        return { ...state, byStringArray: true }
      case 'BAR':
        return { ...state, barTrigger: true }
      case 'DUMMY':
        return { ...state, counter: action.payload }
      default:
        return state;
    }
  };

  beforeEach(function() {
    trigger = new Trigger(config);
    helperMiddleware = new HelperMiddleware();
    const enhancer = applyMiddleware(helperMiddleware.middleware, trigger.middleware);
    store = createStore(reducer, {}, enhancer);
  });
  
  describe('#constructor', function() {
    it('assigns config to the property if config is defined', function() {
      const t = new Trigger(config);
      expect(t.config).to.equal(config);
    });

    it('does not set a config if it is undefined', function() {
      const t = new Trigger();
      expect(t.config).to.be.undefined;
    });
  });
  
  describe('#config', function() {
    it('assigns config to the property', function() {
      const t = new Trigger();
      t.config = config;
      expect(t.config).to.equal(config);
    });

    it('throws if config is invalid', function() {
      const badConfig1 = { bad: true };
      const badConfig2 = { actions: {
        'TEST': { bad: true }
      }};
      expect(() => trigger.config = undefined).to.throw();
      expect(() => trigger.config = badConfig1).to.throw();
      expect(() => trigger.config = badConfig2).to.throw();      
    });
  });
  
  describe('#middleware', function() {
    it('throws an error if config is missing', function() {
      const t = new Trigger();
      const s = createStore(reducer, {}, applyMiddleware(t.middleware));
      expect(() => s.dispatch({type: 'TEST'})).to.throw();
    });
    
    describe('can be triggered by', function() {
      it('action type', function() {
        store.dispatch({type: 'STRING_TRIGGER'});
        expect(store.getState()).to.eql({stringTrigger: true, byString: true});
      });
      
      it('predicate', function() {
        store.dispatch({type: '123', payload: 777});
        expect(store.getState()).to.eql({byPredicate: true});
      });
      
      it('any of action types from given array', function() {
        store.dispatch({type: 'BAZ'});
        expect(store.getState()).to.eql({byStringArray: true});
      });
      
      it('multiple triggers', function() {
        store.dispatch({type: 'BAR'});
        expect(store.getState()).to.eql({byString: true, byPredicate: true, byStringArray: true, barTrigger: true});
      });
    });

    describe('when did not pull any triggers', function() {
      it('passes the action further', function() {
        store.dispatch({type: 'TEST'});
        expect(store.getState()).to.eql({isNotTriggered: true});
      });
    });   

    describe('when catches the action', function() {     
      it('passes the action further, before invoking any handlers', function() {
        let counter = 0;
        store.subscribe(() => {
          ++counter;
          if (counter == 1) {
            expect(store.getState()).to.eql({stringTrigger: true});
          }
          if (counter == 2) {
            expect(store.getState()).to.eql({stringTrigger: true, byString: true});
          }
        });
        store.dispatch({type: 'STRING_TRIGGER'});
      });
      
      it('invokes handler function with proper arguments', function() {
        helperMiddleware.counter = 0;
        const checkArgsAction = {type: 'CHECK_ARGS'};
        checkArgsFn = (action, dispatch, getState) => {
          expect(action).to.eql(checkArgsAction);
          expect(getState).to.equal(store.getState);
          // Since all middlewares get slightly different `dispatch`
          // function, we can not directly check for equality of two
          // functions. So, we use HelperMiddleware to check if 
          // dispatched action can travel again through the middleware
          // chain to the store.
          dispatch({type: 'DUMMY', payload: 2});
          expect(helperMiddleware.counter).to.equal(2);
          dispatch({type: 'DUMMY', payload: 3});
          expect(helperMiddleware.counter).to.equal(3);
          expect(getState()).to.eql({counter: 3});
        }
        store.dispatch(checkArgsAction);
      });
    });
  });
});