import { Container, injectable, METADATA_KEY } from 'inversify';
import { ClassData, MethodData, MethodFlags, ReflectHelper } from 'lib-reflect';
import { forEach, isEmpty, isFunction, isNil } from 'lodash';
import { Activation } from './activation.execution';
import { ExecuteActivation } from './activations/execute';
import { ExecuteActivationStatic } from './activations/execute.static';
import { TypeParamInterceptor } from './activations/type.param.inject';
import { kInterceptorSingletonKey } from './attributes/singleton';
import { InterceptorData, InterceptorType } from './interceptor.data';
import { IAfterActivation } from './interfaces/i.after.activation';
import { IBeforeActivation } from './interfaces/i.before.activation';
import { IActivation } from './interfaces/i.context';

export class ActivationsGenerator {
  private readonly _classes: ClassData[];
  private readonly _allActivations: InterceptorData[];
  constructor() {
    this._classes = [];
    this._allActivations = [];
  }

  public register(target: Function): ActivationsGenerator {
    const registeredClass = this._classes.find((classData: ClassData) => classData.target === target);
    if (!isNil(registeredClass)) {
      throw new Error(`Cannot register class '${target.name}' for activation, already registered.`);
    }

    const reflectData = ReflectHelper.getClass(target);
    if (isNil(reflectData)) {
      throw new Error(
        `Cannot register class '${target.name}' for activation, class is not found in reflection system.`
      );
    }
    reflectData.build();
    this._classes.push(reflectData);

    return this;
  }

  public addActivations(
    interceptor: Function | IAfterActivation | IBeforeActivation,
    type?: InterceptorType
  ): ActivationsGenerator {
    const interceptorData = new InterceptorData();
    interceptorData.target = interceptor;
    if (!isNil(type)) {
      interceptorData.type = type;
    }
    interceptorData.createInstance();

    if (!this._isBeforeActivation(interceptorData.instance) && !this._isAfterActivation(interceptorData.instance)) {
      throw new Error(`Object is not an interceptor '${interceptorData.instance.constructor.name}'.`);
    }
    this._allActivations.push(interceptorData);
    return this;
  }

  public generateActivations(container: Container): IActivation[] {
    // For each class, for each method, generate the activations
    const activations: IActivation[] = [];
    forEach(this._classes, (classData: ClassData) => {
      // Check if the class is decorated with inject
      if (!Reflect.hasOwnMetadata(METADATA_KEY.PARAM_TYPES, classData.target)) {
        injectable()(classData.target);
      }

      if (!container.isBound(classData.target)) {
        const boundInstance = container.bind(classData.target).toSelf();
        // Singleton?
        if (classData.tags[kInterceptorSingletonKey]) {
          boundInstance.inSingletonScope();
        }
      }

      // For each method on those classes
      forEach(classData.methods, (methodData: MethodData) => {
        const activation = new Activation();
        activation.class = classData;
        activation.method = methodData;
        activation.beforeActivation = [];
        activation.afterActivation = [];
        activations.push(activation);
      });
    });

    // The final interceptor (the one that actually executes the function call)
    const executeInterceptor = new InterceptorData();
    executeInterceptor.target = ExecuteActivation;
    executeInterceptor.createInstance();

    const executeInterceptorStatic = new InterceptorData();
    executeInterceptorStatic.target = ExecuteActivationStatic;
    executeInterceptorStatic.createInstance();

    // Injector for Type parameters registered in the container
    const typeInterceptor = new InterceptorData();
    typeInterceptor.target = TypeParamInterceptor;
    typeInterceptor.createInstance();

    // Create the activations list
    forEach(activations, (activation: Activation) => {
      // Go through all activations and check if we add them in the before / after list
      this._addActivations(activation, this._allActivations);

      // Now add the class activations if any
      const classActivations = activation.class.getAttributesOfType<InterceptorData>(InterceptorData);
      if (!isEmpty(classActivations)) {
        this._addActivations(activation, classActivations.reverse());
      }
      // Now add the method activations if any
      const methodActivations = activation.method.getAttributesOfType<InterceptorData>(InterceptorData);
      if (!isEmpty(methodActivations)) {
        this._addActivations(activation, methodActivations.reverse());
      }
      activation.beforeActivation.push(typeInterceptor.instance as IBeforeActivation);
      if (activation.method.flags === MethodFlags.STATIC) {
        // Finally add the execution interceptor
        activation.beforeActivation.push(executeInterceptorStatic.instance as IBeforeActivation);
      } else {
        // Finally add the execution interceptor
        activation.beforeActivation.push(executeInterceptor.instance as IBeforeActivation);
      }
    });
    return activations;
  }

  private _isBeforeActivation(instance: Record<string, any>): boolean {
    return isFunction((instance as IBeforeActivation).before);
  }

  private _isAfterActivation(instance: Record<string, any>): boolean {
    return isFunction((instance as IAfterActivation).after);
  }

  private _addActivations(activation: Activation, activations: InterceptorData[]): void {
    forEach(activations, (interceptor: InterceptorData) => {
      interceptor.createInstance();
      const interceptorInstance = interceptor.instance;
      if (
        (interceptor.type & InterceptorType.Before) === InterceptorType.Before &&
        this._isBeforeActivation(interceptorInstance)
      ) {
        activation.beforeActivation.push(interceptorInstance as IBeforeActivation);
      }
      if (
        (interceptor.type & InterceptorType.After) === InterceptorType.After &&
        this._isAfterActivation(interceptorInstance)
      )
        // It must be an After processor
        activation.afterActivation.push(interceptorInstance as IAfterActivation);
    });
  }
}
