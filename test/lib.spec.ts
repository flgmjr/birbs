import { describe, it } from 'mocha';
import { Context } from '../src/context';
import { EventManager } from '../src/manager';
import { expect } from 'chai';
import { Pipeline } from '../src/pipeline';
import { Procedure } from '../src/procedure';

describe('[ BIRBS API ]', () => {
  it('Context fires events successfully', () => {
    class TestContext extends Context {
      public text = 'text ';
    }

    class TestProcedure extends Procedure {
      private counter = 1;

      public async execute (context : TestContext, descriptable ?: number ) : Promise<void> {
        context.text = context.text + this.counter;

        this.counter += descriptable || 1;
      };
    }

    const procedureCreated = new TestProcedure({lifetime: 'DURABLE' });

    const contextId = 'Context';
    const contextCreated = new TestContext(contextId);
    const manager = new EventManager();

    manager.addContext(contextCreated).addProcedure(procedureCreated, contextId);

    manager.broadcast('TestProcedure', contextId, 8);
    expect(contextCreated.text).to.be.equal('text 1');

    manager.broadcast('TestProcedure');
    expect(contextCreated.text).to.be.equal('text 19');

  });

  it('Pipelines executes in order', (done) => {
    class NumberContext extends Context {
      public currentCounter = 10;
    }

    class AddToCounter extends Procedure {
      async execute(context : NumberContext) : Promise<void> {
        context.currentCounter += 8;
      }
    }

    class DivideCounter extends Procedure {
      async execute(context : NumberContext) : Promise<void> {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 500);
          context.currentCounter = context.currentCounter / 2 ;
        });
      }
    }

    class MicroAddToCounter extends Procedure {
      async execute(context : NumberContext) : Promise<void> {
        context.currentCounter += 0.000888;
      }
    }
    const addProcedure = new AddToCounter({ lifetime: 'SINGLE' });
    const divideProcedure = new DivideCounter({ lifetime: 'SINGLE' });
    const microAddProcedure = new MicroAddToCounter({ lifetime: 'SINGLE' });

    class MutationPipeline extends Pipeline {};

    const pipeline = new MutationPipeline({ lifetime: 'SINGLE' }, (context : NumberContext) => {
      expect(context.currentCounter).to.be.equal(9.000888);
      done();
    }).addStep(addProcedure)
      .addStep(divideProcedure)
      .addStep(microAddProcedure);

    const numberContext = new NumberContext('aa').sign(pipeline);

    numberContext.trigger('AddToCounter');
    expect(numberContext.currentCounter).to.be.equal(10);

    numberContext.trigger('DivideCounter');
    expect(numberContext.currentCounter).to.be.equal(10);

    numberContext.trigger('MutationPipeline');
  });

  it('Birbables with SINGLE lifetime gets removed from the context', () => {
    class TestContext extends Context {
      public text = 'i am a test text texst';
    }

    class Helloizer extends Procedure {
      async execute (context : TestContext) : Promise<void> {
        context.text = `Hello! ${context.text}`;
      }
    }

    const helloizer = new Helloizer({ lifetime: 'SINGLE'});
    const context = new TestContext('aa').sign(helloizer);

    context.trigger('Helloizer');
    expect(context.text).to.be.equal('Hello! i am a test text texst');

    context.trigger('Helloizer');
    expect(context.text).to.be.equal('Hello! i am a test text texst');
  });

  it('Birbables with DURABLE lifetime does not get removed from the context', () => {
    class TestContext extends Context {
      public text = 'i am a test text texst';
    }

    class Helloizer extends Procedure {
      async execute (context : TestContext) : Promise<void> {
        context.text = `Hello! ${context.text}`;
      }
    }

    const helloizer = new Helloizer({ lifetime: 'DURABLE'});
    const context = new TestContext('aa').sign(helloizer);

    context.trigger('Helloizer');
    expect(context.text).to.be.equal('Hello! i am a test text texst');

    context.trigger('Helloizer');
    expect(context.text).to.be.equal('Hello! Hello! i am a test text texst');
  });

  it('Birbable Group discards all and executes a single procedure', () => {
    class TestContext extends Context {
      public text = 'i am a test text texst';
    }

    class Helloizer extends Procedure {
      async execute (context : TestContext) : Promise<void> {
        context.text = `Hello! ${context.text}`;
      }
    }

    class Goodbyzer extends Procedure {
      async execute (context : TestContext) : Promise<void> {
        context.text = `Goodbye! ${context.text}`;
      }
    }

    class Mehizer extends Procedure {
      async execute (context : TestContext) : Promise<void> {
        context.text = `Meh! ${context.text}`;
      }
    }

    const groupToken = Symbol('Group');

    const helloizer = new Helloizer({ group: groupToken, lifetime: 'DURABLE' });
    const goodbyzer = new Goodbyzer({ group: groupToken, lifetime: 'DURABLE'});
    const mehizer = new Mehizer({ group: groupToken, lifetime: 'DURABLE'});

    const context = new TestContext('aa');
    context.sign(helloizer).sign(goodbyzer).sign(mehizer);

    // context[helloizer.identifier];
    context.trigger('Helloizer');
    expect(context.text).to.be.equal('Hello! i am a test text texst');

    context.trigger('Goodbyzer');
    context.trigger('Helloizer');
    context.trigger('Mehizer');
    expect(context.text).to.be.equal('Hello! i am a test text texst');
  });
});
