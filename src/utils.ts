import { isFunction } from 'lodash';

export function isAwaitable(obj: any): boolean {
  return obj && isFunction(obj.then);
}
