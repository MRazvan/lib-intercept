import { expect } from "chai";
import { Container } from "inversify";
import { ClassData, MethodData, MethodDecoratorFactory } from "lib-reflect";
import { ActivationsGenerator, DefaultContext, IActivation, IAfterActivation, IBeforeActivation, IContext } from "../index";

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

class ResultInterceptor implements IAfterActivation {
   after(context: IContext): Promise<void> {
      const result = context.getResult();
      result.success = false;
      result.payload = [...result.payload, 'ResultInterceptor'];
      result.error = 'SomeError';
      return Promise.resolve();
   }
}

const MethodAttr = () => MethodDecoratorFactory(<T>(classData: ClassData, pk: MethodData, d: any) => { });
class TestClassTwoArgs {
   @MethodAttr()
   public method1(arg: any, arg2: any) {
      return [arg, arg2];
   }
}

describe('Activations should be able to intercept result', () => {
   it('Should change result', async () => {
      const activations: ActivationsGenerator = new ActivationsGenerator();
      let methodAction: IActivation = null;
      let container: Container = new Container();
      activations.addActivations(ArgsInterceptor_1);
      activations.addActivations(ArgsInterceptor_2);
      activations.addActivations(ResultInterceptor);
      activations.register(TestClassTwoArgs);
      methodAction = activations.generateActivations(container).find(a => a.method.name === 'method1');
      let context: DefaultContext = new DefaultContext(container, methodAction);
      await methodAction.execute(context);
      const result = context.getResult();
      expect(result.success).to.eq(false);
      expect(result.error).to.eq('SomeError');
      expect(result.payload).deep.eq(['Arg_0', 'Arg_1', 'ResultInterceptor'])
   });
})
