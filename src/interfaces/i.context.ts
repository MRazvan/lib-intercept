import { Container } from 'inversify';
import { ClassData, MethodData } from 'lib-reflect';
import { IAfterActivation } from './i.after.activation';
import { IBeforeActivation } from './i.before.activation';

export type ActivationErrorCallback = (interceptor: IBeforeActivation | IAfterActivation, err: any) => void;

export interface IActivation {
  // The reflection information for the target class
  class: ClassData;
  // The reflection information for the target method
  method: MethodData;
  // Before execution activations
  beforeActivation: IBeforeActivation[];
  // After execution activations
  afterActivation: IAfterActivation[];
  // Execute this activation
  execute(ctx: IContext, onError?: ActivationErrorCallback): Promise<any>;
  // Remove a before interceptor from the chain of this method
  removeBeforeActivation(activation: IBeforeActivation, context: IContext): void;
  // Remove an after interceptor from the chain of this method
  removeAfterActivation(activation: IAfterActivation, context: IContext): void;
  // Any data specific for this activation
  data: Record<string, any>;
}

export interface IContext {
  error: any;
  payload: any;
  beforeActivationIdx: number;
  beforeActivationLength: number;
  // Execute the activation (wrapper over activation.execute(ctx))
  execute(): Promise<any>;
  // Get the activation from this execution context
  getActivation(): IActivation;
  setSuccess(payload: any): boolean;
  setError(error: any): boolean;
  isError(): boolean;
  isSuccess(): boolean;
  // Get the DI container
  getContainer(): Container;
  // Get the arguments used to call the target method
  getArguments(): any[];
  // Set the arguments used to call the target method
  setArguments(args: any[]): void;
  // Dictionary to set custom data on this context
  getData<T>(key: string, defaultVal?: T): T;
  setData(key: string, data: any): void;
}
