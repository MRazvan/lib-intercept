import { Container } from 'inversify';
import { IActivation } from './i.context';

export enum KeepActivation {
  NONE = 0x00,
  BEFORE = 0x01,
  AFTER = 0x02
}

export interface IConfigureActivation {
  configure(activation: IActivation, container: Container): KeepActivation;
}
