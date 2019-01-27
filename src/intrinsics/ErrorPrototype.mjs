import {
  surroundingAgent,
} from '../engine.mjs';
import {
  Type,
  Value,
} from '../value.mjs';
import {
  Get,
  ToString,
} from '../abstract-ops/all.mjs';
import { Q } from '../completion.mjs';
import { BootstrapPrototype } from './Bootstrap.mjs';

function* ErrorProto_toString(args, { thisValue }) {
  const O = thisValue;
  if (Type(O) !== 'Object') {
    return surroundingAgent.Throw('TypeError');
  }
  let name = Q(yield* Get(O, new Value('name')));
  if (Type(name) === 'Undefined') {
    name = new Value('Error');
  } else {
    name = Q(yield* ToString(name));
  }
  let msg = Q(yield* Get(O, new Value('message')));
  if (Type(msg) === 'Undefined') {
    msg = new Value('');
  } else {
    msg = Q(yield* ToString(msg));
  }
  if (name.stringValue() === '') {
    return msg;
  }
  if (msg.stringValue() === '') {
    return name;
  }
  return new Value(`${name.stringValue()}: ${msg.stringValue()}`);
}

export function CreateErrorPrototype(realmRec) {
  const proto = BootstrapPrototype(realmRec, [
    ['toString', ErrorProto_toString, 0],
    ['message', new Value('')],
    ['name', new Value('Error')],
  ], realmRec.Intrinsics['%ObjectPrototype%']);

  realmRec.Intrinsics['%ErrorPrototype%'] = proto;
}
