import { isFunction, isNil } from 'lodash';
import { IAfterActivation } from './interfaces/i.after.activation';
import { IBeforeActivation } from './interfaces/i.before.activation';

export enum InterceptorType {
  Before = 0x01,
  After = 0x02
}

export class InterceptorData {
  public target: Function | IAfterActivation | IBeforeActivation;
  public instance: Record<string, any>;
  public type = InterceptorType.Before | InterceptorType.After;
  public metadata: any;
  public createInstance(): void {
    if (!isNil(this.instance)) {
      return;
    }
    if (isFunction(this.target)) {
      this.instance = Reflect.construct(this.target, []);
    } else {
      this.instance = this.target;
    }
  }
}
