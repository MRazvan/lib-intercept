import { ClassData, MethodData } from 'lib-reflect';
import { isFunction, isNil, isString } from 'lodash';
import { IAfterActivation } from './interfaces/i.after.activation';
import { IBeforeActivation } from './interfaces/i.before.activation';
import { IActivation, IContext } from './interfaces/i.context';

function getErrorMessage(err: any): string {
  if (isNil(err)) return err;
  if (err instanceof Error) return err.message;
  if (isString(err)) return err;
  if (isString(err.message)) return err.message;
  return err;
}

class ActivationState {
  public beforeActivationIdx = 0;
  public afterActivationIdx = 0;
}

export type ErrorCallback = (interceptor: IBeforeActivation | IAfterActivation, err: any) => void;
export class Activation implements IActivation {
  public class: ClassData;
  public method: MethodData;
  public beforeActivation: IBeforeActivation[];
  public afterActivation: IAfterActivation[];

  public async execute(ctx: IContext, onError?: ErrorCallback): Promise<any> {
    // Allow the arguments to be set outside of any interceptor
    //    For example set them before we call execute. This is so we can use
    //    the activation outside of an environment using activation chains
    if (isNil(ctx.getArguments()) && this.method.parameters.length) {
      ctx.setArguments(new Array(this.method.parameters.length));
    }
    const interceptorChain: string[] = [];
    const activationState = new ActivationState();
    ctx.setData('activation_activation_state', activationState);
    ctx.setData('activation_interceptor_stack', interceptorChain);
    let beforeInterceptor: IBeforeActivation = null;
    try {
      let resultValue = false;
      for (
        activationState.beforeActivationIdx = 0;
        activationState.beforeActivationIdx < this.beforeActivation.length;
        ++activationState.beforeActivationIdx
      ) {
        beforeInterceptor = this.beforeActivation[activationState.beforeActivationIdx];
        interceptorChain.push(beforeInterceptor.constructor.name);
        const result = beforeInterceptor.before(ctx);

        resultValue = false;
        if (result instanceof Promise) {
          resultValue = await result;
        } else {
          resultValue = result;
        }

        // We do not continue with the processing
        if (resultValue === false) {
          interceptorChain[interceptorChain.length - 1] += ' - Stop continuation';
          break;
        }
      }
    } catch (err) {
      if (isFunction(onError)) {
        onError(beforeInterceptor, err);
      }
      interceptorChain[interceptorChain.length - 1] += ` - Error: ${getErrorMessage(err)}`;
      ctx.getResult().setError(err);
    }
    let afterActivation: IAfterActivation = null;
    for (
      activationState.afterActivationIdx = this.afterActivation.length - 1;
      activationState.afterActivationIdx >= 0;
      activationState.afterActivationIdx--
    ) {
      afterActivation = this.afterActivation[activationState.afterActivationIdx];
      interceptorChain.push(afterActivation.constructor.name);
      // We don't care about after activation result
      try {
        await afterActivation.after(ctx);
      } catch (err) {
        if (isFunction(onError)) {
          onError(beforeInterceptor, err);
        }
        interceptorChain[interceptorChain.length - 1] += ` - Error: ${getErrorMessage(err)}`;
        ctx.getResult().setError(err);
      }
    }
    return true;
  }

  public removeBeforeActivation(activation: IBeforeActivation, context: IContext): void {
    const idx = this.beforeActivation.indexOf(activation);
    if (idx >= 0) {
      const actionData = context.getData<ActivationState>('activation_activation_state');
      this.beforeActivation.splice(idx, 1);
      actionData.beforeActivationIdx--;
    }
  }

  public removeAfterActivation(activation: IAfterActivation, context: IContext): void {
    const idx = this.afterActivation.indexOf(activation);
    if (idx >= 0) {
      this.afterActivation.splice(idx, 1);
    }
  }
}
