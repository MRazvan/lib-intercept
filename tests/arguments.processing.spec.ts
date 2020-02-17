import { expect } from "chai";
import { Container } from "inversify";
import { ClassData, MethodData, MethodDecoratorFactory } from "lib-reflect";
import { ActivationsGenerator, DefaultContext, IActivation, IBeforeActivation, IContext } from "../index";

import _ = require("lodash");


class ArgsInterceptor_1 implements IBeforeActivation {
   before(context: IContext): Promise<boolean> {
      context.getArguments()[0] = 'Arg_0';
      return Promise.resolve(true);
   }
}

class ArgsInterceptor_2 implements IBeforeActivation {
   before(context: IContext): Promise<boolean> {
      context.getArguments()[1] = 'Arg_1';
      return Promise.resolve(true);
   }
}

const MethodAttr = () => MethodDecoratorFactory((classData: ClassData, pk: MethodData, d: any) => { });
class TestClass {
   @MethodAttr()
   public method1(arg: any) {
      return arg;
   }
}

class TestClassTwoArgs {
   @MethodAttr()
   public method1(arg: any, arg2: any) {
      return [arg, arg2];
   }
}

describe('Activations should be able to populate argumets', () => {
   it('Should populate one argument', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      activations.addActivations(ArgsInterceptor_1);
      activations.register(TestClass);
      methodAction = activations.generateActivations(container).find(a => a.method.name === 'method1');
      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      expect(context.payload).to.be.eq('Arg_0');
   });

   it('Should populate two arguments', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      activations.addActivations(ArgsInterceptor_1);
      activations.addActivations(ArgsInterceptor_2);
      activations.register(TestClassTwoArgs);
      methodAction = activations.generateActivations(container).find(a => a.method.name === 'method1');
      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      expect(context.payload).to.deep.eq(['Arg_0', 'Arg_1']);
   });
})