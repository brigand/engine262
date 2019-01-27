import {
  GetValue,
  ToInt32,
} from '../abstract-ops/all.mjs';
import { Value } from '../value.mjs';
import { Evaluate } from '../evaluator.mjs';
import { Q } from '../completion.mjs';
import { OutOfRange } from '../helpers.mjs';

/* eslint-disable no-bitwise */

export function* EvaluateBinopValues_BitwiseANDExpression(lval, rval) {
  const lnum = Q(yield* ToInt32(lval));
  const rnum = Q(yield* ToInt32(rval));
  return new Value(lnum.numberValue() & rnum.numberValue());
}

export function* EvaluateBinopValues_BitwiseXORExpression(lval, rval) {
  const lnum = Q(yield* ToInt32(lval));
  const rnum = Q(yield* ToInt32(rval));
  return new Value(lnum.numberValue() ^ rnum.numberValue());
}

export function* EvaluateBinopValues_BitwiseORExpression(lval, rval) {
  const lnum = Q(yield* ToInt32(lval));
  const rnum = Q(yield* ToInt32(rval));
  return new Value(lnum.numberValue() | rnum.numberValue());
}

// 12.12.3 #sec-binary-bitwise-operators-runtime-semantics-evaluation
export function* Evaluate_BinaryBitwiseExpression({ left: A, operator, right: B }) {
  const lref = yield* Evaluate(A);
  const lval = Q(yield* GetValue(lref));
  const rref = yield* Evaluate(B);
  const rval = Q(yield* GetValue(rref));

  // Return the result of applying the bitwise operator @ to lnum and rnum.
  switch (operator) {
    case '&':
      return yield* EvaluateBinopValues_BitwiseANDExpression(lval, rval);
    case '^':
      return yield* EvaluateBinopValues_BitwiseXORExpression(lval, rval);
    case '|':
      return yield* EvaluateBinopValues_BitwiseORExpression(lval, rval);

    default:
      throw new OutOfRange('Evaluate_BinaryBiwise', operator);
  }
}
