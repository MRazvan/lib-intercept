import { IContext } from './i.context';

export interface IBeforeActivation {
  before(context: IContext): Promise<boolean> | boolean;
}
