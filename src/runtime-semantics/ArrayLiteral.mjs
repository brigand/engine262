import {
  ArrayCreate,
  Assert,
  CreateDataProperty,
  GetIterator,
  GetValue,
  IteratorStep,
  IteratorValue,
  Set,
  ToString,
  ToUint32,
} from '../abstract-ops/all.mjs';
import {
  isExpression,
  isSpreadElement,
} from '../ast.mjs';
import { Value } from '../value.mjs';
import { Q, ReturnIfAbrupt, X } from '../completion.mjs';
import { Evaluate } from '../evaluator.mjs';
import { OutOfRange } from '../helpers.mjs';

function* ArrayAccumulation_SpreadElement(SpreadElement, array, nextIndex) {
  const spreadRef = yield* Evaluate(SpreadElement.argument);
  const spreadObj = Q(yield* GetValue(spreadRef));
  const iteratorRecord = Q(yield* GetIterator(spreadObj));
  while (true) {
    const next = Q(yield* IteratorStep(iteratorRecord));
    if (next === Value.false) {
      return nextIndex;
    }
    const nextValue = Q(yield* IteratorValue(next));
    const idxNum = X(yield* ToUint32(new Value(nextIndex)));
    const idxStr = X(yield* ToString(idxNum));
    const status = X(yield* CreateDataProperty(array, idxStr, nextValue));
    Assert(status === Value.true);
    nextIndex += 1;
  }
}

function* ArrayAccumulation_AssignmentExpression(AssignmentExpression, array, nextIndex) {
  const initResult = yield* Evaluate(AssignmentExpression);
  const initValue = Q(yield* GetValue(initResult));
  const idxNum = X(yield* ToUint32(new Value(nextIndex)));
  const idxStr = X(yield* ToString(idxNum));
  const created = X(yield* CreateDataProperty(array, idxStr, initValue));
  Assert(created === Value.true);
  return nextIndex + 1;
}

function* ArrayAccumulation(ElementList, array, nextIndex) {
  let postIndex = nextIndex;
  for (const element of ElementList) {
    switch (true) {
      case !element:
        // Elision
        postIndex += 1;
        break;

      case isExpression(element):
        postIndex = yield* ArrayAccumulation_AssignmentExpression(element, array, postIndex);
        ReturnIfAbrupt(postIndex);
        break;

      case isSpreadElement(element):
        postIndex = yield* ArrayAccumulation_SpreadElement(element, array, postIndex);
        ReturnIfAbrupt(postIndex);
        break;

      default:
        throw new OutOfRange('ArrayAccumulation', element);
    }
  }
  return postIndex;
}

// 12.2.5.3 #sec-array-initializer-runtime-semantics-evaluation
// ArrayLiteral :
//   `[` Elision `]`
//   `[` ElementList `]`
//   `[` ElementList `,` Elision `]`
export function* Evaluate_ArrayLiteral(ArrayLiteral) {
  const array = X(yield* ArrayCreate(new Value(0)));
  const len = yield* ArrayAccumulation(ArrayLiteral.elements, array, 0);
  ReturnIfAbrupt(len);
  X(yield* Set(array, new Value('length'), yield* ToUint32(new Value(len)), Value.false));
  // NOTE: The above Set cannot fail because of the nature of the object returned by ArrayCreate.
  return array;
}
