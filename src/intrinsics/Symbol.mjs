import {
  New as NewValue,
  SymbolValue,
  Type,
  wellKnownSymbols,
} from '../value.mjs';
import {
  surroundingAgent,
} from '../engine.mjs';
import {
  CreateBuiltinFunction,
  SameValue,
  SetFunctionLength,
  SetFunctionName,
  ToString,
} from '../abstract-ops/all.mjs';
import { Q } from '../completion.mjs';

export const GlobalSymbolRegistry = [];

function SymbolConstructor([description], { NewTarget }) {
  if (Type(NewTarget) !== 'Undefined') {
    return surroundingAgent.Throw('TypeError');
  }
  const descString = description === undefined || Type(description) === 'Undefined'
    ? NewValue(undefined)
    : Q(ToString(description));

  return new SymbolValue(descString);
}

function Symbol_for([key]) {
  const stringKey = Q(ToString(key));
  for (const e of GlobalSymbolRegistry) {
    if (SameValue(e.Key, stringKey)) {
      return e.Symbol;
    }
  }
  // Assert: GlobalSymbolRegistry does not currently contain an entry for stringKey.
  const newSymbol = new SymbolValue(stringKey);
  GlobalSymbolRegistry.push({ Key: stringKey, Symbol: newSymbol });
  return newSymbol;
}

function Symbol_keyFor([sym]) {
  if (Type(sym) !== 'Symbol') {
    return surroundingAgent.Throw('TypeError');
  }
  for (const e of GlobalSymbolRegistry) {
    if (SameValue(e.Symbol, sym)) {
      return e.Key;
    }
  }
  return NewValue(undefined);
}

export function CreateSymbol(realmRec) {
  const symbolConstructor = CreateBuiltinFunction(SymbolConstructor, [], realmRec);
  SetFunctionName(symbolConstructor, NewValue('Symbol'));
  SetFunctionLength(symbolConstructor, NewValue(0));

  [
    ['for', Symbol_for, 1],
    ['keyFor', Symbol_keyFor, 1],
  ].forEach(([name, fn, len]) => {
    fn = CreateBuiltinFunction(fn, [], realmRec);
    SetFunctionName(fn, NewValue(name));
    SetFunctionLength(fn, NewValue(len));
    symbolConstructor.DefineOwnProperty(NewValue(name), {
      Value: fn,
      Writable: true,
      Enumerable: false,
      Configurable: true,
    });
  });

  {
    const fn = CreateBuiltinFunction((a, { thisValue }) => thisValue, [], realmRec);
    SetFunctionName(fn, NewValue('[Symbol.species]'), NewValue('get'));
    SetFunctionLength(fn, NewValue(0));
    symbolConstructor.DefineOwnProperty(wellKnownSymbols.species, {
      Get: fn,
      Set: NewValue(undefined),
      Enumerable: false,
      Configurable: true,
    });
  }

  for (const [name, sym] of Object.entries(wellKnownSymbols)) {
    symbolConstructor.DefineOwnProperty(NewValue(name), {
      Value: sym,
      Writable: false,
      Enumerable: false,
      Configurable: false,
    });
  }

  symbolConstructor.DefineOwnProperty(NewValue('prototype'), {
    Value: realmRec.Intrinsics['%SymbolPrototype%'],
    Writable: true,
    Enumerable: false,
    Configurable: true,
  });

  realmRec.Intrinsics['%SymbolPrototype%'].DefineOwnProperty(
    NewValue('constructor'), {
      Value: symbolConstructor,
      Writable: true,
      Enumerable: false,
      Configurable: true,
    },
  );

  realmRec.Intrinsics['%Symbol%'] = symbolConstructor;
}
