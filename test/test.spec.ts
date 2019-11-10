import { Context } from '../src/context/context';
import { Effect } from '../src/utils/types';
import { expect } from 'chai';
import { Procedure } from '../src/procedure/procedure';
import { toNewEffect } from '../src/utils/utils';

describe('Birbs API', () => {
  class TestProcedure extends Procedure {
    public testVariable = 'foo';
  };

  class TestContext extends Context {
    public testConstant = 'bar';
  }

  class TestEffect extends Effect {
    public execution(ev : TestProcedure) : void {
      console.log(ev);
    }
  }
  describe('builds', () => {
    it('Procedures', () => {
      const TestProcedureId = Symbol('test');
      const TestProcedureInstance = new TestProcedure()
        .withIdentifier(TestProcedureId)
        .withLifecycle('permanent');

      const builder = () : void => {
        TestProcedureInstance.build();
      };

      expect(builder).to.throw();

      TestProcedureInstance.withEffect(new TestEffect());

      expect(builder).to.not.throw();
      expect(TestProcedureInstance.effects.length).to.be.equal(1);
    });

    it('Contexts', () => {
      const procedureId = Symbol('Procedure');
      const TestProcedureInstance = new TestProcedure()
        .withIdentifier(procedureId)
        .withLifecycle('permanent')
        .withEffect(new TestEffect()).build();

      const contextId = Symbol('Context');

      const ContextInstance = new TestContext();

      const builder = () : void => {
        ContextInstance.build();
      };

      expect(builder).to.throw();

      ContextInstance.withIdentifier(contextId);

      expect(builder).to.throw();

      ContextInstance.withProcedures(TestProcedureInstance);

      expect(builder).to.throw();

      ContextInstance.withStrategy('no-flush');

      expect(builder).to.not.throw();
    });
  });

  it('Effect Maker', async (done) => {
    function logggyyyy (this : TestContext) : void {
      expect(this.testConstant).to.be.equal('bar');
      done();
    };

    const procedure = new TestProcedure()
      .build({
        effects: [toNewEffect(logggyyyy)],
        identifier: 'name',
        lifecycle: 'permanent'
      });

    const context = new TestContext()
      .build({
        identifier: 'context',
        strategy: 'no-flush'
      });

    context.sign(procedure);

    context.trigger(procedure);
  });
});
