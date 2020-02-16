import { ClassData, MethodData } from 'lib-reflect';
import { isFunction, isNil } from 'lodash';
import { IAfterActivation } from './interfaces/i.after.activation';
import { IBeforeActivation } from './interfaces/i.before.activation';
import { IActivation, IContext } from './interfaces/i.context';
import { isAwaitable } from './utils';

export type ErrorCallback = (interceptor: IBeforeActivation | IAfterActivation, err: any) => void;
export class Activation implements IActivation {
  public class: ClassData;
  public method: MethodData;
  public beforeActivation: IBeforeActivation[];
  public afterActivation: IAfterActivation[];
  public data: Record<string, any> = {};

  public async execute(ctx: IContext, onError?: ErrorCallback): Promise<IContext> {
    // Allow the arguments to be set outside of any interceptor
    //    For example set them before we call execute. This is so we can use
    //    the activation outside of an environment using activation chains
    if (this.method.parameters.length > 0 && isNil(ctx.getArguments())) {
      ctx.setArguments(new Array(this.method.parameters.length));
    }
    ctx.beforeActivationLength = this.beforeActivation.length;
    let beforeInterceptor: IBeforeActivation = null;
    try {
      let resultValue = false;
      for (
        ctx.beforeActivationIdx = 0;
        ctx.beforeActivationIdx < ctx.beforeActivationLength;
        ++ctx.beforeActivationIdx
      ) {
        beforeInterceptor = this.beforeActivation[ctx.beforeActivationIdx];
        const result = beforeInterceptor.before(ctx);

        resultValue = false;
        if (isAwaitable(result)) {
          resultValue = await result;
        } else {
          resultValue = result as boolean;
        }

        // We do not continue with the processing
        if (resultValue === false) {
          break;
        }
      }
    } catch (err) {
      if (isFunction(onError)) {
        onError(beforeInterceptor, err);
      }
      ctx.setError(err);
    }
    let afterActivation: IAfterActivation = null;
    for (let idx = this.afterActivation.length - 1; idx >= 0; idx--) {
      afterActivation = this.afterActivation[idx];
      // We don't care about after activation result
      try {
        const result = afterActivation.after(ctx);
        if (isAwaitable(result)) {
          await result;
        }
      } catch (err) {
        if (isFunction(onError)) {
          onError(beforeInterceptor, err);
        }
        ctx.setError(err);
      }
    }
    return ctx;
  }

  public removeBeforeActivation(activation: IBeforeActivation, context: IContext): void {
    const idx = this.beforeActivation.indexOf(activation);
    if (idx >= 0) {
      this.beforeActivation.splice(idx, 1);
      context.beforeActivationIdx--;
      context.beforeActivationLength--;
    }
  }

  public removeAfterActivation(activation: IAfterActivation, context: IContext): void {
    const idx = this.afterActivation.indexOf(activation);
    if (idx >= 0) {
      this.afterActivation.splice(idx, 1);
    }
  }
}
