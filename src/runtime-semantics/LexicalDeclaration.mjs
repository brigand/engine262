import { Evaluate } from '../evaluator.mjs';
import {
  NormalCompletion,
  Q,
  ReturnIfAbrupt,
  X,
} from '../completion.mjs';
import {
  isBindingIdentifier,
  isBindingPattern,
} from '../ast.mjs';
import {
  Value,
} from '../value.mjs';
import {
  surroundingAgent,
} from '../engine.mjs';
import {
  GetValue,
  HasOwnProperty,
  InitializeReferencedBinding,
  ResolveBinding,
  SetFunctionName,
} from '../abstract-ops/all.mjs';
import {
  IsAnonymousFunctionDefinition,
} from '../static-semantics/all.mjs';
import { BindingInitialization_BindingPattern } from './all.mjs';
import { OutOfRange } from '../helpers.mjs';

// 13.3.1.4 #sec-let-and-const-declarations-runtime-semantics-evaluation
//   LexicalBinding :
//     BindingIdentifier
//     BindingIdentifier Initializer
function* Evaluate_LexicalBinding_BindingIdentifier(LexicalBinding) {
  const { id: BindingIdentifier, init: Initializer, strict } = LexicalBinding;
  const bindingId = new Value(BindingIdentifier.name);
  const lhs = X(yield* ResolveBinding(bindingId, undefined, strict));

  if (Initializer) {
    const rhs = yield* Evaluate(Initializer);
    const value = Q(yield* GetValue(rhs));
    if (IsAnonymousFunctionDefinition(Initializer)) {
      const hasNameProperty = Q(yield* HasOwnProperty(value, new Value('name')));
      if (hasNameProperty === Value.false) {
        yield* SetFunctionName(value, bindingId);
      }
    }
    return yield* InitializeReferencedBinding(lhs, value);
  } else {
    return yield* InitializeReferencedBinding(lhs, Value.undefined);
  }
}

// 13.3.1.4 #sec-let-and-const-declarations-runtime-semantics-evaluation
//   LexicalBinding : BindingPattern Initializer
function* Evaluate_LexicalBinding_BindingPattern(LexicalBinding) {
  const { id: BindingPattern, init: Initializer } = LexicalBinding;
  const rhs = yield* Evaluate(Initializer);
  const value = Q(yield* GetValue(rhs));
  const env = surroundingAgent.runningExecutionContext.LexicalEnvironment;
  return yield* BindingInitialization_BindingPattern(BindingPattern, value, env);
}

export function* Evaluate_LexicalBinding(LexicalBinding) {
  switch (true) {
    case isBindingIdentifier(LexicalBinding.id):
      return yield* Evaluate_LexicalBinding_BindingIdentifier(LexicalBinding);

    case isBindingPattern(LexicalBinding.id):
      return yield* Evaluate_LexicalBinding_BindingPattern(LexicalBinding);

    default:
      throw new OutOfRange('Evaluate_LexicalBinding', LexicalBinding.id);
  }
}

// 13.3.1.4 #sec-let-and-const-declarations-runtime-semantics-evaluation
//   BindingList : BindingList `,` LexicalBinding
//
// (implicit)
//   BindingList : LexicalBinding
export function* Evaluate_BindingList(BindingList) {
  let last;
  for (const LexicalBinding of BindingList) {
    last = yield* Evaluate_LexicalBinding(LexicalBinding);
    ReturnIfAbrupt(last);
  }
  return last;
}

// 13.3.1.4 #sec-let-and-const-declarations-runtime-semantics-evaluation
//   LexicalDeclaration : LetOrConst BindingList `;`
export function* Evaluate_LexicalDeclaration({ declarations: BindingList }) {
  const next = yield* Evaluate_BindingList(BindingList);
  ReturnIfAbrupt(next);
  return new NormalCompletion(undefined);
}
