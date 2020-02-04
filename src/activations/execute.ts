import { IBeforeActivation } from '../interfaces/i.before.activation';
import { IContext } from '../interfaces/i.context';

export class ExecuteActivation implements IBeforeActivation {
  public before(context: IContext): boolean {
    const activationResult = context.getResult();
    const activationInfo = context.getActivation();
    const container = context.getContainer();
    const targetInstance: any = container.get(activationInfo.class.target);
    if (targetInstance[activationInfo.method.name]) {
      const result = targetInstance[activationInfo.method.name].apply(targetInstance, context.getArguments());
      activationResult.setSuccess(result);
    } else {
      throw new Error(`Invalid target activation method '${activationInfo.class.name}.${activationInfo.method.name}'`);
    }
    return activationResult.success;
  }
}
