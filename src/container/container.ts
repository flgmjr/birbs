import { getIdentifierOf, getStringFromSymbol } from '../utils/utils';
import { Behaviour } from '../behaviour/behaviour';
import { BehaviourType } from '../utils/types';
import { ContainerBuilder } from './container-builder';
import { EventEmitter } from 'events';

class CustomEmitter extends EventEmitter {};

export class Container extends ContainerBuilder{
  // class -------------------------
  private emitter : CustomEmitter = new CustomEmitter;
  public get name() : string {
    return getStringFromSymbol(this._identifier);
  };

  public get identifier() : symbol {
    return this._identifier;
  }

  public getEmitter(identifier : symbol) : CustomEmitter {
    if (identifier === this.identifier) {
      return this.emitter;
    }
  }

  public publish(behaviour : Behaviour | symbol) : void {
    const behaviourToBeEmitted : Behaviour = (typeof behaviour === 'symbol')?
      this.behaviours.get(behaviour) :
      behaviour;

    this.emitter.emit(behaviourToBeEmitted.identifier, behaviourToBeEmitted);

    this.teardown();
  }

  private teardown() : void {
    if (this.teardownStrategy === 'none') {
      return;
    }

    if (this.teardownStrategy === 'all') {
      this.behaviours.forEach((behaviour) => {
        this.emitter.removeAllListeners(behaviour.identifier);
      });

      this.behaviours = new Map();
      return;
    }

    this.filterOnceBehaviours();
  }

  private filterOnceBehaviours() : void {
    this.behaviours.forEach((behaviour) => {
      if (behaviour.type === 'once') this.emitter.removeAllListeners(behaviour.identifier);
    });

    this.getBehaviourListByType('once').forEach((behaviour) => {
      this.behaviours.delete(behaviour.identifier);
    });
  }

  private getBehaviourListByType(type : BehaviourType) : Behaviour[] {
    const list : Behaviour[] = [];
    this.behaviours.forEach((behaviour) => {
      if (behaviour.type === type) list.push(behaviour);
    });

    return list;
  }

  public signBehaviourByType(behaviour : Behaviour) : void {
    if (behaviour.type === 'always') {
      this.emitter.on(behaviour.identifier, behaviour.Act);
      this.behaviours.set(behaviour.identifier, behaviour);
      return;
    }

    this.emitter.once(behaviour.identifier, behaviour.Act);
    this.behaviours.set(behaviour.identifier, behaviour);
    return;
  }

  public flush() : void {
    this.teardown();
  }

  public sign(behaviour : Behaviour[] | Behaviour) : Container {
    if (Array.isArray(behaviour)) {
      behaviour.forEach((event) => {
        this.signBehaviourByType(event);
      });
      return;
    }

    this.signBehaviourByType(behaviour);
    return this;
  }

  public resign(behaviour : Behaviour[] | Behaviour | symbol[] | symbol) : Container {
    if (Array.isArray(behaviour)) {
      behaviour.forEach((event : symbol | Behaviour) => {
        this.emitter.removeAllListeners(getIdentifierOf(event));
        this.behaviours.delete(getIdentifierOf(event));
      });
      return;
    }

    this.behaviours.delete(getIdentifierOf(behaviour));
    return this;
  }

  // Add Actions to Behaviours [By Symbol or By itself]
};
