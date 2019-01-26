@preprocessor esmodule

@{%
import { lookahead as rawLookahead } from './lookaheads.mjs';
const lookahead = (start, length) => rawLookahead('RegExp', start, length).join();
%}

@include "./BasicNumerals.ne"

# Pattern[U, N] ::
#     Disjunction[?U, ?N]
Pattern ->
    Disjunction     {% Pattern_Disjunction %}
Pattern_U ->
    Disjunction_U   {% Pattern_Disjunction %}
Pattern_N ->
    Disjunction_N   {% Pattern_Disjunction %}
Pattern_U_N ->
    Disjunction_U_N {% Pattern_Disjunction %}
@{%
const Pattern_Disjunction = ([Disjunction]) => ({ type: 'Pattern', Disjunction });
%}

# Disjunction[U, N] ::
#     Alternative[?U, ?N]
#     Alternative[?U, ?N] | Disjunction[?U, ?N]
Disjunction ->
    Alternative                 {% Disjunction_Alternative %}
  | Alternative "|" Disjunction {% Disjunction_Alternative_Disjunction %}
Disjunction_U ->
    Alternative_U                   {% Disjunction_Alternative %}
  | Alternative_U "|" Disjunction_U {% Disjunction_Alternative_Disjunction %}
Disjunction_N ->
    Alternative_N                   {% Disjunction_Alternative %}
  | Alternative_N "|" Disjunction_N {% Disjunction_Alternative_Disjunction %}
Disjunction_U_N ->
    Alternative_U_N                      {% Disjunction_Alternative %}
  | Alternative_U_N  "|" Disjunction_U_N {% Disjunction_Alternative_Disjunction %}
@{%
const Disjunction_Alternative = ([Alternative]) => ({ type: 'Disjunction', Alternatives: [Alternative] });
const Disjunction_Alternative_Disjunction = ([Alternative, _, Disjunction]) => ({ type: 'Disjunction', Alternatives: [Alternative, ...Disjunction.Alternatives] });
%}

# Alternative[U, N] ::
#     [empty]
#     Alternative[?U, ?N] Term[?U, ?N]
Alternative ->
    null             {% Alternative_empty %}
  | Alternative Term {% Alternative_Alternative_Term %}
Alternative_U ->
    null                 {% Alternative_empty %}
  | Alternative_U Term_U {% Alternative_Alternative_Term %}
Alternative_N ->
    null                 {% Alternative_empty %}
  | Alternative_N Term_N {% Alternative_Alternative_Term %}
Alternative_U_N ->
    null                     {% Alternative_empty %}
  | Alternative_U_N Term_U_N {% Alternative_Alternative_Term %}
@{%
const Alternative_empty = () => ({ type: 'Alternative', Terms: [] });
const Alternative_Alternative_Term = ([Alternative, Term]) => {
  Alternative.Terms.push(Term);
  return Alternative;
};
%}

# Term[U, N] ::
#     Assertion[?U, ?N]
#     Atom[?U, ?N]
#     Atom[?U, ?N] Quantifier
Term ->
    Assertion       {% Term_Assertion %}
  | Atom            {% Term_Atom %}
  | Atom Quantifier {% Term_Atom_Quantifier %}
Term_U ->
    Assertion_U       {% Term_Assertion %}
  | Atom_U            {% Term_Atom %}
  | Atom_U Quantifier {% Term_Atom_Quantifier %}
Term_N ->
    Assertion_N       {% Term_Assertion %}
  | Atom_N            {% Term_Atom %}
  | Atom_N Quantifier {% Term_Atom_Quantifier %}
Term_U_N ->
    Assertion_U_N       {% Term_Assertion %}
  | Atom_U_N            {% Term_Atom %}
  | Atom_U_N Quantifier {% Term_Atom_Quantifier %}
@{%
const Term_Assertion = ([Assertion]) => ({ type: 'Term', subtype: 'Assertion', Assertion });
const Term_Atom = ([Atom]) => ({ type: 'Term', subtype: 'Atom', Atom });
const Term_Atom_Quantifier = ([Atom, Quantifier]) => ({ type: 'Term', subtype: 'AtomQuantifier', Atom, Quantifier });
%}

# Assertion[U, N]::
#     ^
#     $
#     \ b
#     \ B
#     (?= Disjunction[?U, ?N] )
#     (?! Disjunction[?U, ?N] )
#     (?<= Disjunction[?U, ?N] )
#     (?<! Disjunction[?U, ?N] )
Assertion ->
    "^"                    {% Assertion_nt %}
  | "$"                    {% Assertion_nt %}
  | "\\b"                  {% Assertion_nt %}
  | "\\B"                  {% Assertion_nt %}
  | "(?=" Disjunction ")"  {% Assertion_Disjunction %}
  | "(?!" Disjunction ")"  {% Assertion_Disjunction %}
  | "(?<=" Disjunction ")" {% Assertion_Disjunction %}
  | "(?<!" Disjunction ")" {% Assertion_Disjunction %}
Assertion_U ->
    "^"                      {% Assertion_nt %}
  | "$"                      {% Assertion_nt %}
  | "\\b"                    {% Assertion_nt %}
  | "\\B"                    {% Assertion_nt %}
  | "(?=" Disjunction_U ")"  {% Assertion_Disjunction %}
  | "(?!" Disjunction_U ")"  {% Assertion_Disjunction %}
  | "(?<=" Disjunction_U ")" {% Assertion_Disjunction %}
  | "(?<!" Disjunction_U ")" {% Assertion_Disjunction %}
Assertion_N ->
    "^"                      {% Assertion_nt %}
  | "$"                      {% Assertion_nt %}
  | "\\b"                    {% Assertion_nt %}
  | "\\B"                    {% Assertion_nt %}
  | "(?=" Disjunction_N ")"  {% Assertion_Disjunction %}
  | "(?!" Disjunction_N ")"  {% Assertion_Disjunction %}
  | "(?<=" Disjunction_N ")" {% Assertion_Disjunction %}
  | "(?<!" Disjunction_N ")" {% Assertion_Disjunction %}
Assertion_U_N ->
    "^"                        {% Assertion_nt %}
  | "$"                        {% Assertion_nt %}
  | "\\b"                      {% Assertion_nt %}
  | "\\B"                      {% Assertion_nt %}
  | "(?=" Disjunction_U_N ")"  {% Assertion_Disjunction %}
  | "(?!" Disjunction_U_N ")"  {% Assertion_Disjunction %}
  | "(?<=" Disjunction_U_N ")" {% Assertion_Disjunction %}
  | "(?<!" Disjunction_U_N ")" {% Assertion_Disjunction %}
@{%
const Assertion_nt = ([ch]) => ({ type: 'Assertion', subtype: ch });
const Assertion_Disjunction = ([ch, Disjunction]) => ({ type: 'Assertion', subtype: ch, Disjunction });
%}

# Quantifier ::
#     QuantifierPrefix
#     QuantifierPrefix ?
Quantifier ->
    QuantifierPrefix     {% ([QuantifierPrefix]) => ({ type: 'Quantifier', QuantifierPrefix, lazy: false }) %}
  | QuantifierPrefix "?" {% ([QuantifierPrefix]) => ({ type: 'Quantifier', QuantifierPrefix, lazy: true }) %}


# QuantifierPrefix ::
#     *
#     +
#     ?
#     { DecimalDigits }
#     { DecimalDigits , }
#     { DecimalDigits , DecimalDigits }
QuantifierPrefix ->
    "*" {% QuantifierPrefix_nt %}
  | "+" {% QuantifierPrefix_nt %}
  | "?" {% QuantifierPrefix_nt %}
  | "{" DecimalDigits "}"  {% ([_, DecimalDigits]) => ({ type: 'QuantifierPrefix', subtype: 'fixed', DecimalDigits }) %}
  | "{" DecimalDigits ",}" {% ([_, DecimalDigits]) => ({ type: 'QuantifierPrefix', subtype: 'start', DecimalDigits }) %}
  | "{" DecimalDigits "," DecimalDigits "}" {% ([_, DecimalDigits1, c, DecimalDigits2]) => ({ type: 'QuantifierPrefix', subtype: 'range', DecimalDigits1, DecimalDigits2 }) %}
@{%
const QuantifierPrefix_nt = ([ch]) => ({ type: 'QuantifierPrefix', subtype: ch });
%}

# Atom[U, N] ::
#     PatternCharacter
#     .
#     \ AtomEscape[?U, ?N]
#     CharacterClass[?U]
#     ( GroupSpecifier[?U] Disjunction[?U, ?N] )
#     ( ? : Disjunction[?U, ?N] )
Atom ->
    PatternCharacter {% id %}
  | "."
  | "\\" AtomEscape
  | CharacterClass
  | "(" GroupSpecifier Disjunction ")" {% ([l, GroupSpecifier, Disjunction]) => ({ type: 'Atom', subtype: '(', GroupSpecifier, Disjunction }) %}
  | "(?:" Disjunction ")"
Atom_U ->
    PatternCharacter
  | "."
  | "\\" AtomEscape_U
  | CharacterClass_U
  | "(" GroupSpecifier_U Disjunction_U ")"
  | "(?:" Disjunction_U ")"
Atom_N ->
    PatternCharacter
  | "."
  | "\\" AtomEscape_N
  | CharacterClass
  | "(" GroupSpecifier Disjunction_N ")"
  | "(?:" Disjunction_N ")"
Atom_U_N ->
    PatternCharacter
  | "."
  | "\\" AtomEscape_U_N
  | CharacterClass_U
  | "(" GroupSpecifier_U Disjunction_U_N ")"
  | "(?:" Disjunction_U_N ")"

# SyntaxCharacter :: one of
#     ^$\.*+?()[]{}|
SyntaxCharacter ->
    [$^\\.*+?()[\]{}|]

# PatternCharacter ::
#     SourceCharacter but not SyntaxCharacter
PatternCharacter ->
    %PatternCharacter {% ([c]) => ({ PatternCharacter: c }) %}
@{%
const PatternCharacter = { test: /./.test.bind(/[^^$\\.*+?()[\]{}|]/u) };
%}

# AtomEscape[U, N] ::
#     DecimalEscape
#     CharacterClassEscape[?U]
#     CharacterEscape[?U]
#     [+N] k GroupName[?U]
AtomEscape ->
    DecimalEscape        {% AtomEscape_DecimalEscape %}
  | CharacterClassEscape {% AtomEscape_CharacterClassEscape %}
  | CharacterEscape      {% AtomEscape_CharacterEscape %}
AtomEscape_U ->
    DecimalEscape          {% AtomEscape_DecimalEscape %}
  | CharacterClassEscape_U {% AtomEscape_CharacterClassEscape %}
  | CharacterEscape_U      {% AtomEscape_CharacterEscape %}
AtomEscape_N ->
    DecimalEscape        {% AtomEscape_DecimalEscape %}
  | CharacterClassEscape {% AtomEscape_CharacterClassEscape %}
  | CharacterEscape      {% AtomEscape_CharacterEscape %}
  | "k" GroupName        {% AtomEscape_GroupName %}
AtomEscape_U_N ->
    DecimalEscape          {% AtomEscape_DecimalEscape %}
  | CharacterClassEscape_U {% AtomEscape_CharacterClassEscape %}
  | CharacterEscape_U      {% AtomEscape_CharacterEscape %}
  | "k" GroupName_U        {% AtomEscape_GroupName %}
@{%
function AtomEscape_DecimalEscape([DecimalEscape]) {
  return { type: 'AtomEscape', subtype: 'DecimalEscape', DecimalEscape };
}

function AtomEscape_CharacterClassEscape([CharacterClassEscape]) {
  return { type: 'AtomEscape', subtype: 'CharacterClassEscape', CharacterClassEscape };
}

function AtomEscape_CharacterEscape([CharacterEscape]) {
  return { type: 'AtomEscape', subtype: 'CharacterEscape', CharacterEscape };
}

function AtomEscape_GroupName([_, GroupName]) {
  return { type: 'AtomEscape', subtype: 'k', GroupName };
}
%}

# CharacterEscape[U] ::
#     ControlEscape
#     c ControlLetter
#     0 [lookahead ∉ DecimalDigit]
#     HexEscapeSequence
#     RegExpUnicodeEscapeSequence[?U]
#     IdentityEscape[?U]
CharacterEscape ->
    ControlEscape               {% CharacterEscape_ControlEscape %}
  | "c" ControlLetter           {% CharacterEscape_ControlLetter %}
  | "0"                         {% CharacterEscape_Zero %}
  | HexEscapeSequence           {% CharacterEscape_HexEscapeSequence %}
  | RegExpUnicodeEscapeSequence {% CharacterEscape_RegExpUnicodeEscapeSequence %}
  | IdentityEscape              {% CharacterEscape_IdentityEscape %}
CharacterEscape_U ->
    ControlEscape                 {% CharacterEscape_ControlEscape %}
  | "c" ControlLetter             {% CharacterEscape_ControlLetter %}
  | "0"                           {% CharacterEscape_Zero %}
  | HexEscapeSequence             {% CharacterEscape_HexEscapeSequence %}
  | RegExpUnicodeEscapeSequence_U {% CharacterEscape_RegExpUnicodeEscapeSequence %}
  | IdentityEscape_U              {% CharacterEscape_IdentityEscape %}
@{%
function CharacterEscape_ControlEscape([ControlEscape]) {
  return { type: 'CharacterEscape', subtype: 'ControlEscape', ControlEscape };
}

function CharacterEscape_ControlLetter([_, ControlLetter]) {
  return { type: 'CharacterEscape', subtype: 'c', ControlLetter };
}

function CharacterEscape_Zero([_], l, reject) {
  if (/^[0-9]$/.test(lookahead(l + 1, 1))) {
    return reject;
  }
  return { type: 'CharacterEscape', subtype: '0' };
}

function CharacterEscape_HexEscapeSequence([HexEscapeSequence]) {
  return { type: 'CharacterEscape', subtype: 'HexEscapeSequence', HexEscapeSequence };
}

function CharacterEscape_RegExpUnicodeEscapeSequence([RegExpUnicodeEscapeSequence]) {
  return { type: 'CharacterEscape', subtype: 'RegExpUnicodeEscapeSequence', RegExpUnicodeEscapeSequence };
}

function CharacterEscape_IdentityEscape([IdentityEscape]) {
  return { type: 'CharacterEscape', subtype: 'IdentityEscape', IdentityEscape };
}
%}

# ControlEscape :: one of
#     fnrtv
ControlEscape ->
    [fnrtv]

# ControlLetter :: one of
#     abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
ControlLetter ->
    [abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ]

# GroupSpecifier[U] ::
#     [empty]
#     ? GroupName[?U]
GroupSpecifier ->
    null
  | "?" GroupName
GroupSpecifier_U ->
    null
  | "?" GroupName_U

# GroupName[U] ::
#     < RegExpIdentifierName[?U] >
GroupName ->
    "<" RegExpIdentifierName ">"
GroupName_U ->
    "<" RegExpIdentifierName_U ">"

# RegExpIdentifierName[U] ::
#     RegExpIdentifierStart[?U]
#     RegExpIdentifierName[?U] RegExpIdentifierPart[?U]
RegExpIdentifierName ->
    RegExpIdentifierStart
  | RegExpIdentifierName RegExpIdentifierPart
RegExpIdentifierName_U ->
    RegExpIdentifierStart_U
  | RegExpIdentifierName_U RegExpIdentifierPart_U

# RegExpIdentifierStart[U] ::
#     UnicodeIDStart
#     $
#     _
#     \ RegExpUnicodeEscapeSequence[?U]
RegExpIdentifierStart ->
    [a-zA-Z]# TODO UnicodeIDStart
  | "$"
  | "_"
  | "\\" RegExpUnicodeEscapeSequence
RegExpIdentifierStart_U ->
    [a-zA-Z]# TODO UnicodeIDStart
  | "$"
  | "_"
  | "\\" RegExpUnicodeEscapeSequence_U

# RegExpIdentifierPart[U] ::
#     UnicodeIDContinue
#     $
#     \ RegExpUnicodeEscapeSequence[?U]
#     <ZWNJ>
#     <ZWJ>
RegExpIdentifierPart ->
    [a-zA-Z0-9] # TODO UnicodeIDContinue
  | "$"
  | "\\" RegExpUnicodeEscapeSequence
  | [\u200C]
  | [\u200D]
RegExpIdentifierPart_U ->
    [a-zA-Z0-9] # TODO UnicodeIDContinue
  | "$"
  | "\\" RegExpUnicodeEscapeSequence_U
  | [\u200C]
  | [\u200D]

# RegExpUnicodeEscapeSequence[U] ::
# [+U] u LeadSurrogate \u TrailSurrogate
# [+U] u LeadSurrogate
# [+U] u TrailSurrogate
# [+U] u NonSurrogate
# [~U] u Hex4Digits
# [+U] u{ CodePoint }
RegExpUnicodeEscapeSequence ->
    "u" Hex4Digits
RegExpUnicodeEscapeSequence_U ->
    "u" LeadSurrogate "\\u" TrailSurrogate
  | "u" LeadSurrogate
  | "u" TrailSurrogate
  | "u" NonSurrogate
  | "u{" CodePoint "}"

# TODO Each \u TrailSurrogate for which the choice of associated u LeadSurrogate is ambiguous shall be associated with the nearest possible u LeadSurrogate that would otherwise have no corresponding \u TrailSurrogate.

# LeadSurrogate ::
#     Hex4Digitsbut only if the SV of Hex4Digits is in the inclusive range 0xD800 to 0xDBFF
LeadSurrogate ->
    Hex4Digits # TODO but only if the SV of Hex4Digits is in the inclusive range 0xD800 to 0xDBFF

# TrailSurrogate ::
#     Hex4Digitsbut only if the SV of Hex4Digits is in the inclusive range 0xDC00 to 0xDFFF
TrailSurrogate ->
    Hex4Digits # TODO but only if the SV of Hex4Digits is in the inclusive range 0xDC00 to 0xDFFF

# NonSurrogate ::
#     Hex4Digitsbut only if the SV of Hex4Digits is not in the inclusive range 0xD800 to 0xDFFF
NonSurrogate ->
    Hex4Digits # TODO but only if the SV of Hex4Digits is not in the inclusive range 0xD800 to 0xDFFF

# IdentityEscape[U] ::
# [+U] SyntaxCharacter
# [+U] /
# [~U] SourceCharacter but not UnicodeIDContinue
IdentityEscape ->
    %IdentityEscape {% id %}
@{%
// const r = regenerate();
// require('unicode-11.0.0/Binary_Property/ID_Continue/code-points.js').forEach(cp => r.add(cp));
// r.toString({ hasUnicodeFlag: true });
const IdentityEscape = { test: /./.test.bind(/[^0-9A-Z_a-z\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05EF-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u07FD\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D3-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u09FE\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1878\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEF\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7B9\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC\u{10000}-\u{1000B}\u{1000D}-\u{10026}\u{10028}-\u{1003A}\u{1003C}\u{1003D}\u{1003F}-\u{1004D}\u{10050}-\u{1005D}\u{10080}-\u{100FA}\u{10140}-\u{10174}\u{101FD}\u{10280}-\u{1029C}\u{102A0}-\u{102D0}\u{102E0}\u{10300}-\u{1031F}\u{1032D}-\u{1034A}\u{10350}-\u{1037A}\u{10380}-\u{1039D}\u{103A0}-\u{103C3}\u{103C8}-\u{103CF}\u{103D1}-\u{103D5}\u{10400}-\u{1049D}\u{104A0}-\u{104A9}\u{104B0}-\u{104D3}\u{104D8}-\u{104FB}\u{10500}-\u{10527}\u{10530}-\u{10563}\u{10600}-\u{10736}\u{10740}-\u{10755}\u{10760}-\u{10767}\u{10800}-\u{10805}\u{10808}\u{1080A}-\u{10835}\u{10837}\u{10838}\u{1083C}\u{1083F}-\u{10855}\u{10860}-\u{10876}\u{10880}-\u{1089E}\u{108E0}-\u{108F2}\u{108F4}\u{108F5}\u{10900}-\u{10915}\u{10920}-\u{10939}\u{10980}-\u{109B7}\u{109BE}\u{109BF}\u{10A00}-\u{10A03}\u{10A05}\u{10A06}\u{10A0C}-\u{10A13}\u{10A15}-\u{10A17}\u{10A19}-\u{10A35}\u{10A38}-\u{10A3A}\u{10A3F}\u{10A60}-\u{10A7C}\u{10A80}-\u{10A9C}\u{10AC0}-\u{10AC7}\u{10AC9}-\u{10AE6}\u{10B00}-\u{10B35}\u{10B40}-\u{10B55}\u{10B60}-\u{10B72}\u{10B80}-\u{10B91}\u{10C00}-\u{10C48}\u{10C80}-\u{10CB2}\u{10CC0}-\u{10CF2}\u{10D00}-\u{10D27}\u{10D30}-\u{10D39}\u{10F00}-\u{10F1C}\u{10F27}\u{10F30}-\u{10F50}\u{11000}-\u{11046}\u{11066}-\u{1106F}\u{1107F}-\u{110BA}\u{110D0}-\u{110E8}\u{110F0}-\u{110F9}\u{11100}-\u{11134}\u{11136}-\u{1113F}\u{11144}-\u{11146}\u{11150}-\u{11173}\u{11176}\u{11180}-\u{111C4}\u{111C9}-\u{111CC}\u{111D0}-\u{111DA}\u{111DC}\u{11200}-\u{11211}\u{11213}-\u{11237}\u{1123E}\u{11280}-\u{11286}\u{11288}\u{1128A}-\u{1128D}\u{1128F}-\u{1129D}\u{1129F}-\u{112A8}\u{112B0}-\u{112EA}\u{112F0}-\u{112F9}\u{11300}-\u{11303}\u{11305}-\u{1130C}\u{1130F}\u{11310}\u{11313}-\u{11328}\u{1132A}-\u{11330}\u{11332}\u{11333}\u{11335}-\u{11339}\u{1133B}-\u{11344}\u{11347}\u{11348}\u{1134B}-\u{1134D}\u{11350}\u{11357}\u{1135D}-\u{11363}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11400}-\u{1144A}\u{11450}-\u{11459}\u{1145E}\u{11480}-\u{114C5}\u{114C7}\u{114D0}-\u{114D9}\u{11580}-\u{115B5}\u{115B8}-\u{115C0}\u{115D8}-\u{115DD}\u{11600}-\u{11640}\u{11644}\u{11650}-\u{11659}\u{11680}-\u{116B7}\u{116C0}-\u{116C9}\u{11700}-\u{1171A}\u{1171D}-\u{1172B}\u{11730}-\u{11739}\u{11800}-\u{1183A}\u{118A0}-\u{118E9}\u{118FF}\u{11A00}-\u{11A3E}\u{11A47}\u{11A50}-\u{11A83}\u{11A86}-\u{11A99}\u{11A9D}\u{11AC0}-\u{11AF8}\u{11C00}-\u{11C08}\u{11C0A}-\u{11C36}\u{11C38}-\u{11C40}\u{11C50}-\u{11C59}\u{11C72}-\u{11C8F}\u{11C92}-\u{11CA7}\u{11CA9}-\u{11CB6}\u{11D00}-\u{11D06}\u{11D08}\u{11D09}\u{11D0B}-\u{11D36}\u{11D3A}\u{11D3C}\u{11D3D}\u{11D3F}-\u{11D47}\u{11D50}-\u{11D59}\u{11D60}-\u{11D65}\u{11D67}\u{11D68}\u{11D6A}-\u{11D8E}\u{11D90}\u{11D91}\u{11D93}-\u{11D98}\u{11DA0}-\u{11DA9}\u{11EE0}-\u{11EF6}\u{12000}-\u{12399}\u{12400}-\u{1246E}\u{12480}-\u{12543}\u{13000}-\u{1342E}\u{14400}-\u{14646}\u{16800}-\u{16A38}\u{16A40}-\u{16A5E}\u{16A60}-\u{16A69}\u{16AD0}-\u{16AED}\u{16AF0}-\u{16AF4}\u{16B00}-\u{16B36}\u{16B40}-\u{16B43}\u{16B50}-\u{16B59}\u{16B63}-\u{16B77}\u{16B7D}-\u{16B8F}\u{16E40}-\u{16E7F}\u{16F00}-\u{16F44}\u{16F50}-\u{16F7E}\u{16F8F}-\u{16F9F}\u{16FE0}\u{16FE1}\u{17000}-\u{187F1}\u{18800}-\u{18AF2}\u{1B000}-\u{1B11E}\u{1B170}-\u{1B2FB}\u{1BC00}-\u{1BC6A}\u{1BC70}-\u{1BC7C}\u{1BC80}-\u{1BC88}\u{1BC90}-\u{1BC99}\u{1BC9D}\u{1BC9E}\u{1D165}-\u{1D169}\u{1D16D}-\u{1D172}\u{1D17B}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D242}-\u{1D244}\u{1D400}-\u{1D454}\u{1D456}-\u{1D49C}\u{1D49E}\u{1D49F}\u{1D4A2}\u{1D4A5}\u{1D4A6}\u{1D4A9}-\u{1D4AC}\u{1D4AE}-\u{1D4B9}\u{1D4BB}\u{1D4BD}-\u{1D4C3}\u{1D4C5}-\u{1D505}\u{1D507}-\u{1D50A}\u{1D50D}-\u{1D514}\u{1D516}-\u{1D51C}\u{1D51E}-\u{1D539}\u{1D53B}-\u{1D53E}\u{1D540}-\u{1D544}\u{1D546}\u{1D54A}-\u{1D550}\u{1D552}-\u{1D6A5}\u{1D6A8}-\u{1D6C0}\u{1D6C2}-\u{1D6DA}\u{1D6DC}-\u{1D6FA}\u{1D6FC}-\u{1D714}\u{1D716}-\u{1D734}\u{1D736}-\u{1D74E}\u{1D750}-\u{1D76E}\u{1D770}-\u{1D788}\u{1D78A}-\u{1D7A8}\u{1D7AA}-\u{1D7C2}\u{1D7C4}-\u{1D7CB}\u{1D7CE}-\u{1D7FF}\u{1DA00}-\u{1DA36}\u{1DA3B}-\u{1DA6C}\u{1DA75}\u{1DA84}\u{1DA9B}-\u{1DA9F}\u{1DAA1}-\u{1DAAF}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E800}-\u{1E8C4}\u{1E8D0}-\u{1E8D6}\u{1E900}-\u{1E94A}\u{1E950}-\u{1E959}\u{1EE00}-\u{1EE03}\u{1EE05}-\u{1EE1F}\u{1EE21}\u{1EE22}\u{1EE24}\u{1EE27}\u{1EE29}-\u{1EE32}\u{1EE34}-\u{1EE37}\u{1EE39}\u{1EE3B}\u{1EE42}\u{1EE47}\u{1EE49}\u{1EE4B}\u{1EE4D}-\u{1EE4F}\u{1EE51}\u{1EE52}\u{1EE54}\u{1EE57}\u{1EE59}\u{1EE5B}\u{1EE5D}\u{1EE5F}\u{1EE61}\u{1EE62}\u{1EE64}\u{1EE67}-\u{1EE6A}\u{1EE6C}-\u{1EE72}\u{1EE74}-\u{1EE77}\u{1EE79}-\u{1EE7C}\u{1EE7E}\u{1EE80}-\u{1EE89}\u{1EE8B}-\u{1EE9B}\u{1EEA1}-\u{1EEA3}\u{1EEA5}-\u{1EEA9}\u{1EEAB}-\u{1EEBB}\u{20000}-\u{2A6D6}\u{2A700}-\u{2B734}\u{2B740}-\u{2B81D}\u{2B820}-\u{2CEA1}\u{2CEB0}-\u{2EBE0}\u{2F800}-\u{2FA1D}\u{E0100}-\u{E01EF}]/u) };
%}
IdentityEscape_U ->
    SyntaxCharacter {% id %}
  | "/"             {% id %}

# Implements CapturingGroupNumber
# 21.2.1.2 #sec-patterns-static-semantics-capturing-group-number

# DecimalEscape ::
#   NonZeroDigit DecimalDigits_opt [lookahead ∉ DecimalDigit]
DecimalEscape ->
    NonZeroDigit {% ([NonZeroDigit], l, reject) => /^[0-9]$/.test(lookahead(l + 1, 1)) ? reject : { type: 'DecimalEscape', value: NonZeroDigit } %}
  | NonZeroDigit DecimalDigits {% ([NonZeroDigit, [DecimalDigits, n]], l, reject) => /^[0-9]$/.test(lookahead(l + 1 + Number(n), 1)) ? reject : { type: 'DecimalEscape', value: (NonZeroDigit * 10n ** n) + DecimalDigits } %}

# CharacterClassEscape[U] ::
#     d
#     D
#     s
#     S
#     w
#     W
#     [+U] p{ UnicodePropertyValueExpression }
#     [+U] P{ UnicodePropertyValueExpression }
CharacterClassEscape ->
    "d"
  | "D"
  | "s"
  | "S"
  | "w"
  | "W"
CharacterClassEscape_U ->
    "d"
  | "D"
  | "s"
  | "S"
  | "w"
  | "W"
  | "p{" UnicodePropertyValueExpression "}"
  | "P{" UnicodePropertyValueExpression "}"

# UnicodePropertyValueExpression ::
#     UnicodePropertyName = UnicodePropertyValue
#     LoneUnicodePropertyNameOrValue
UnicodePropertyValueExpression ->
    UnicodePropertyName "=" UnicodePropertyValue
  | LoneUnicodePropertyNameOrValue

# UnicodePropertyName ::
#     UnicodePropertyNameCharacters
UnicodePropertyName ->
    UnicodePropertyNameCharacters

# UnicodePropertyNameCharacters ::
#     UnicodePropertyNameCharacter UnicodePropertyNameCharacters_opt
UnicodePropertyNameCharacters ->
    UnicodePropertyNameCharacter
  | UnicodePropertyNameCharacter UnicodePropertyNameCharacters

# UnicodePropertyValue ::
#     UnicodePropertyValueCharacters
UnicodePropertyValue ->
    UnicodePropertyValueCharacters

# LoneUnicodePropertyNameOrValue ::
#     UnicodePropertyValueCharacters
LoneUnicodePropertyNameOrValue ->
    UnicodePropertyValueCharacters

# UnicodePropertyValueCharacters ::
#     UnicodePropertyValueCharacter UnicodePropertyValueCharacters_opt
UnicodePropertyValueCharacters ->
    UnicodePropertyValueCharacter
  | UnicodePropertyValueCharacter UnicodePropertyValueCharacters

# UnicodePropertyValueCharacter ::
#     UnicodePropertyNameCharacter
#     0
#     1
#     2
#     3
#     4
#     5
#     6
#     7
#     8
#     9
UnicodePropertyValueCharacter ->
    UnicodePropertyNameCharacter
  | [0-9]

# UnicodePropertyNameCharacter ::
#     ControlLetter
#     _
UnicodePropertyNameCharacter ->
    ControlLetter
  | "_"

# CharacterClass[U] ::
#     [ [lookahead ∉ { ^ } ] ClassRanges[?U] ]
#     [ ^ClassRanges[?U] ]
CharacterClass ->
    "[" ClassRanges "]"  {% CharacterClass_Evaluate.bind(undefined, false) %}
  | "[^" ClassRanges "]" {% CharacterClass_Evaluate.bind(undefined, true) %}
CharacterClass_U ->
    "[" ClassRanges_U "]"  {% CharacterClass_Evaluate.bind(undefined, false) %}
  | "[^" ClassRanges_U "]" {% CharacterClass_Evaluate.bind(undefined, true) %}
@{%
function CharacterClass_Evaluate(inverted, [_, ClassRanges], l, reject) {
  if (!inverted && lookahead(l + 1, 1) === '^') {
    return reject;
  }
  return { type: 'CharacterClass', inverted, ClassRanges };
}
%}

# ClassRanges[U] ::
#     [empty]
#     NonemptyClassRanges[?U]
ClassRanges ->
    null
  | NonemptyClassRanges
ClassRanges_U ->
    null
  | NonemptyClassRanges_U

# NonemptyClassRanges[U] ::
#     ClassAtom[?U]
#     ClassAtom[?U] NonemptyClassRangesNoDash[?U]
#     ClassAtom[?U] - ClassAtom[?U] ClassRanges[?U]
NonemptyClassRanges ->
    ClassAtom
  | ClassAtom NonemptyClassRangesNoDash
  | ClassAtom "-" ClassAtom ClassRanges
  NonemptyClassRanges_U ->
    ClassAtom_U
  | ClassAtom_U NonemptyClassRangesNoDash_U
  | ClassAtom_U "-" ClassAtom_U ClassRanges_U

# NonemptyClassRangesNoDash[U] ::
#     ClassAtom[?U]
#     ClassAtomNoDash[?U] NonemptyClassRangesNoDash[?U]
#     ClassAtomNoDash[?U] - ClassAtom[?U] ClassRanges[?U]
NonemptyClassRangesNoDash ->
    ClassAtom
  | ClassAtomNoDash NonemptyClassRangesNoDash
  | ClassAtomNoDash "-" ClassAtom ClassRanges
NonemptyClassRangesNoDash_U ->
    ClassAtom_U
  | ClassAtomNoDash_U NonemptyClassRangesNoDash_U
  | ClassAtomNoDash_U "-" ClassAtom_U ClassRanges_U

# ClassAtom[U] ::
#     -
#     ClassAtomNoDash[?U]
ClassAtom ->
    "-"
  | ClassAtomNoDash
ClassAtom_U ->
    "-"
  | ClassAtomNoDash_U

# ClassAtomNoDash[U] ::
#   SourceCharacter but not one of \ or ] or -
#   \ ClassEscape[?U]
ClassAtomNoDash ->
    %ClassAtomNoDash
  | "\\" ClassEscape
ClassAtomNoDash_U ->
    %ClassAtomNoDash
  | "\\" ClassEscape_U
@{%
const ClassAtomNoDash = { test: /./.test.bind(/[^\\\]\-]/u) };
%}

# ClassEscape[U] ::
#     b
#     [+U] -
#     CharacterClassEscape[?U]
#     CharacterEscape[?U]
ClassEscape ->
    "b"
  | CharacterClassEscape
  | CharacterEscape
ClassEscape_U ->
    "b"
  | "-"
  | CharacterClassEscape_U
  | CharacterEscape_U

# HexEscapeSequence ::
#     x HexDigit HexDigit
HexEscapeSequence ->
    "x" HexDigit HexDigit

# Hex4Digits ::
#     HexDigit HexDigit HexDigit HexDigit
Hex4Digits ->
    HexDigit HexDigit HexDigit HexDigit

# CodePoint ::
#     HexDigits but only if MV of HexDigits ≤ 0x10FFFF
CodePoint ->
    HexDigits # TODO HexDigits but only if MV of HexDigits ≤ 0x10FFFF
