import { IBeforeActivation } from '../interfaces/i.before.activation';
import { IContext } from '../interfaces/i.context';
import { isAwaitable } from '../utils';

export class ExecuteActivationStatic implements IBeforeActivation {
  public async before(context: IContext): Promise<boolean> {
    const activationInfo = context.getActivation();
    const target = activationInfo.class.target as any;
    const result = target[activationInfo.method.name].apply(null, context.getArguments());
    if (isAwaitable(result)) {
      const promiseResult = await result;
      return context.setSuccess(promiseResult);
    }
    return context.setSuccess(result);
  }
}
