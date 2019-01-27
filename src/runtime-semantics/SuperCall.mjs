import { surroundingAgent } from '../engine.mjs';
import {
  Assert,
  Construct,
  GetNewTarget,
  GetThisEnvironment,
  IsConstructor,
} from '../abstract-ops/all.mjs';
import { FunctionValue, Type, Value } from '../value.mjs';
import { ArgumentListEvaluation } from './all.mjs';
import { Q, ReturnIfAbrupt, X } from '../completion.mjs';
import { FunctionEnvironmentRecord } from '../environment.mjs';
import { msg } from '../helpers.mjs';

// 12.3.5.2 #sec-getsuperconstructor
function* GetSuperConstructor() {
  const envRec = yield* GetThisEnvironment();
  Assert(envRec instanceof FunctionEnvironmentRecord);
  const activeFunction = envRec.FunctionObject;
  Assert(activeFunction instanceof FunctionValue);
  const superConstructor = X(activeFunction.GetPrototypeOf());
  if (IsConstructor(superConstructor) === Value.false) {
    return surroundingAgent.Throw('TypeError', msg('NotAConstructor', superConstructor));
  }
  return superConstructor;
}

// 12.3.5.1 #sec-super-keyword-runtime-semantics-evaluation
// SuperCall : `super` Arguments
export function* Evaluate_SuperCall({ arguments: Arguments }) {
  const newTarget = yield* GetNewTarget();
  Assert(Type(newTarget) === 'Object');
  const func = Q(GetSuperConstructor());
  const argList = yield* ArgumentListEvaluation(Arguments);
  ReturnIfAbrupt(argList);
  const result = Q(yield* Construct(func, argList, newTarget));
  const thisER = yield* GetThisEnvironment();
  return Q(thisER.BindThisValue(result));
}
