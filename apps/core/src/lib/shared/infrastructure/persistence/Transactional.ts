import { runInNewTransaction } from './TransactionContext';

export function Transactional<This, Args extends unknown[], Return>(
  originalMethod: (this: This, ...args: Args) => Promise<Return>,
  _context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
): (this: This, ...args: Args) => Promise<Return> {
  return async function transactionalWrapper(this: This, ...args: Args): Promise<Return> {
    return runInNewTransaction(() => originalMethod.call(this, ...args));
  };
}
