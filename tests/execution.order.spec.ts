import { expect } from "chai";
import { Container } from "inversify";
import { ClassData, MethodData, MethodDecoratorFactory } from "lib-reflect";
import { ActivationsGenerator, DefaultContext, IActivation, IAfterActivation, IBeforeActivation, IContext, UseActivation } from "../index";
import { IConfigureActivation, KeepActivation } from "../src/interfaces/i.configure.activation";
import _ = require("lodash");

class BeforeInterceptor_1 implements IBeforeActivation {
   before(context: IContext): Promise<boolean> {
      context.setData('order', [...(context.getData<any>('order') || []), 'BeforeInterceptor_1']);
      return Promise.resolve(true);
   }
}

class BeforeInterceptor_2 implements IBeforeActivation {
   before(context: IContext): Promise<boolean> {
      context.setData('order', [...(context.getData<any>('order') || []), 'BeforeInterceptor_2']);
      return Promise.resolve(true);
   }
}

class BeforeInterceptor_3 implements IBeforeActivation {
   before(context: IContext): Promise<boolean> {
      context.setData('order', [...(context.getData<any>('order') || []), 'BeforeInterceptor_3']);
      return Promise.resolve(true);
   }
}

class ErrorInterceptor implements IBeforeActivation {
   before(context: IContext): Promise<boolean> {
      return Promise.resolve(false);
   }
}

class ClassInterceptor_1 implements IBeforeActivation {
   before(context: IContext): Promise<boolean> {
      context.setData('order', [...(context.getData<any>('order') || []), 'ClassInterceptor_1']);
      return Promise.resolve(true);
   }
}

class MethodInterceptor_1 implements IBeforeActivation {
   before(context: IContext): Promise<boolean> {
      context.setData('order', [...(context.getData<any>('order') || []), 'MethodInterceptor_1']);
      return Promise.resolve(true);
   }
}

class AfterInterceptor_1 implements IAfterActivation {
   after(context: IContext): Promise<void> {
      context.setData('order', [...(context.getData<any>('order') || []), 'AfterInterceptor_1']);
      return Promise.resolve();
   }
}

class AfterClassInterceptor_1 implements IAfterActivation {
   after(context: IContext): Promise<void> {
      context.setData('order', [...(context.getData<any>('order') || []), 'AfterClassInterceptor_1']);
      return Promise.resolve();
   }
}

class AfterMethodInterceptor_1 implements IAfterActivation {
   after(context: IContext): Promise<void> {
      context.setData('order', [...(context.getData<any>('order') || []), 'AfterMethodInterceptor_1']);
      return Promise.resolve();
   }
}

class AfterMethodInterceptor_2 implements IAfterActivation {
   after(context: IContext): Promise<void> {
      context.setData('order', [...(context.getData<any>('order') || []), 'AfterMethodInterceptor_2']);
      context.getActivation().removeAfterActivation(this, context);
      return Promise.resolve();
   }
}

class AfterMethodInterceptor_3 implements IAfterActivation {
   after(context: IContext): Promise<void> {
      context.setData('order', [...(context.getData<any>('order') || []), 'AfterMethodInterceptor_3']);
      return Promise.resolve();
   }
}

const MethodAttr = () => MethodDecoratorFactory(<T>(classData: ClassData, pk: MethodData, d: any) => { });

class TestClass {
   @MethodAttr()
   public method1() { }
}

@UseActivation(ClassInterceptor_1)
class TestClassInterceptor {
   @MethodAttr()
   public method1() { }
}

@UseActivation(ClassInterceptor_1)
class TestClassMethodInterceptor {
   @UseActivation(MethodInterceptor_1)
   @MethodAttr()
   public method1() { }
}

@UseActivation(AfterClassInterceptor_1)
class TestAfterInterceptor {
   @UseActivation(AfterMethodInterceptor_1)
   @MethodAttr()
   public method1() { }
}

@UseActivation(BeforeInterceptor_1)
@UseActivation(BeforeInterceptor_2)
class TestMultipleClassInterceptorsAttributes {
   @MethodAttr()
   public method1() { }
}

class TestMultipleMethodInterceptorsAttributes {
   @UseActivation(BeforeInterceptor_1)
   @UseActivation(BeforeInterceptor_2)
   @MethodAttr()
   public method1() { }
}

class TestErrorOrder {
   @MethodAttr()
   public method1() { }
}

class TestRemoveAfterInterceptor {
   @UseActivation(AfterMethodInterceptor_1)
   @UseActivation(AfterMethodInterceptor_2)
   @UseActivation(AfterMethodInterceptor_3)
   @MethodAttr()
   public method1() { }
}

describe('Order of activations', () => {
   function getMethod(activations: IActivation[], mName: string): IActivation {
      return activations.find(a => a.method.name === mName);
   }
   it('Global activations should be called in the order of addition', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      activations.addActivations(BeforeInterceptor_1);
      activations.addActivations(BeforeInterceptor_2);
      activations.register(TestClass);
      methodAction = getMethod(activations.generateActivations(container), 'method1');
      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      const order = context.getData('order');
      expect(order).to.deep.eq(['BeforeInterceptor_1', 'BeforeInterceptor_2']);
   });

   it('Class activations should be called after global activations', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      activations.addActivations(BeforeInterceptor_1);
      activations.addActivations(BeforeInterceptor_2);
      activations.register(TestClassInterceptor);
      methodAction = getMethod(activations.generateActivations(container), 'method1');
      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      const order = context.getData('order');
      expect(order).to.deep.eq(['BeforeInterceptor_1', 'BeforeInterceptor_2', 'ClassInterceptor_1']);
   });

   it('Method activations should be called after class and global activations', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      activations.addActivations(BeforeInterceptor_1);
      activations.addActivations(BeforeInterceptor_2);
      activations.register(TestClassMethodInterceptor);
      methodAction = getMethod(activations.generateActivations(container), 'method1');
      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      const order = context.getData('order');
      expect(order).to.deep.eq(['BeforeInterceptor_1', 'BeforeInterceptor_2', 'ClassInterceptor_1', 'MethodInterceptor_1']);
   });


   it('After activations should be called in reverse order [method, class, global]', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      activations.addActivations(AfterInterceptor_1);
      activations.register(TestAfterInterceptor);
      methodAction = getMethod(activations.generateActivations(container), 'method1');
      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      const order = context.getData('order');
      expect(order).to.deep.eq(['AfterMethodInterceptor_1', 'AfterClassInterceptor_1', 'AfterInterceptor_1']);
   });

   it('Multiple activations added on class as attributes should be called in the order of addition', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      activations.register(TestMultipleClassInterceptorsAttributes);
      methodAction = getMethod(activations.generateActivations(container), 'method1');
      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      const order = context.getData('order');
      expect(order).to.deep.eq(['BeforeInterceptor_1', 'BeforeInterceptor_2']);
   });

   it('Multiple activations added on method as attributes should be called in the order of addition', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      activations.register(TestMultipleMethodInterceptorsAttributes);
      methodAction = getMethod(activations.generateActivations(container), 'method1');
      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      const order = context.getData('order');
      expect(order).to.deep.eq(['BeforeInterceptor_1', 'BeforeInterceptor_2']);
   });

   it('Before activations should stop if an error happened', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      activations.addActivations(BeforeInterceptor_1);
      activations.addActivations(BeforeInterceptor_2);
      activations.addActivations(ErrorInterceptor);
      activations.addActivations(BeforeInterceptor_3);
      activations.register(TestErrorOrder);
      methodAction = getMethod(activations.generateActivations(container), 'method1');
      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      const order = context.getData('order');
      expect(order).to.deep.eq(['BeforeInterceptor_1', 'BeforeInterceptor_2']);
   });


   it('After activations should all execute if an error happened', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      activations.addActivations(BeforeInterceptor_1);
      activations.addActivations(BeforeInterceptor_2);
      activations.addActivations(ErrorInterceptor);
      activations.addActivations(BeforeInterceptor_3);
      activations.addActivations(AfterInterceptor_1);
      activations.register(TestAfterInterceptor);
      methodAction = getMethod(activations.generateActivations(container), 'method1');
      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      const order = context.getData('order');
      expect(order).to.deep.eq(['BeforeInterceptor_1', 'BeforeInterceptor_2', 'AfterMethodInterceptor_1', 'AfterClassInterceptor_1', 'AfterInterceptor_1']);
   });

   it('After activations should be able to remove themselves from the activation list', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      let context: DefaultContext = null;
      activations.register(TestRemoveAfterInterceptor);
      methodAction = getMethod(activations.generateActivations(container), 'method1');

      context = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      let order = context.getData('order');
      expect(order).to.deep.eq(['AfterMethodInterceptor_3', 'AfterMethodInterceptor_2', 'AfterMethodInterceptor_1']);

      context = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      order = context.getData('order');
      expect(order).to.deep.eq(['AfterMethodInterceptor_3', 'AfterMethodInterceptor_1']);
   });
   describe('Should use configuration if available', () => {
      it('respect NONE', async () => {
         class TestActivator implements IConfigureActivation, IBeforeActivation, IAfterActivation {
            before(context: IContext): boolean | Promise<boolean> {
               throw new Error("Method not implemented.");
            }
            after(context: IContext): void | Promise<void> {
               throw new Error("Method not implemented.");
            }
            configure(activation: IActivation): KeepActivation {
               return KeepActivation.NONE;
            }
         }

         class Test {
            @MethodAttr()
            public method1(){}
         }
         const activations: ActivationsGenerator = new ActivationsGenerator();
         let container: Container = new Container();
         activations.register(Test);
         activations.addActivations(TestActivator);
         const methodAction = getMethod(activations.generateActivations(container), 'method1');
         expect(methodAction.afterActivation.length).to.eq(0);
         expect(methodAction.beforeActivation.length).to.eq(2);
      });   
      it('respect BEFORE', async () => {
         class TestActivator implements IConfigureActivation, IBeforeActivation, IAfterActivation {
            before(context: IContext): boolean | Promise<boolean> {
               throw new Error("Method not implemented.");
            }
            after(context: IContext): void | Promise<void> {
               throw new Error("Method not implemented.");
            }
            configure(activation: IActivation): KeepActivation {
               return KeepActivation.BEFORE;
            }
         }
         class Test {
            @MethodAttr()
            public method1(){}
         }
         const activations: ActivationsGenerator = new ActivationsGenerator();
         let container: Container = new Container();
         activations.register(Test);
         activations.addActivations(TestActivator);
         const methodAction = getMethod(activations.generateActivations(container), 'method1');
         expect(methodAction.afterActivation.length).to.eq(0);
         expect(methodAction.beforeActivation.length).to.eq(3);
      });
      it('respect AFTER', async () => {
         class TestActivator implements IConfigureActivation, IBeforeActivation, IAfterActivation {
            before(context: IContext): boolean | Promise<boolean> {
               throw new Error("Method not implemented.");
            }
            after(context: IContext): void | Promise<void> {
               throw new Error("Method not implemented.");
            }
            configure(activation: IActivation): KeepActivation {
               return KeepActivation.AFTER;
            }
         }
         class Test {
            @MethodAttr()
            public method1(){}
         }
         const activations: ActivationsGenerator = new ActivationsGenerator();
         let container: Container = new Container();
         activations.register(Test);
         activations.addActivations(TestActivator);
         const methodAction = getMethod(activations.generateActivations(container), 'method1');
         expect(methodAction.afterActivation.length).to.eq(1);
         expect(methodAction.beforeActivation.length).to.eq(2);
      });     
      it('respect BEFORE and AFTER', async () => {
         class TestActivator implements IConfigureActivation, IBeforeActivation, IAfterActivation {
            before(context: IContext): boolean | Promise<boolean> {
               throw new Error("Method not implemented.");
            }
            after(context: IContext): void | Promise<void> {
               throw new Error("Method not implemented.");
            }
            configure(activation: IActivation): KeepActivation {
               return KeepActivation.BEFORE | KeepActivation.AFTER;
            }
         }
         class Test {
            @MethodAttr()
            public method1(){}
         }
         const activations: ActivationsGenerator = new ActivationsGenerator();
         let container: Container = new Container();
         activations.register(Test);
         activations.addActivations(TestActivator);
         const methodAction = getMethod(activations.generateActivations(container), 'method1');
         expect(methodAction.afterActivation.length).to.eq(1);
         expect(methodAction.beforeActivation.length).to.eq(3);
      });             
   });
})