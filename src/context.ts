import { Container } from 'inversify';
import { IActivation, IContext } from './interfaces/i.context';

export class DefaultContext implements IContext {
  private _data: Record<string, any>;
  private _args: any[];
  private _success: boolean;
  public error: any;
  public payload: any;

  // IActivation
  public beforeActivationIdx = 0;
  public beforeActivationLength = 0;

  constructor(private readonly _container: Container, private readonly _activation: IActivation) {
    this.error = null;
    this.payload = null;
    this._success = true;
    this._data = null;
    this._args = null;
  }

  public setSuccess(payload: any): boolean {
    this._success = true;
    this.payload = payload;
    this.error = null;
    return true;
  }

  public setError(error: any): boolean {
    this._success = false;
    this.error = error;
    this.payload = null;
    return false;
  }

  public isError(): boolean {
    return !this.isSuccess();
  }

  public isSuccess(): boolean {
    return this._success === true;
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
  public getArguments(): any[] {
    return this._args;
  }
  public setArguments(args: any[]): void {
    this._args = args;
  }
  public getData<T>(key: string, defaultVal?: T): T {
    if (this._data === null) {
      return defaultVal;
    }
    const val = this._data[key];
    return val === undefined ? defaultVal : val;
  }
  public setData(key: string, data: any): void {
    if (this._data === null) {
      this._data = {};
    }
    this._data[key] = data;
  }
}
