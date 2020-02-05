import { ClassData, ClassDecoratorFactory } from 'lib-reflect';

export const kInterceptorSingletonKey = 'lib:intercept:singleton';

export const Singleton = (): ClassDecorator =>
  ClassDecoratorFactory((cd: ClassData) => {
    cd.tags[kInterceptorSingletonKey] = true;
  });
