import {
  ArrayExoticObjectValue,
  ProxyExoticObjectValue,
  Type,
  Value,
  wellKnownSymbols,
} from '../value.mjs';
import {
  surroundingAgent,
} from '../engine.mjs';
import {
  Assert,
  CanonicalNumericIndexString,
  Get,
  ToBoolean,
  ToNumber,
  ToPrimitive,
  ValidateAndApplyPropertyDescriptor,
} from './all.mjs';
import { Q, X } from '../completion.mjs';
import { OutOfRange, msg } from '../helpers.mjs';

// 6.1.7 #integer-index
export function* isIntegerIndex(V) {
  if (Type(V) !== 'String') {
    return false;
  }
  const numeric = X(yield* CanonicalNumericIndexString(V));
  if (numeric === Value.undefined) {
    return false;
  }
  if (Object.is(numeric.numberValue(), +0)) {
    return true;
  }
  return numeric.numberValue() > 0 && Number.isSafeInteger(numeric.numberValue());
}

// 6.1.7 #array-index
export function* isArrayIndex(V) {
  if (Type(V) !== 'String') {
    return false;
  }
  const numeric = X(yield* CanonicalNumericIndexString(V));
  if (numeric === Value.undefined) {
    return false;
  }
  if (Object.is(numeric.numberValue(), +0)) {
    return true;
  }
  return numeric.numberValue() > 0 && numeric.numberValue() < (2 ** 32) - 1;
}

// 7.2.1 #sec-requireobjectcoercible
export function RequireObjectCoercible(argument) {
  const type = Type(argument);
  switch (type) {
    case 'Undefined':
      return surroundingAgent.Throw('TypeError', msg('CannotConvertToObject', 'undefined'));
    case 'Null':
      return surroundingAgent.Throw('TypeError', msg('CannotConvertToObject', 'null'));
    case 'Boolean':
    case 'Number':
    case 'String':
    case 'Symbol':
    case 'Object':
      return argument;
    default:
      throw new OutOfRange('RequireObjectCoercible', { type, argument });
  }
}

// 7.2.2 IsArray
export function IsArray(argument) {
  if (Type(argument) !== 'Object') {
    return Value.false;
  }
  if (argument instanceof ArrayExoticObjectValue) {
    return Value.true;
  }
  if (argument instanceof ProxyExoticObjectValue) {
    if (Type(argument.ProxyHandler) === 'Null') {
      return surroundingAgent.Throw('TypeError', msg('ProxyRevoked', 'IsArray'));
    }
    const target = argument.ProxyTarget;
    return IsArray(target);
  }
  return Value.false;
}

// 7.2.3 IsCallable
export function IsCallable(argument) {
  if (Type(argument) !== 'Object') {
    return Value.false;
  }
  if ('Call' in argument) {
    return Value.true;
  }
  return Value.false;
}

// 7.2.4 IsConstructor
export function IsConstructor(argument) {
  if (Type(argument) !== 'Object') {
    return Value.false;
  }
  if ('Construct' in argument) {
    return Value.true;
  }
  return Value.false;
}

// 7.2.5 IsExtensible
export function* IsExtensible(O) {
  Assert(Type(O) === 'Object');
  return O.IsExtensible();
}

// 7.2.6 #sec-isinteger
export function IsInteger(argument) {
  if (Type(argument) !== 'Number') {
    return Value.false;
  }
  if (argument.isNaN() || argument.isInfinity()) {
    return Value.false;
  }
  if (Math.floor(Math.abs(argument.numberValue())) !== Math.abs(argument.numberValue())) {
    return Value.false;
  }
  return Value.true;
}

// 7.2.7 IsPropertyKey
export function IsPropertyKey(argument) {
  if (Type(argument) === 'String') {
    return true;
  }
  if (Type(argument) === 'Symbol') {
    return true;
  }
  return false;
}

// 7.2.8 IsRegExp
export function* IsRegExp(argument) {
  if (Type(argument) !== 'Object') {
    return Value.false;
  }
  const matcher = Q(yield* Get(argument, wellKnownSymbols.match));
  if (matcher !== Value.undefined) {
    return ToBoolean(matcher);
  }
  if ('RegExpMatcher' in argument) {
    return Value.true;
  }
  return Value.false;
}

// 7.2.9 #sec-isstringprefix
export function IsStringPrefix(p, q) {
  Assert(Type(p) === 'String');
  Assert(Type(q) === 'String');
  return q.stringValue().startsWith(p.stringValue());
}

// 7.2.10 SameValue
export function SameValue(x, y) {
  if (Type(x) !== Type(y)) {
    return Value.false;
  }

  if (Type(x) === 'Number') {
    if (x.isNaN() && y.isNaN()) {
      return Value.true;
    }
    const xVal = x.numberValue();
    const yVal = y.numberValue();
    if (Object.is(xVal, 0) && Object.is(yVal, -0)) {
      return Value.false;
    }
    if (Object.is(xVal, -0) && Object.is(yVal, 0)) {
      return Value.false;
    }
    if (xVal === yVal) {
      return Value.true;
    }
    return Value.false;
  }

  return SameValueNonNumber(x, y);
}

// 7.2.11 #sec-samevaluezero
export function SameValueZero(x, y) {
  if (Type(x) !== Type(y)) {
    return Value.false;
  }
  if (Type(x) === 'Number') {
    if (x.isNaN() && y.isNaN()) {
      return Value.true;
    }
    const xVal = x.numberValue();
    const yVal = y.numberValue();
    if (Object.is(xVal, 0) && Object.is(yVal, -0)) {
      return Value.true;
    }
    if (Object.is(xVal, -0) && Object.is(yVal, 0)) {
      return Value.true;
    }
    if (xVal === yVal) {
      return Value.true;
    }
    return Value.false;
  }
  return SameValueNonNumber(x, y);
}

// 7.2.12 SameValueNonNumber
export function SameValueNonNumber(x, y) {
  Assert(Type(x) !== 'Number');
  Assert(Type(x) === Type(y));

  if (Type(x) === 'Undefined') {
    return Value.true;
  }

  if (Type(x) === 'Null') {
    return Value.true;
  }

  if (Type(x) === 'String') {
    if (x.stringValue() === y.stringValue()) {
      return Value.true;
    }
    return Value.false;
  }

  if (Type(x) === 'Boolean') {
    if (x === y) {
      return Value.true;
    }
    return Value.false;
  }

  if (Type(x) === 'Symbol') {
    return x === y ? Value.true : Value.false;
  }

  return x === y ? Value.true : Value.false;
}

// 7.2.13 #sec-abstract-relational-comparison
export function* AbstractRelationalComparison(x, y, LeftFirst = true) {
  let px;
  let py;
  if (LeftFirst === true) {
    px = Q(yield* ToPrimitive(x, 'Number'));
    py = Q(yield* ToPrimitive(y, 'Number'));
  } else {
    py = Q(yield* ToPrimitive(y, 'Number'));
    px = Q(yield* ToPrimitive(x, 'Number'));
  }
  if (Type(px) === 'String' && Type(py) === 'String') {
    if (yield* IsStringPrefix(py, px)) {
      return Value.false;
    }
    if (yield* IsStringPrefix(px, py)) {
      return Value.true;
    }
    let k = 0;
    while (true) {
      if (px.stringValue()[k] !== py.stringValue()[k]) {
        break;
      }
      k += 1;
    }
    const m = px.stringValue().charCodeAt(k);
    const n = py.stringValue().charCodeAt(k);
    if (m < n) {
      return Value.true;
    } else {
      return Value.false;
    }
  } else {
    const nx = Q(yield* ToNumber(px));
    const ny = Q(yield* ToNumber(py));
    if (nx.isNaN()) {
      return Value.undefined;
    }
    if (ny.isNaN()) {
      return Value.undefined;
    }
    // If nx and ny are the same Number value, return false.
    // If nx is +0 and ny is -0, return false.
    // If nx is -0 and ny is +0, return false.
    if (nx.numberValue() === ny.numberValue()) {
      return Value.false;
    }
    if (nx.numberValue() === +Infinity) {
      return Value.false;
    }
    if (ny.numberValue() === +Infinity) {
      return Value.true;
    }
    if (ny.numberValue() === -Infinity) {
      return Value.false;
    }
    if (nx.numberValue() === -Infinity) {
      return Value.true;
    }
    return nx.numberValue() < ny.numberValue() ? Value.true : Value.false;
  }
}

// 7.2.14 #sec-abstract-equality-comparison
export function* AbstractEqualityComparison(x, y) {
  if (Type(x) === Type(y)) {
    return yield* StrictEqualityComparison(x, y);
  }
  if (x === Value.null && y === Value.undefined) {
    return Value.true;
  }
  if (x === Value.undefined && y === Value.null) {
    return Value.true;
  }
  if (Type(x) === 'Number' && Type(y) === 'String') {
    return yield* AbstractEqualityComparison(x, X(yield* ToNumber(y)));
  }
  if (Type(x) === 'String' && Type(y) === 'Number') {
    return yield* AbstractEqualityComparison(X(yield* ToNumber(x)), y);
  }
  if (Type(x) === 'Boolean') {
    return yield* AbstractEqualityComparison(X(yield* ToNumber(x)), y);
  }
  if (Type(y) === 'Boolean') {
    return yield* AbstractEqualityComparison(x, X(yield* ToNumber(y)));
  }
  if (['String', 'Number', 'Symbol'].includes(Type(x)) && Type(y) === 'Object') {
    return yield* AbstractEqualityComparison(x, Q(yield* ToPrimitive(y)));
  }
  if (Type(x) === 'Object' && ['String', 'Number', 'Symbol'].includes(Type(y))) {
    return yield* AbstractEqualityComparison(Q(yield* ToPrimitive(x)), y);
  }
  return Value.false;
}

// 7.2.15 #sec-strict-equality-comparison
export function StrictEqualityComparison(x, y) {
  if (Type(x) !== Type(y)) {
    return Value.false;
  }
  if (Type(x) === 'Number') {
    if (x.isNaN()) {
      return Value.false;
    }
    if (y.isNaN()) {
      return Value.false;
    }
    const xVal = x.numberValue();
    const yVal = y.numberValue();
    if (xVal === yVal) {
      return Value.true;
    }
    if (Object.is(xVal, 0) && Object.is(yVal, -0)) {
      return Value.true;
    }
    if (Object.is(xVal, -0) && Object.is(yVal, 0)) {
      return Value.true;
    }
    return Value.false;
  }
  return SameValueNonNumber(x, y);
}

// 9.1.6.2 #sec-iscompatiblepropertydescriptor
export function IsCompatiblePropertyDescriptor(Extensible, Desc, Current) {
  return ValidateAndApplyPropertyDescriptor(Value.undefined, Value.undefined, Extensible, Desc, Current);
}

// 25.6.1.6 #sec-ispromise
export function IsPromise(x) {
  if (Type(x) !== 'Object') {
    return Value.false;
  }
  if (!('PromiseState' in x)) {
    return Value.false;
  }
  return Value.true;
}
