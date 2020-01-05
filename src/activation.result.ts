export class ActivationResult {
  public success: boolean;
  public error: any;
  public payload: any;

  constructor() {
    this.setSuccess(null);
  }

  public setSuccess(payload: any): void {
    this.success = true;
    this.payload = payload;
    this.error = null;
  }

  public setError(error: any): void {
    this.success = false;
    this.error = error;
    this.payload = null;
  }

  public isError(): boolean {
    return !this.isSuccess();
  }

  public isSuccess(): boolean {
    return this.success === true;
  }
}
