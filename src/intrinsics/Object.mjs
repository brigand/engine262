import {
  Type,
  Value,
} from '../value.mjs';
import {
  surroundingAgent,
} from '../engine.mjs';
import {
  CreateArrayFromList,
  CreateDataProperty,
  DefinePropertyOrThrow,
  EnumerableOwnPropertyNames,
  FromPropertyDescriptor,
  Get,
  IsExtensible,
  ObjectCreate,
  OrdinaryCreateFromConstructor,
  RequireObjectCoercible,
  SameValue,
  Set,
  SetIntegrityLevel,
  TestIntegrityLevel,
  ToObject,
  ToPropertyDescriptor,
  ToPropertyKey,
} from '../abstract-ops/all.mjs';
import { Q, X } from '../completion.mjs';
import { BootstrapConstructor } from './Bootstrap.mjs';
import { msg } from '../helpers.mjs';

function* ObjectConstructor([value], { NewTarget }) {
  if (NewTarget !== Value.undefined && NewTarget !== surroundingAgent.activeFunctionObject) {
    return yield* OrdinaryCreateFromConstructor(NewTarget, '%ObjectPrototype%');
  }
  if (value === Value.null || value === Value.undefined || value === undefined) {
    return ObjectCreate(surroundingAgent.currentRealmRecord.Intrinsics['%ObjectPrototype%']);
  }
  return X(yield* ToObject(value));
}

function* Object_assign([target = Value.undefined, ...sources]) {
  const to = Q(yield* ToObject(target));
  if (sources.length === 0) {
    return to;
  }
  // Let sources be the List of argument values starting with the second argument.
  for (const nextSource of sources) {
    if (Type(nextSource) !== 'Undefined' && Type(nextSource) !== 'Null') {
      const from = X(yield* ToObject(nextSource));
      const keys = Q(yield* from.OwnPropertyKeys());
      for (const nextKey of keys) {
        const desc = Q(yield* from.GetOwnProperty(nextKey));
        if (Type(desc) !== 'Undefined' && desc.Enumerable === Value.true) {
          const propValue = Q(yield* Get(from, nextKey));
          Q(yield* Set(to, nextKey, propValue, Value.true));
        }
      }
    }
  }
  return to;
}

function* Object_create([O = Value.undefined, Properties = Value.undefined]) {
  if (Type(O) !== 'Object' && Type(O) !== 'Null') {
    return surroundingAgent.Throw('TypeError', 'Object prototype may only be an Object or null');
  }
  const obj = ObjectCreate(O);
  if (Properties !== Value.undefined) {
    return Q(yield* ObjectDefineProperties(obj, Properties));
  }
  return obj;
}

function* Object_defineProperties([O = Value.undefined, Properties = Value.undefined]) {
  return Q(yield* ObjectDefineProperties(O, Properties));
}

// #sec-objectdefineproperties ObjectDefineProperties
function* ObjectDefineProperties(O, Properties) {
  if (Type(O) !== 'Object') {
    return surroundingAgent.Throw('TypeError', msg('NotAnObject', O));
  }
  const props = Q(yield* ToObject(Properties));
  const keys = Q(yield* props.OwnPropertyKeys());
  const descriptors = [];
  for (const nextKey of keys) {
    const propDesc = Q(yield* props.GetOwnProperty(nextKey));
    if (propDesc !== Value.undefined && propDesc.Enumerable === Value.true) {
      const descObj = Q(yield* Get(props, nextKey));
      const desc = Q(yield* ToPropertyDescriptor(descObj));
      descriptors.push([nextKey, desc]);
    }
  }
  for (const pair of descriptors) {
    const P = pair[0];
    const desc = pair[1];
    Q(yield* DefinePropertyOrThrow(O, P, desc));
  }
  return O;
}

function* Object_defineProperty([O = Value.undefined, P = Value.undefined, Attributes = Value.undefined]) {
  if (Type(O) !== 'Object') {
    return surroundingAgent.Throw('TypeError', 'Value is not an object');
  }
  const key = Q(yield* ToPropertyKey(P));
  const desc = Q(yield* ToPropertyDescriptor(Attributes));

  Q(yield* DefinePropertyOrThrow(O, key, desc));
  return O;
}

function* Object_entries([O = Value.undefined]) {
  const obj = Q(yield* ToObject(O));
  const nameList = Q(yield* EnumerableOwnPropertyNames(obj, 'key+value'));
  return yield* CreateArrayFromList(nameList);
}

function* Object_freeze([O = Value.undefined]) {
  if (Type(O) !== 'Object') {
    return O;
  }

  const status = Q(yield* SetIntegrityLevel(O, 'frozen'));
  if (status === Value.false) {
    return surroundingAgent.Throw('TypeError', 'Could not freeze object');
  }
  return O;
}

function* Object_getOwnPropertyDescriptor([O = Value.undefined, P = Value.undefined]) {
  const obj = Q(yield* ToObject(O));
  const key = Q(yield* ToPropertyKey(P));
  const desc = Q(yield* obj.GetOwnProperty(key));
  return yield* FromPropertyDescriptor(desc);
}

function* Object_getOwnPropertyDescriptors([O = Value.undefined]) {
  const obj = Q(yield* ToObject(O));
  const ownKeys = Q(yield* obj.OwnPropertyKeys());
  const descriptors = X(ObjectCreate(surroundingAgent.intrinsic('%ObjectPrototype%')));
  for (const key of ownKeys) {
    const desc = Q(yield* obj.GetOwnProperty(key));
    const descriptor = X(yield* FromPropertyDescriptor(desc));
    if (descriptor !== Value.undefined) {
      X(yield* CreateDataProperty(descriptors, key, descriptor));
    }
  }
  return descriptors;
}

function* GetOwnPropertyKeys(O, type) {
  const obj = Q(yield* ToObject(O));
  const keys = Q(yield* obj.OwnPropertyKeys());
  const nameList = [];
  keys.forEach((nextKey) => {
    if (Type(nextKey) === type) {
      nameList.push(nextKey);
    }
  });
  return yield* CreateArrayFromList(nameList);
}

function* Object_getOwnPropertyNames([O = Value.undefined]) {
  return Q(yield* GetOwnPropertyKeys(O, 'String'));
}

function* Object_getOwnPropertySymbols([O = Value.undefined]) {
  return Q(yield* GetOwnPropertyKeys(O, 'Symbol'));
}

function* Object_getPrototypeOf([O = Value.undefined]) {
  const obj = Q(yield* ToObject(O));
  return Q(yield* obj.GetPrototypeOf());
}

function* Object_is([value1 = Value.undefined, value2 = Value.undefined]) {
  return SameValue(value1, value2);
}

function* Object_isExtensible([O = Value.undefined]) {
  if (Type(O) !== 'Object') {
    return Value.false;
  }

  return Q(yield* IsExtensible(O));
}

function* Object_isFrozen([O = Value.undefined]) {
  if (Type(O) !== 'Object') {
    return Value.true;
  }

  return Q(yield* TestIntegrityLevel(O, 'frozen'));
}

function* Object_isSealed([O = Value.undefined]) {
  if (Type(O) !== 'Object') {
    return Value.true;
  }

  return Q(yield* TestIntegrityLevel(O, 'sealed'));
}

function* Object_keys([O = Value.undefined]) {
  const obj = Q(yield* ToObject(O));
  const nameList = Q(yield* EnumerableOwnPropertyNames(obj, 'key'));
  return yield* CreateArrayFromList(nameList);
}

function* Object_preventExtensions([O = Value.undefined]) {
  if (Type(O) !== 'Object') {
    return O;
  }

  const status = Q(yield* O.PreventExtensions());
  if (status === Value.false) {
    return surroundingAgent.Throw('TypeError', 'Could not prevent extensions on object');
  }
  return O;
}

function* Object_seal([O = Value.undefined]) {
  if (Type(O) !== 'Object') {
    return O;
  }

  const status = Q(yield* SetIntegrityLevel(O, 'sealed'));
  if (status === Value.false) {
    return surroundingAgent.Throw('TypeError', 'Could not seal object');
  }
  return O;
}

function* Object_setPrototypeOf([O = Value.undefined, proto = Value.undefined]) {
  O = Q(RequireObjectCoercible(O));
  if (Type(proto) !== 'Object' && Type(proto) !== 'Null') {
    return surroundingAgent.Throw('TypeError', 'Prototype must be an Object or null');
  }
  if (Type(O) !== 'Object') {
    return O;
  }

  const status = Q(yield* O.SetPrototypeOf(proto));
  if (status === Value.false) {
    return surroundingAgent.Throw('TypeError', 'Could not set prototype of object');
  }
  return O;
}

function* Object_values([O = Value.undefined]) {
  const obj = Q(yield* ToObject(O));
  const nameList = Q(yield* EnumerableOwnPropertyNames(obj, 'value'));
  return yield* CreateArrayFromList(nameList);
}

export function CreateObject(realmRec) {
  const objectConstructor = BootstrapConstructor(realmRec, ObjectConstructor, 'Object', 1, realmRec.Intrinsics['%ObjectPrototype%'], [
    ['assign', Object_assign, 2],
    ['create', Object_create, 2],
    ['defineProperties', Object_defineProperties, 2],
    ['defineProperty', Object_defineProperty, 3],
    ['entries', Object_entries, 1],
    ['freeze', Object_freeze, 1],
    ['getOwnPropertyDescriptor', Object_getOwnPropertyDescriptor, 2],
    ['getOwnPropertyDescriptors', Object_getOwnPropertyDescriptors, 1],
    ['getOwnPropertyNames', Object_getOwnPropertyNames, 1],
    ['getOwnPropertySymbols', Object_getOwnPropertySymbols, 1],
    ['getPrototypeOf', Object_getPrototypeOf, 1],
    ['is', Object_is, 2],
    ['isExtensible', Object_isExtensible, 1],
    ['isFrozen', Object_isFrozen, 1],
    ['isSealed', Object_isSealed, 1],
    ['keys', Object_keys, 1],
    ['preventExtensions', Object_preventExtensions, 1],
    ['seal', Object_seal, 1],
    ['setPrototypeOf', Object_setPrototypeOf, 2],
    ['values', Object_values, 1],
  ]);

  realmRec.Intrinsics['%Object%'] = objectConstructor;
}
