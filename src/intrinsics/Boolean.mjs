import {
  OrdinaryCreateFromConstructor,
  ToBoolean,
} from '../abstract-ops/all.mjs';
import { Type, Value } from '../value.mjs';
import { Q } from '../completion.mjs';
import { BootstrapConstructor } from './Bootstrap.mjs';

function* BooleanConstructor([value = Value.undefined], { NewTarget }) {
  const b = ToBoolean(value);
  if (Type(NewTarget) === 'Undefined') {
    return b;
  }
  const O = Q(yield* OrdinaryCreateFromConstructor(NewTarget, '%BooleanPrototype%', ['BooleanData']));
  O.BooleanData = b;
  return O;
}

export function CreateBoolean(realmRec) {
  const cons = BootstrapConstructor(
    realmRec, BooleanConstructor, 'Boolean', 1,
    realmRec.Intrinsics['%BooleanPrototype%'], [],
  );

  realmRec.Intrinsics['%Boolean%'] = cons;
}
