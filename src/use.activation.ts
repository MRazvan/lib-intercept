import { AnyDecoratorFactory, ClassData, DecoratorType, GetDecoratorType } from 'lib-reflect';
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

export const UseActivation = (
  activation: Function | IAfterActivation | IBeforeActivation,
  type?: InterceptorType,
  metadata?: any
): any =>
  AnyDecoratorFactory((classData: ClassData, methodOrProp: any, arg2: any) => {
    const data = new InterceptorData();
    data.target = activation;
    if (!isNil(type)) {
      data.type = type;
    }
    data.metadata = metadata;
    // Add the information on attributes data
    const decoratorType = GetDecoratorType(classData, methodOrProp, arg2);
    switch (decoratorType) {
      case DecoratorType.Class:
        classData.attributesData.push(data);
        break;
      case DecoratorType.Method:
        methodOrProp.attributesData.push(data);
        break;
      default:
        throw new Error('Invalid usage of the UseActivation decorator.');
    }
  });

export const UseBefore = (activation: Function | IBeforeActivation, metadata?: any): any =>
  UseActivation(activation, InterceptorType.Before, metadata);
export const UseAfter = (activation: Function | IAfterActivation, metadata?: any): any =>
  UseActivation(activation, InterceptorType.After, metadata);
