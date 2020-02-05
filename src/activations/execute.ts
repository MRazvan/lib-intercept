import { IBeforeActivation } from '../interfaces/i.before.activation';
import { IContext } from '../interfaces/i.context';

export class ExecuteActivation implements IBeforeActivation {
  public before(context: IContext): boolean {
    const activationInfo = context.getActivation();
    const container = context.getContainer();
    const targetInstance: any = container.get(activationInfo.class.target);
    const result = targetInstance[activationInfo.method.name].apply(targetInstance, context.getArguments());
    return context.getResult().setSuccess(result);
  }
}
