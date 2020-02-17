import { expect } from "chai";
import { Container, injectable } from "inversify";
import { ClassData, MethodData, MethodDecoratorFactory, ReflectHelper } from "lib-reflect";
import { ActivationsGenerator, IActivation, IBeforeActivation, IContext, UseActivation } from "../index";
import { DefaultContext } from "../src/context";


import _ = require("lodash");
class ErrorInterceptor implements IBeforeActivation {
   before(context: IContext): Promise<boolean> {
      throw "Hello World";
   }
}

const MethodAttr = () => MethodDecoratorFactory((classData: ClassData, m: MethodData, d: any) => { });

class TestClass {
   @MethodAttr()
   public method1() { }
}

@UseActivation(ErrorInterceptor)
class TestErrorClass {
   @MethodAttr()
   public method1() { }
}

class NoReflection { }


class ThrowOnCall {
   @MethodAttr()
   public method() {
      throw 'Hello World';
   }
}

describe('ActivationsGenerator', () => {

   it('Should throw on duplicate class registration', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      activations.register(TestClass);
      expect(() => activations.register(TestClass)).to.throw;
   });

   it('Should throw on class not having reflection data', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      expect(() => activations.register(NoReflection)).to.throw;
   });

   it('Should set the result success as false and error message when interceptor throws exception', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      activations.register(TestErrorClass);
      methodAction = _.head(activations.generateActivations(container));
      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      expect(context.isSuccess()).to.be.false;
      expect(context.error).to.eq('Hello World');
   });

   it('Should set the result success as false and error message when handler throws exception', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();

      activations.register(ThrowOnCall);
      methodAction = activations.generateActivations(container)[1];

      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);

      expect(context.isSuccess()).to.be.false;
      expect(context.error).to.eq('Hello World');
   });

   it('Should await promise on instance methods', async () => {

      class Test {
         public myMethod(): Promise<string>{
            return Promise.resolve('Hello World');
         }
      }
      ReflectHelper.getOrCreateClassData(Test).build();
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();

      activations.register(Test);
      methodAction = activations.generateActivations(container)[1];

      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);

      expect(context.isSuccess()).to.be.true;
      expect(context.payload).to.eq('Hello World');
   });    

   it('Should call static methods', async () => {
      class Test {
         public static myMethod(): string{
            return 'Hello World';
         }
      }
      ReflectHelper.getOrCreateClassData(Test).build();
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();

      activations.register(Test);
      methodAction = activations.generateActivations(container)[1];

      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);

      expect(context.isSuccess()).to.be.true;
      expect(context.payload).to.eq('Hello World');
   });   

   it('Should await promise on  static methods', async () => {
      class Test {
         public static myMethod(): Promise<string>{
            return Promise.resolve('Hello World');
         }
      }
      ReflectHelper.getOrCreateClassData(Test).build();
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();

      activations.register(Test);
      methodAction = activations.generateActivations(container)[1];

      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);

      expect(context.isSuccess()).to.be.true;
      expect(context.payload).to.eq('Hello World');
   });   

   it('Should inject types found on container', async () => {
      @injectable()
      class Service {
         public getData(): string {
            return 'Hello World';
         }
      }
      class Test {
         @MethodAttr()
         public static myMethod(service: Service): string{
            return service.getData();
         }
      }
      ReflectHelper.getOrCreateClassData(Test).build();
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      container.bind(Service).toSelf();
      activations.register(Test);
      methodAction = activations.generateActivations(container)[1];

      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      console.log(context);
      expect(context.isSuccess()).to.be.true;
      expect(context.payload).to.eq('Hello World');
   });     
})