export class ActivationResult {
  public success: boolean;
  public error: any;
  public payload: any;

  constructor() {
    this.setSuccess(null);
  }

  public setSuccess(payload: any): boolean {
    this.success = true;
    this.payload = payload;
    this.error = null;
    return true;
  }

  public setError(error: any): boolean {
    this.success = false;
    this.error = error;
    this.payload = null;
    return false;
  }

  public isError(): boolean {
    return !this.isSuccess();
  }

  public isSuccess(): boolean {
    return this.success === true;
  }
}
