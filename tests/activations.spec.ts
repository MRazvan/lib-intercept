import { expect } from "chai";
import { Container } from "inversify";
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
      const result = context.getResult();
      expect(result.success).to.be.false;
      expect(result.error).to.eq('Hello World');
   });

   it('Should set the result success as false and error message when handler throws exception', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();

      activations.register(ThrowOnCall);
      methodAction = activations.generateActivations(container)[1];

      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);

      const result = context.getResult();
      expect(result.success).to.be.false;
      expect(result.error).to.eq('Hello World');
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

      const result = context.getResult();
      expect(result.success).to.be.true;
      expect(result.payload).to.eq('Hello World');
   });   
})