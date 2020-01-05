import { IBeforeActivation } from '../interfaces/i.before.activation';
import { IContext } from '../interfaces/i.context';

export class ExecuteActivation implements IBeforeActivation {
  public before(context: IContext): boolean {
    const activationResult = context.getResult();
    try {
      const activationInfo = context.getActivation();
      const container = context.getContainer();
      let targetInstance: any = null;
      if (container.isBound(activationInfo.class.target)) {
        targetInstance = container.get(activationInfo.class.target);
      } else {
        targetInstance = Reflect.construct(activationInfo.class.target.prototype, []);
      }
      const result = targetInstance[activationInfo.method.name].apply(targetInstance, context.getArguments());
      activationResult.setSuccess(result);
    } catch (e) {
      activationResult.setError(e);
    }
    return activationResult.success;
  }
}
