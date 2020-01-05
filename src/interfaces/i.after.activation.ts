import { IContext } from './i.context';

export interface IAfterActivation {
  after(context: IContext): Promise<void> | void;
}
