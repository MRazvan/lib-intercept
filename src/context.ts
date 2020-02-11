import { Container } from 'inversify';
import { ActivationResult } from './activation.result';
import { IActivation, IContext } from './interfaces/i.context';

export class DefaultContext implements IContext {
  private _result: ActivationResult;
  private readonly _data: Record<string, any>;
  private _args: any[];
  constructor(private readonly _container: Container, private readonly _activation: IActivation) {
    this._result = new ActivationResult();
    this._data = {};
    this._args = null;
  }
  public execute(): Promise<any> {
    return this._activation.execute(this);
  }
  public getActivation(): IActivation {
    return this._activation;
  }
  public getContainer(): Container {
    return this._container;
  }
  public getResult(): ActivationResult {
    return this._result;
  }
  public setResult(res: ActivationResult): void {
    this._result = res;
  }
  public getArguments(): any[] {
    return this._args;
  }
  public setArguments(args: any[]): void {
    this._args = args;
  }
  public getData<T>(key: string, defaultVal?: T): T {
    const val = this._data[key];
    return val === undefined ? defaultVal : val;
  }
  public setData(key: string, data: any): void {
    this._data[key] = data;
  }
}
