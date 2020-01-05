import { ParameterData } from 'lib-reflect';
import { IBeforeActivation } from '../interfaces/i.before.activation';
import { IContext } from '../interfaces/i.context';

export class TypeParamInterceptor implements IBeforeActivation {
  public before(context: IContext): boolean {
    const container = context.getContainer();
    const activationInfo = context.getActivation();
    const args = context.getArguments();
    let hasParams = false;
    activationInfo.method.parameters.forEach((param: ParameterData) => {
      if (container && container.isBound(param.target)) {
        hasParams = true;
        args[param.idx] = container.get(param.target);
      }
    });
    if (!hasParams) {
      // Remove this activation from the method's chain
      activationInfo.removeBeforeActivation(this, context);
    }
    return true;
  }
}
