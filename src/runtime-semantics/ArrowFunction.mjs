import {
  surroundingAgent,
} from '../engine.mjs';
// import { CoveredFormalsList } from '../static-semantics/all.mjs';
import { FunctionCreate, sourceTextMatchedBy } from '../abstract-ops/all.mjs';

export function* Evaluate_ArrowFunction(ArrowFunction) {
  const { params: ArrowParameters, strict } = ArrowFunction;
  const scope = surroundingAgent.runningExecutionContext.LexicalEnvironment;
  const parameters = ArrowParameters;
  const closure = yield* FunctionCreate('Arrow', parameters, ArrowFunction, scope, strict);
  closure.SourceText = sourceTextMatchedBy(ArrowFunction);
  return closure;
}
