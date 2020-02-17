import { ClassData, ClassDecoratorFactory } from 'lib-reflect';

export const kInterceptorSingletonKey = 'lib:intercept:singleton';

export function Singleton(): ClassDecorator {
  return ClassDecoratorFactory((cd: ClassData) => {
    cd.tags[kInterceptorSingletonKey] = true;
  });
}
