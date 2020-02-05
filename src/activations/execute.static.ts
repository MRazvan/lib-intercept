import { IBeforeActivation } from '../interfaces/i.before.activation';
import { IContext } from '../interfaces/i.context';

export class ExecuteActivationStatic implements IBeforeActivation {
  public before(context: IContext): boolean {
    const activationInfo = context.getActivation();
    const target = activationInfo.class.target as any;
    const result = target[activationInfo.method.name].apply(null, context.getArguments());
    return context.getResult().setSuccess(result);
  }
}
