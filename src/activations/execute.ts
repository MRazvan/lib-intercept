import { IBeforeActivation } from '../interfaces/i.before.activation';
import { IContext } from '../interfaces/i.context';
import { isAwaitable } from '../utils';

export class ExecuteActivation implements IBeforeActivation {
  public async before(context: IContext): Promise<boolean> {
    const activationInfo = context.getActivation();
    const container = context.getContainer();
    const targetInstance: any = container.get(activationInfo.class.target);
    const result = targetInstance[activationInfo.method.name].apply(targetInstance, context.getArguments());
    if (isAwaitable(result)) {
      const promiseResult = await result;
      return context.setSuccess(promiseResult);
    }
    return context.setSuccess(result);
  }
}
