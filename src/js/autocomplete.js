/* exported getCompletions */

function getCompletions(editor) {
  'use strict';

  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);

  const containsForwardSlash = line.indexOf('/') >= 0;

  const end = cursor.ch;
  let start = end;

    // move start backwards until it finds a space in the previous character
  while (line.charAt(start - 1).match(/[^,\s]/)) {
    start--;
  }

    // if the cursor is in front of a space, return nothing
  if (start == end) {
    return;
  }

  const from = CodeMirror.Pos(cursor.line, start);
  const to = CodeMirror.Pos(cursor.line, end);

  let list = [];

  const state = editor.getTokenAt(from).state.state;

  const completions = {
    operators: ['Add', 'Subt', 'AddI', 'Load', 'LoadI', 'Store', 'StoreI', 'Jump', 'Skipcond', 'JnS', 'JumpI', 'Clear', 'Input', 'Output', 'Halt'],
    origination: ['ORG'],
    operand: ['DEC', 'OCT', 'HEX'],
  };

  const nonOperandOperators = ['Clear', 'Input', 'Output', 'Halt'];

  switch (state) {
    case ('start'):
      Array.prototype.push.apply(list, completions.origination.map((x) => {
        return {
          text: x,
          className: 'completion-origination',
        };
      }));
            /* falls through */
    case ('operator'):
      Array.prototype.push.apply(list, completions.operators.map((x) => {
        return {
          text: x + (nonOperandOperators.indexOf(x) < 0 || containsForwardSlash ? ' ' : '\n'),
          className: 'completion-operator',
        };
      }));
            /* falls through */
    case ('operand'):
      Array.prototype.push.apply(list, completions.operand.map((x) => {
        return {
          text: x + ' ',
          className: 'completion-operand',
        };
      }));
  }

  if (state == 'operand') {
        // Also find labels for completion
    for (let i = 0; i < editor.lineCount(); i++) {
      const label = editor.getLine(i).match(/^(?:([^,\/]+),)/);
      if (label) {
        list.push({
          text: label[1] + '\n',
          className: 'completion-label',
        });
      }
    }
  }

  list = list.filter((completion) => {
    const x = completion.text.toLowerCase();
    const y = line.substring(start, end).toLowerCase();
    return x.trim() != y.trim() && x.indexOf(y) === 0;
  });

  return {
    list,
    from,
    to,
  };
}
