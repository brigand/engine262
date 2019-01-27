import {
  Descriptor,
  SymbolValue,
  Type,
  Value,
  wellKnownSymbols,
} from '../value.mjs';
import {
  surroundingAgent,
} from '../engine.mjs';
import {
  SameValue,
  ToString,
} from '../abstract-ops/all.mjs';
import { Q } from '../completion.mjs';
import { BootstrapConstructor } from './Bootstrap.mjs';

export const GlobalSymbolRegistry = [];

function* SymbolConstructor([description = Value.undefined], { NewTarget }) {
  if (Type(NewTarget) !== 'Undefined') {
    return surroundingAgent.Throw('TypeError');
  }
  let descString;
  if (description === Value.undefined) {
    descString = Value.undefined;
  } else {
    descString = Q(yield* ToString(description));
  }
  return new SymbolValue(descString);
}

function* Symbol_for([key = Value.undefined]) {
  const stringKey = Q(yield* ToString(key));
  for (const e of GlobalSymbolRegistry) {
    if (SameValue(e.Key, stringKey) === Value.true) {
      return e.Symbol;
    }
  }
  // Assert: GlobalSymbolRegistry does not currently contain an entry for stringKey.
  const newSymbol = new SymbolValue(stringKey);
  GlobalSymbolRegistry.push({ Key: stringKey, Symbol: newSymbol });
  return newSymbol;
}

function* Symbol_keyFor([sym = Value.undefined]) {
  if (Type(sym) !== 'Symbol') {
    return surroundingAgent.Throw('TypeError');
  }
  for (const e of GlobalSymbolRegistry) {
    if (SameValue(e.Symbol, sym) === Value.true) {
      return e.Key;
    }
  }
  return Value.undefined;
}

export function CreateSymbol(realmRec) {
  const symbolConstructor = BootstrapConstructor(realmRec, SymbolConstructor, 'Symbol', 0, realmRec.Intrinsics['%SymbolPrototype%'], [
    ['for', Symbol_for, 1],
    ['keyFor', Symbol_keyFor, 1],
  ]);

  for (const [name, sym] of Object.entries(wellKnownSymbols)) {
    symbolConstructor.properties.set(new Value(name), Descriptor({
      Value: sym,
      Writable: Value.false,
      Enumerable: Value.false,
      Configurable: Value.false,
    }));
  }

  realmRec.Intrinsics['%Symbol%'] = symbolConstructor;
}
