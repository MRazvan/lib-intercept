import { AnyDecoratorFactory, checkIfInstanceOf, ClassData, MethodData } from 'lib-reflect';
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

export const UseActivation = (
  activation: Function | IAfterActivation | IBeforeActivation,
  type?: InterceptorType
): any =>
  AnyDecoratorFactory((classData: ClassData, methodOrProp: any) => {
    const data = new InterceptorData();
    data.target = activation;
    if (!isNil(type)) {
      data.type = type;
    }
    if (isNil(methodOrProp)) {
      // Class decorator
      classData.attributesData.push(data);
    } else if (checkIfInstanceOf(methodOrProp, MethodData)) {
      // Method decorator
      methodOrProp.attributesData.push(data);
    } else {
      throw new Error('Invalid usage of the UseActivation decorator.');
    }
  });

export const UseBefore = (activation: Function | IBeforeActivation): any =>
  UseActivation(activation, InterceptorType.Before);
export const UseAfter = (activation: Function | IAfterActivation): any =>
  UseActivation(activation, InterceptorType.After);
