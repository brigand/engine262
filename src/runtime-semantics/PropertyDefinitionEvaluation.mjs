import {
  IsAnonymousFunctionDefinition,
} from '../static-semantics/all.mjs';
import {
  isAsyncMethod,
  isAsyncGeneratorMethod,
  isGeneratorMethod,
  isMethodDefinition,
  isMethodDefinitionGetter,
  isMethodDefinitionRegularFunction,
  isMethodDefinitionSetter,
  isPropertyDefinitionIdentifierReference,
  isPropertyDefinitionKeyValue,
  isPropertyDefinitionSpread,
} from '../ast.mjs';
import {
  Assert,
  CopyDataProperties,
  CreateDataPropertyOrThrow,
  DefinePropertyOrThrow,
  FunctionCreate,
  GeneratorFunctionCreate,
  AsyncGeneratorFunctionCreate,
  AsyncFunctionCreate,
  GetValue,
  HasOwnProperty,
  MakeMethod,
  ObjectCreate,
  SetFunctionName,
  isStrictModeCode,
  sourceTextMatchedBy,
} from '../abstract-ops/all.mjs';
import { Descriptor, Value } from '../value.mjs';
import { Evaluate } from '../evaluator.mjs';
import {
  DefineMethod,
  Evaluate_PropertyName,
} from './all.mjs';
import { surroundingAgent } from '../engine.mjs';
import { Q, ReturnIfAbrupt, X } from '../completion.mjs';
import { OutOfRange } from '../helpers.mjs';

function hasNonConfigurableProperties(obj) {
  for (const desc of obj.properties.values()) {
    if (desc.Configurable === Value.false) {
      return true;
    }
  }
  return false;
}

// 12.2.6.8 #sec-object-initializer-runtime-semantics-propertydefinitionevaluation
//   PropertyDefinitionList : PropertyDefinitionList `,` PropertyDefinition
//
// (implicit)
//   PropertyDefinitionList : PropertyDefinition
export function* PropertyDefinitionEvaluation_PropertyDefinitionList(
  PropertyDefinitionList, object, enumerable,
) {
  Assert(PropertyDefinitionList.length > 0);

  let lastReturn;
  for (const PropertyDefinition of PropertyDefinitionList) {
    lastReturn = Q(yield* PropertyDefinitionEvaluation_PropertyDefinition(
      PropertyDefinition, object, enumerable,
    ));
  }
  return lastReturn;
}

// 12.2.6.8 #sec-object-initializer-runtime-semantics-propertydefinitionevaluation
//   PropertyDefinition : `...` AssignmentExpression
function* PropertyDefinitionEvaluation_PropertyDefinition_Spread(PropertyDefinition, object) {
  const AssignmentExpression = PropertyDefinition.argument;

  const exprValue = yield* Evaluate(AssignmentExpression);
  const fromValue = Q(GetValue(exprValue));
  const excludedNames = [];
  return Q(CopyDataProperties(object, fromValue, excludedNames));
}

// 12.2.6.8 #sec-object-initializer-runtime-semantics-propertydefinitionevaluation
//   PropertyDefinition : IdentifierReference
function* PropertyDefinitionEvaluation_PropertyDefinition_IdentifierReference(
  PropertyDefinition, object, enumerable,
) {
  const IdentifierReference = PropertyDefinition.key;
  const propName = new Value(IdentifierReference.name);
  const exprValue = yield* Evaluate(IdentifierReference);
  const propValue = Q(GetValue(exprValue));
  Assert(enumerable);
  Assert(object.isOrdinary);
  Assert(object.Extensible === Value.true);
  Assert(!hasNonConfigurableProperties(object));
  return X(CreateDataPropertyOrThrow(object, propName, propValue));
}

// 12.2.6.8 #sec-object-initializer-runtime-semantics-propertydefinitionevaluation
//   PropertyDefinition : PropertyName `:` AssignmentExpression
function* PropertyDefinitionEvaluation_PropertyDefinition_KeyValue(
  PropertyDefinition, object, enumerable,
) {
  const { key: PropertyName, value: AssignmentExpression } = PropertyDefinition;
  const propKey = yield* Evaluate_PropertyName(PropertyName, PropertyDefinition.computed);
  ReturnIfAbrupt(propKey);
  const exprValueRef = yield* Evaluate(AssignmentExpression);
  const propValue = Q(GetValue(exprValueRef));
  if (IsAnonymousFunctionDefinition(AssignmentExpression)) {
    const hasNameProperty = Q(HasOwnProperty(propValue, new Value('name')));
    if (hasNameProperty === Value.false) {
      X(SetFunctionName(propValue, propKey));
    }
  }
  Assert(enumerable);
  Assert(object.isOrdinary);
  Assert(object.Extensible === Value.true);
  Assert(!hasNonConfigurableProperties(object));
  return X(CreateDataPropertyOrThrow(object, propKey, propValue));
}

// 14.3.8 #sec-method-definitions-runtime-semantics-propertydefinitionevaluation
//   MethodDefinition :
//     PropertyName `(` UniqueFormalParameters `)` `{` FunctionBody `}`
//     `get` PropertyName `(` `)` `{` FunctionBody `}`
//     `set` PropertyName `(` PropertySetParameterList `)` `{` FunctionBody `}`
//
// (implicit)
//   MethodDefinition : GeneratorMethod
export function* PropertyDefinitionEvaluation_MethodDefinition(MethodDefinition, object, enumerable) {
  switch (true) {
    case isMethodDefinitionRegularFunction(MethodDefinition): {
      const methodDef = yield* DefineMethod(MethodDefinition, object);
      ReturnIfAbrupt(methodDef);
      X(SetFunctionName(methodDef.Closure, methodDef.Key));
      const desc = Descriptor({
        Value: methodDef.Closure,
        Writable: Value.true,
        Enumerable: enumerable ? Value.true : Value.false,
        Configurable: Value.true,
      });
      return Q(DefinePropertyOrThrow(object, methodDef.Key, desc));
    }

    case isGeneratorMethod(MethodDefinition):
      return yield* PropertyDefinitionEvaluation_GeneratorMethod(MethodDefinition, object, enumerable);

    case isAsyncMethod(MethodDefinition):
      return yield* PropertyDefinitionEvaluation_AsyncMethod(MethodDefinition, object, enumerable);

    case isAsyncGeneratorMethod(MethodDefinition):
      return yield* PropertyDefinitionEvaluation_AsyncGeneratorMethod(MethodDefinition, object, enumerable);

    case isMethodDefinitionGetter(MethodDefinition): {
      const PropertyName = MethodDefinition.key;

      const propKey = yield* Evaluate_PropertyName(PropertyName, MethodDefinition.computed);
      ReturnIfAbrupt(propKey);
      // If the function code for this MethodDefinition is strict mode code, let strict be true. Otherwise let strict be false.
      const strict = isStrictModeCode(MethodDefinition);
      const scope = surroundingAgent.runningExecutionContext.LexicalEnvironment;
      const formalParameterList = [];
      const closure = FunctionCreate('Method', formalParameterList, MethodDefinition.value, scope, strict);
      X(MakeMethod(closure, object));
      X(SetFunctionName(closure, propKey, new Value('get')));
      closure.SourceText = sourceTextMatchedBy(MethodDefinition);
      const desc = Descriptor({
        Get: closure,
        Enumerable: enumerable ? Value.true : Value.false,
        Configurable: Value.true,
      });
      return Q(DefinePropertyOrThrow(object, propKey, desc));
    }

    case isMethodDefinitionSetter(MethodDefinition): {
      const PropertyName = MethodDefinition.key;
      const PropertySetParameterList = MethodDefinition.value.params;

      const propKey = yield* Evaluate_PropertyName(PropertyName, MethodDefinition.computed);
      ReturnIfAbrupt(propKey);
      // If the function code for this MethodDefinition is strict mode code, let strict be true. Otherwise let strict be false.
      const strict = isStrictModeCode(MethodDefinition);
      const scope = surroundingAgent.runningExecutionContext.LexicalEnvironment;
      const closure = FunctionCreate('Method', PropertySetParameterList, MethodDefinition.value, scope, strict);
      X(MakeMethod(closure, object));
      X(SetFunctionName(closure, propKey, new Value('set')));
      closure.SourceText = sourceTextMatchedBy(MethodDefinition);
      const desc = Descriptor({
        Set: closure,
        Enumerable: enumerable ? Value.true : Value.false,
        Configurable: Value.true,
      });
      return Q(DefinePropertyOrThrow(object, propKey, desc));
    }
    default:
      throw new OutOfRange('PropertyDefinitionEvaluation_MethodDefinition', MethodDefinition);
  }
}

// (implicit)
//   ClassElement :
//     MethodDefinition
//     `static` MethodDefinition
export const PropertyDefinitionEvaluation_ClassElement = PropertyDefinitionEvaluation_MethodDefinition;

// 14.4.12 #sec-generator-function-definitions-runtime-semantics-propertydefinitionevaluation
//   GeneratorMethod : `*` PropertyName `(` UniqueFormalParameters `)` `{` GeneratorBody `}`
function* PropertyDefinitionEvaluation_GeneratorMethod(GeneratorMethod, object, enumerable) {
  const {
    key: PropertyName,
    value: GeneratorExpression,
  } = GeneratorMethod;
  const UniqueFormalParameters = GeneratorExpression.params;

  const strict = isStrictModeCode(GeneratorExpression);
  const propKey = yield* Evaluate_PropertyName(PropertyName, GeneratorMethod.computed);
  ReturnIfAbrupt(propKey);
  const scope = surroundingAgent.runningExecutionContext.LexicalEnvironment;
  const closure = X(GeneratorFunctionCreate('Method', UniqueFormalParameters, GeneratorExpression, scope, strict));
  MakeMethod(closure, object);
  const prototype = ObjectCreate(surroundingAgent.intrinsic('%GeneratorPrototype%'));
  X(DefinePropertyOrThrow(
    closure,
    new Value('prototype'),
    Descriptor({
      Value: prototype,
      Writable: Value.true,
      Enumerable: Value.false,
      Configurable: Value.false,
    }),
  ));
  X(SetFunctionName(closure, propKey));
  closure.SourceText = sourceTextMatchedBy(GeneratorExpression);
  const desc = Descriptor({
    Value: closure,
    Writable: Value.true,
    Enumerable: enumerable ? Value.true : Value.false,
    Configurable: Value.true,
  });
  return Q(DefinePropertyOrThrow(object, propKey, desc));
}

// AsyncMethod : `async` PropertyName `(` UniqueFormalParameters `)` `{` AsyncFunctionBody `}`
function* PropertyDefinitionEvaluation_AsyncMethod(AsyncMethod, object, enumerable) {
  const {
    key: PropertyName,
    value: AsyncExpression,
  } = AsyncMethod;
  const UniqueFormalParameters = AsyncExpression.params;

  const propKey = yield* Evaluate_PropertyName(PropertyName, AsyncMethod.computed);
  ReturnIfAbrupt(propKey);
  const strict = isStrictModeCode(AsyncExpression);
  const scope = surroundingAgent.runningExecutionContext.LexicalEnvironment;
  const closure = X(AsyncFunctionCreate('Method', UniqueFormalParameters, AsyncExpression, scope, strict));
  X(MakeMethod(closure, object));
  X(SetFunctionName(closure, propKey));
  const desc = Descriptor({
    Value: closure,
    Writable: Value.true,
    Enumerable: enumerable ? Value.true : Value.false,
    Configurable: Value.true,
  });
  return Q(DefinePropertyOrThrow(object, propKey, desc));
}

// AsyncGeneratorMethod : `async` `*` PropertyName `(` UniqueFormalParameters `)` `{` AsyncGeneratorFunctionBody `}`
function* PropertyDefinitionEvaluation_AsyncGeneratorMethod(AsyncGeneratorMethod, object, enumerable) {
  const {
    key: PropertyName,
    value: AsyncGeneratorExpression,
  } = AsyncGeneratorMethod;
  const UniqueFormalParameters = AsyncGeneratorExpression.params;

  const propKey = yield* Evaluate_PropertyName(PropertyName, AsyncGeneratorMethod.computed);
  ReturnIfAbrupt(propKey);
  const strict = isStrictModeCode(AsyncGeneratorExpression);
  const scope = surroundingAgent.runningExecutionContext.LexicalEnvironment;
  const closure = X(AsyncGeneratorFunctionCreate('Method', UniqueFormalParameters, AsyncGeneratorExpression, scope, strict));
  X(MakeMethod(closure, object));
  const prototype = X(ObjectCreate(surroundingAgent.intrinsic('%AsyncGeneratorPrototype%')));
  X(DefinePropertyOrThrow(closure, new Value('prototype'), Descriptor({
    Value: prototype,
    Writable: Value.true,
    Enumerable: Value.false,
    Configurable: Value.false,
  })));
  X(SetFunctionName(closure, propKey));
  const desc = Descriptor({
    Value: closure,
    Writable: Value.true,
    Enumerable: enumerable ? Value.true : Value.false,
    Configurable: Value.true,
  });
  return Q(DefinePropertyOrThrow(object, propKey, desc));
}

// (implicit)
//   PropertyDefinition : MethodDefinition
//
// Note: PropertyDefinition : CoverInitializedName is an early error.
function* PropertyDefinitionEvaluation_PropertyDefinition(PropertyDefinition, object, enumerable) {
  switch (true) {
    case isPropertyDefinitionIdentifierReference(PropertyDefinition):
      return yield* PropertyDefinitionEvaluation_PropertyDefinition_IdentifierReference(
        PropertyDefinition, object, enumerable,
      );

    case isPropertyDefinitionKeyValue(PropertyDefinition):
      return yield* PropertyDefinitionEvaluation_PropertyDefinition_KeyValue(PropertyDefinition, object, enumerable);

    case isMethodDefinition(PropertyDefinition):
      return yield* PropertyDefinitionEvaluation_MethodDefinition(PropertyDefinition, object, enumerable);

    case isPropertyDefinitionSpread(PropertyDefinition):
      return yield* PropertyDefinitionEvaluation_PropertyDefinition_Spread(
        PropertyDefinition, object, enumerable,
      );

    default:
      throw new OutOfRange('PropertyDefinitionEvaluation_PropertyDefinition', PropertyDefinition);
  }
}
