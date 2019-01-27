import { surroundingAgent } from '../engine.mjs';
import {
  Assert,
  CreateBuiltinFunction,
  CreateDataProperty,
  DefinePropertyOrThrow,
  ObjectCreate,
  SetFunctionLength,
  ToString,
} from './all.mjs';
import {
  ArgumentsExoticObjectValue,
  Descriptor,
  Value,
  wellKnownSymbols,
} from '../value.mjs';
import { BoundNames_FormalParameters } from '../static-semantics/all.mjs';
import { X } from '../completion.mjs';

// This file covers abstract operations defined in
// 9.4.4 #sec-arguments-exotic-objects

// 9.4.4.6 #sec-createunmappedargumentsobject
export function* CreateUnmappedArgumentsObject(argumentsList) {
  const len = argumentsList.length;
  const obj = ObjectCreate(surroundingAgent.intrinsic('%ObjectPrototype%'), ['ParameterMap']);
  obj.ParameterMap = Value.undefined;
  yield* DefinePropertyOrThrow(obj, new Value('length'), Descriptor({
    Value: new Value(len),
    Writable: Value.true,
    Enumerable: Value.false,
    Configurable: Value.true,
  }));
  let index = 0;
  while (index < len) {
    const val = argumentsList[index];
    const idxStr = X(yield* ToString(new Value(index)));
    X(yield* CreateDataProperty(obj, idxStr, val));
    index += 1;
  }
  X(yield* DefinePropertyOrThrow(obj, wellKnownSymbols.iterator, Descriptor({
    Value: surroundingAgent.intrinsic('%ArrayProto_values%'),
    Writable: Value.true,
    Enumerable: Value.false,
    Configurable: Value.true,
  })));
  X(yield* DefinePropertyOrThrow(obj, new Value('callee'), Descriptor({
    Get: surroundingAgent.intrinsic('%ThrowTypeError%'),
    Set: surroundingAgent.intrinsic('%ThrowTypeError%'),
    Enumerable: Value.false,
    Configurable: Value.false,
  })));
  return obj;
}

function* ArgGetterSteps() {
  const f = this;
  const name = f.Name;
  const env = f.Env;
  return yield* env.GetBindingValue(name, Value.false);
}

// 9.4.4.7.1 #sec-makearggetter
function MakeArgGetter(name, env) {
  const steps = ArgGetterSteps;
  const getter = CreateBuiltinFunction(steps, ['Name', 'Env']);
  getter.Name = name;
  getter.Env = env;
  return getter;
}

function* ArgSetterSteps([value]) {
  Assert(value !== undefined);
  const f = this;
  const name = f.Name;
  const env = f.Env;
  return yield* env.SetMutableBinding(name, value, Value.false);
}

// 9.4.4.7.2 #sec-makeargsetter
function* MakeArgSetter(name, env) {
  const steps = ArgSetterSteps;
  const setter = CreateBuiltinFunction(steps, ['Name', 'Env']);
  yield* SetFunctionLength(setter, new Value(1));
  setter.Name = name;
  setter.Env = env;
  return setter;
}

// 9.4.4.7 #sec-createmappedargumentsobject
export function* CreateMappedArgumentsObject(func, formals, argumentsList, env) {
  // Assert: formals does not contain a rest parameter, any binding
  // patterns, or any initializers. It may contain duplicate identifiers.
  const len = argumentsList.length;
  const obj = new ArgumentsExoticObjectValue();
  obj.Prototype = surroundingAgent.intrinsic('%ObjectPrototype%');
  obj.Extensible = Value.true;
  const map = ObjectCreate(Value.null);
  obj.ParameterMap = map;
  const parameterNames = BoundNames_FormalParameters(formals).map(Value);
  const numberOfParameters = parameterNames.length;
  let index = 0;
  while (index < len) {
    const val = argumentsList[index];
    const idxStr = X(yield* ToString(new Value(index)));
    X(yield* CreateDataProperty(obj, idxStr, val));
    index += 1;
  }
  X(yield* DefinePropertyOrThrow(obj, new Value('length'), Descriptor({
    Value: new Value(len),
    Writable: Value.true,
    Enumerable: Value.false,
    Configurable: Value.true,
  })));
  const mappedNames = [];
  index = numberOfParameters - 1;
  while (index >= 0) {
    const name = parameterNames[index];
    if (!mappedNames.includes(name)) {
      mappedNames.push(name);
      if (index < len) {
        const g = MakeArgGetter(name, env);
        const p = MakeArgSetter(name, env);
        X(yield* map.DefineOwnProperty(X(yield* ToString(new Value(index))), Descriptor({
          Set: p,
          Get: g,
          Enumerable: Value.false,
          Configurable: Value.true,
        })));
      }
    }
    index -= 1;
  }
  X(yield* DefinePropertyOrThrow(obj, wellKnownSymbols.iterator, Descriptor({
    Value: surroundingAgent.intrinsic('%ArrayProto_values%'),
    Writable: Value.true,
    Enumerable: Value.false,
    Configurable: Value.true,
  })));
  X(yield* DefinePropertyOrThrow(obj, new Value('callee'), Descriptor({
    Value: func,
    Writable: Value.true,
    Enumerable: Value.false,
    Configurable: Value.true,
  })));
  return obj;
}
