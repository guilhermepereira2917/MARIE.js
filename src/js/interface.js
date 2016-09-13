/* globals Utility, getCompletions, MarieAsm, MarieSim, DataPath, saveAs */

window.addEventListener('load', () => {
  const assembleButton = document.getElementById('assemble');
  const stepButton = document.getElementById('step');
  const microStepButton = document.getElementById('microstep');
  const stepBackButton = document.getElementById('step-back');
  const runButton = document.getElementById('run');
  const rangeDelay = document.getElementById('range-delay');
  const displayDelayMs = document.getElementById('display-delay-ms');
  const restartButton = document.getElementById('restart');
  const textArea = document.getElementById('program');
  const memoryContainer = document.getElementById('memory-container');
  const memoryHeaders = document.getElementById('memory-headers');
  const memory = document.getElementById('memory');
  const statusInfo = document.getElementById('status-info');
  const outputSelect = document.getElementById('output-select');
  const outputLog = document.getElementById('output-log');
  const outputLogTab = document.querySelector("#tab-container a[href='#output-log-outer']");
  const registerLog = document.getElementById('register-log');
  const registerLogOuter = document.getElementById('register-log-outer');
  const registerLogTab = document.querySelector("#tab-container a[href='#register-log-outer']");
  const watchList = document.getElementById('watch-list');
  const uploadButton = document.getElementById('upload');
  const fileInput = document.getElementById('fileInput');
  const datapathEle = document.getElementById('datapath-diagram');
  const datapathInstructionElement = document.getElementById('datapath-display-instructions');
  let currentInstructionRegisterLog = null;
  // types consts
  const HEX = 0;
  const DEC = 1;
  const UNICODE = 2;
  const BIN = 3;
  // pref consts
  let saveTimeout = null;
  let modifiedFile = false;
  let asm = null;
  let sim = null;
  let interval = null;
  let lastErrorLine = null;
  let lastCurrentLine = null;
  let lastBreakPointLine = null;
  let currentInstructionLine = null;
  let breaking = false;
  let microStepping = false;
  let running = false;
  let waiting = false;
  let savedOutput = null;
  let pausedOnInput = false;
  let outputType = HEX;
  let changedInputMode = true;
  let changedOutputMode = true;
  const datapath = new DataPath(datapathEle, datapathInstructionElement);
  let outputList = [];
  let viewingInstruction = false;
  let selectedMemoryCell = null;
  const queryString = window.location.search.substring(1); // returns first query string
  let symbolCells = null;

  const defaultPrefs = {
    autocomplete: true,
    autosave: true,
    minDelay: 1,
    maxDelay: 3000,
    binaryStringGroupLength: 4,
    defaultInputMode: 'HEX',
    defaultOutputMode: 'HEX',
    minDatapathDelay: 1000,
  };

  let prefs = $.extend(defaultPrefs);
  let delay = prefs.minDelay;

  function makeMarker() {
    const marker = document.createElement('div');
    marker.style.color = '#07C';
    marker.innerHTML = '●';
    return marker;
  }

  const programCodeMirror = CodeMirror.fromTextArea(textArea, {
    mode: 'marie',
    lineNumbers: true,
    gutters: ['CodeMirror-linenumbers', 'breakpoints'],
  });

  programCodeMirror.on('gutterClick', (cm, n) => {
    const info = cm.lineInfo(n);
    cm.setGutterMarker(n, 'breakpoints', info.gutterMarkers ? null : makeMarker());
  });

  function saveFile(autoSave) {
    window.localStorage.setItem('marie-program', programCodeMirror.getValue());

    const breakpoints = [];
    const count = programCodeMirror.lineCount();
    let i = count;
    for (i = 0; i < count; i += 1) {
      const info = programCodeMirror.lineInfo(i);
      if (info.gutterMarkers) {
        breakpoints.push(i);
      }
    }
    window.localStorage.setItem('marie-breakpoints', JSON.stringify(breakpoints));

    modifiedFile = false;

    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    if (autoSave) {
      $('#saved-status').text('Autosaved file');
      console.log('Autosaved file', (new Date()).toString());
    } else {
      $('#saved-status').text('Saved file');
      console.log('Saved file', (new Date()).toString());
    }
  }

  programCodeMirror.on('change', (cm) => {
    if (prefs.autocomplete) {
      cm.showHint({
        hint: getCompletions,
        alignWithWord: false,
        completeSingle: false,
      });
    }

    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }

    $('#saved-status').text('Modified file');
    modifiedFile = true;

    if (prefs.autosave) {
      saveTimeout = setTimeout(() => {
        saveFile(true);
      }, 10 * 1000);
    }
  });

  function newfile() {
    const clrtxt = '';
    programCodeMirror.setValue(clrtxt);
    programCodeMirror.clearHistory();
    saveFile();
    localStorage.setItem('marie-program', null);
    $('#saved-status').text('New file');
    location.reload(); // reloads
  }

  function updatePrefs() {
    rangeDelay.min = prefs.minDelay;
    rangeDelay.max = prefs.maxDelay;

    if (!prefs.autosave && saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }

    updateRangeDelay();

    if (prefs.defaultOutputMode === 'HEX') {
      outputType = HEX;
    } else if (prefs.defaultOutputMode === 'DEC') {
      outputType = DEC;
    } else if (prefs.defaultOutputMode === 'UNICODE') {
      outputType = UNICODE;
    } else if (prefs.defaultOutputMode === 'BIN') {
      outputType = BIN;
    }

    if (changedInputMode) {
      $('#input-type').val(prefs.defaultInputMode);
      changedInputMode = false;
    }

    if (changedOutputMode) {
      $('#output-select').val(prefs.defaultOutputMode);
      changedOutputMode = false;
    }
  }

  function getPrefs() {
    const autocomplete = localStorage.getItem('autocomplete');
    const autosave = localStorage.getItem('autosave');
    const minDelay = localStorage.getItem('min-delay');
    const maxDelay = localStorage.getItem('max-delay');
    const defaultInputMode = localStorage.getItem('defaultInputMode-value');
    const defaultOutputMode = localStorage.getItem('defaultOutputMode-value');
    const binaryStringGroupLength = localStorage.getItem('binaryStringGroup-Length');
    const minDatapathDelay = localStorage.getItem('min-datapath-delay');

    if (['false', 'true'].indexOf(autocomplete) >= 0) {
      prefs.autocomplete = autocomplete === 'true';
    }

    if (['false', 'true'].indexOf(autosave) >= 0) {
      prefs.autosave = autosave === 'true';
    }

    if (!isNaN(parseInt(minDelay, 10))) {
      prefs.minDelay = parseInt(minDelay, 10);
    }

    if (defaultInputMode !== null) {
      prefs.defaultInputMode = defaultInputMode;
    }

    if (defaultOutputMode !== null) {
      prefs.defaultOutputMode = defaultOutputMode;
    }

    if (!isNaN(parseInt(maxDelay, 10))) {
      prefs.maxDelay = parseInt(maxDelay, 10);
    }

    if (!isNaN(parseInt(binaryStringGroupLength, 10))) {
      prefs.binaryStringGroupLength = parseInt(binaryStringGroupLength, 10);
    }

    if (!isNaN(parseInt(minDatapathDelay, 10))) {
      prefs.minDatapathDelay = parseInt(minDatapathDelay, 10);
    }

    updatePrefs();
  }

  function setPrefs() {
    localStorage.setItem('autocomplete', prefs.autocomplete);
    localStorage.setItem('autosave', prefs.autosave);
    localStorage.setItem('min-delay', prefs.minDelay);
    localStorage.setItem('max-delay', prefs.maxDelay);
    localStorage.setItem('min-datapath-delay', prefs.minDatapathDelay);
    localStorage.setItem('binaryStringGroup-Length', prefs.binaryStringGroupLength);
    localStorage.setItem('defaultInputMode-value', prefs.defaultInputMode);
    localStorage.setItem('defaultOutputMode-value', prefs.defaultOutputMode);

    updatePrefs();
  }

  getPrefs();

  textArea.value = localStorage.getItem('marie-program') || '';

  if (textArea.value !== '') {
    $('#saved-status').text('Restored file');
  } else {
    textArea.value = '';
    $('#saved-status').text('New file');
  }

  const initialBreakpoints = localStorage.getItem('marie-breakpoints');
  if (initialBreakpoints) {
    JSON.parse(initialBreakpoints).forEach((line) => {
      const info = programCodeMirror.lineInfo(line);
      programCodeMirror.setGutterMarker(line, 'breakpoints', info.gutterMarkers ? null : makeMarker());
    });
  }

  function clearGutters() {
    programCodeMirror.clearGutter('breakpoints');
  }

  function populateMemoryView(sim) {
    while (memory.firstChild) {
      memory.removeChild(memory.firstChild);
    }

    while (memoryHeaders.firstChild) {
      memoryHeaders.removeChild(memoryHeaders.firstChild);
    }

    // Populate headers
    let i;
    let j;
    let th;
    let tr;
    let cell;
    let header;

    const headers = document.createElement('tr');
    th = document.createElement('th');
    headers.appendChild(th);
    for (i = 0; i < 16; i += 1) {
      th = document.createElement('th');
      th.appendChild(document.createTextNode('+' + Utility.hex(i, 1)));
      headers.appendChild(th);
    }

    memoryHeaders.appendChild(headers);

        // Populate memory cells
    for (i = 0; i < 4096; i += 16) {
      tr = document.createElement('tr');

      header = document.createElement('th');
      header.appendChild(document.createTextNode(Utility.hex(i, 3)));
      tr.appendChild(header);

      for (j = 0; j < 16; j+=1) {
        cell = document.createElement('td');
        cell.id = 'cell' + (i + j);
        cell.className = 'cell';
        cell.appendChild(document.createTextNode(Utility.hex(sim.memory[i + j].contents)));
        tr.appendChild(cell);
      }

      memory.appendChild(tr);
    }

    memoryContainer.style.display = 'inline-block';
  }

  function finishInputReplaceMemoryCell() {
    if (selectedMemoryCell === null) {
      return;
    }

    const cellString = 'cell';

    const ele = document.getElementById(cellString + selectedMemoryCell.toString());
    const value = ele.firstChild.value;

    while (ele.firstChild) {
      ele.removeChild(ele.firstChild);
    }

    const parsedValue = parseInt(value, 16);

    const cell = parseInt(ele.id.substr(cellString.length - ele.id.length), 10);

    if (!isNaN(parsedValue)/* && sim*/) {
      ele.textContent = Utility.hex(parsedValue);

      const oldValue = sim.memory[cell].contents;

      if (parsedValue === sim.memory[cell].contents) {
        selectedMemoryCell = null;
        return;
      }

      sim.memory[cell].contents = parsedValue;

            // Delete original instruction if it exists
      if (typeof sim.memory[cell].line !== 'undefined') {
        sim.memory[cell].line = undefined;
        sim.memory[cell].operator = undefined;
        sim.memory[cell].operand = undefined;
        sim.memory[cell].label = undefined;
        sim.program[cell] = undefined;
      }

      setStatus('Modified memory cell at address ' + Utility.hex(cell, 3) + ' from ' + Utility.hex(oldValue) + ' to ' + Utility.hex(parsedValue));
    } else {
      setStatus("Invalid value '" + value + "'; reverting back to original memory cell contents at address " + Utility.hex(cell, 3), true);
      ele.textContent = Utility.hex(sim.memory[cell].contents);
    }

    selectedMemoryCell = null;
  }

  memory.addEventListener('dblclick', (e) => {
    const cellString = 'cell';

    if (e.target && e.target.classList.contains('cell')) {
      finishInputReplaceMemoryCell();
      selectedMemoryCell = parseInt(e.target.id.substr(cellString.length - e.target.id.length), 10);

      const input = document.createElement('input');
      input.type = 'text';
      input.value = e.target.textContent;
      input.size = 4;

      while (e.target.firstChild) {
        e.target.removeChild(e.target.firstChild);
      }

      e.target.appendChild(input);
      input.select();
    }
  });

  memory.addEventListener('keypress', (e) => {
    if (e.which === 13 && e.target && e.target.parentNode.classList.contains('cell')) {
      finishInputReplaceMemoryCell();
    }
  });

  document.addEventListener('click', () => {
    finishInputReplaceMemoryCell();
  });


  function populateWatchList(asm, sim) {
    while (watchList.firstChild) {
      watchList.removeChild(watchList.firstChild);
    }

    const symbolCells = {};

    for (const symbol in asm.symbols) {
      const address = asm.symbols[symbol];

      const tr = document.createElement('tr');
      const labelCell = document.createElement('td');
      labelCell.classList.add('watch-list-label');
      labelCell.appendChild(document.createTextNode(symbol));

      const addressCell = document.createElement('td');
      addressCell.classList.add('watch-list-address');
      addressCell.appendChild(document.createTextNode(Utility.hex(address, 3)));

      const valueCell = document.createElement('td');
      valueCell.classList.add('watch-list-value');
      valueCell.appendChild(document.createTextNode(Utility.hex(sim.memory[address].contents)));

      tr.appendChild(labelCell);
      tr.appendChild(addressCell);
      tr.appendChild(valueCell);

      watchList.appendChild(tr);

      symbolCells[address] = valueCell;
    }

    return symbolCells;
  }

  function convertOutput(value) {
    switch (outputType) {
      case HEX:
        return Utility.hex(value);
      case DEC:
        return value;
      case UNICODE:
        return String.fromCharCode(value);
      case BIN:
        return Utility.uintToBinGroup(value, 16, prefs.binaryStringGroupLength);
      default:
        return 'Invalid output type.';
    }
  }

  function repopulateOutputLog() {
    while (outputLog.firstChild) {
      outputLog.removeChild(outputLog.firstChild);
    }

    for (let i = 0; i < outputList.length; i++) {
      outputLog.appendChild(document.createTextNode(convertOutput(outputList[i])));
      outputLog.appendChild(document.createElement('br'));
    }
  }

  function resetRegisters() {
    document.getElementById('ac').textContent = Utility.hex(sim.ac);
    document.getElementById('ir').textContent = Utility.hex(sim.ir);
    document.getElementById('mar').textContent = Utility.hex(sim.mar, 3);
    document.getElementById('mbr').textContent = Utility.hex(sim.mbr);
    document.getElementById('pc').textContent = Utility.hex(sim.pc, 3);
    document.getElementById('in').textContent = Utility.hex(sim.in);
    document.getElementById('out').textContent = Utility.hex(sim.out);

    datapath.setAllRegisters([Utility.hex(sim.mar, 3), Utility.hex(sim.pc, 3), Utility.hex(sim.mbr),
      Utility.hex(sim.ac), Utility.hex(sim.in), Utility.hex(sim.out), Utility.hex(sim.ir)]);

    $('.current-pc').removeClass('current-pc');
    $('.current-mar').removeClass('current-mar');
    $('.memory-changed').removeClass('memory-changed');
  }

  function initializeRegisterLog() {
    while (registerLog.firstChild) {
      registerLog.removeChild(registerLog.firstChild);
    }
  }

    // Event delegation
  registerLog.addEventListener('mouseover', (e) => {
    if (e.target && e.target.classList.contains('instruction-register-log') && e.target.dataset.currentLine) {
      const line = parseInt(e.target.dataset.currentLine, 10);

      if (!isNaN(line)) {
        if (currentInstructionLine !== undefined && currentInstructionLine !== null) {
          programCodeMirror.removeLineClass(currentInstructionLine - 1, 'background', 'highlighted-line');
        }

        programCodeMirror.addLineClass(line, 'background', 'highlighted-line');

        viewingInstruction = true;
      }
    }
  }, false);

  registerLog.addEventListener('mouseout', (e) => {
    if (e.target && e.target.classList.contains('instruction-register-log') && e.target.dataset.currentLine) {
      const line = parseInt(e.target.dataset.currentLine, 10);

      if (!isNaN(line)) {
        programCodeMirror.removeLineClass(line, 'background', 'highlighted-line');

        if (currentInstructionLine !== undefined && currentInstructionLine !== null) {
          programCodeMirror.addLineClass(currentInstructionLine - 1, 'background', 'highlighted-line');
        }

        viewingInstruction = false;
      }
    }
  }, false);

  function updateBottomDataAttr(e) {
    const target = e.target;

        // check if at the bottom
    const atBottom = target.clientHeight > 0.99 * (target.scrollHeight - target.scrollTop);

        // set the data attr based on if scrolled to the bottom or not
    if (atBottom) {
      target.setAttribute('data-stick-to-bottom', 'true');
    } else {
      target.setAttribute('data-stick-to-bottom', 'false');
    }
  }

    // update if should stick to the bottom for Output log
  outputLog.addEventListener('scroll', updateBottomDataAttr);

    // update if should stick to the bottom for RTL log
  registerLogOuter.addEventListener('scroll', updateBottomDataAttr);

  function scrollToBottom(e) {
        // get the tab content (not the tab link)
    const tabContent = document.querySelector(e.target.getAttribute('href'));
        // get the stick to bottom attr
    const shouldScrollToBottomRegisterLog = tabContent.getAttribute('data-stick-to-bottom') === 'true';

        // scroll to the bottom if it should
    if (shouldScrollToBottomRegisterLog) {
      tabContent.scrollTop = tabContent.scrollHeight;
    }
  }

    // Stick to the bottom for Output Log
  $(outputLogTab).on('shown.bs.tab', scrollToBottom);
    // Stick to the bottom for Register Log
  $(registerLogTab).on('shown.bs.tab', scrollToBottom);

  function updateCurrentLine(clear) {
    if (lastCurrentLine !== null) {
      programCodeMirror.removeLineClass(lastCurrentLine, 'background', 'next-instruction');
      lastCurrentLine = null;
    }

    if (lastBreakPointLine !== null) {
      programCodeMirror.removeLineClass(lastBreakPointLine, 'background', 'active-break-point');
      lastBreakPointLine = null;
    }

    if (clear) {
            /* Remove background line classes from all lines to ensure that no
            line has any highlighting. Perhaps there is a better of doing this,
            but please note that the user may have changed some code, thus
            the last line variables may not point to the lines that still have
            highlighting. */

      const numOfLines = programCodeMirror.lineCount();

      for (let i = 1; i <= numOfLines; i += 1) {
        programCodeMirror.removeLineClass(i, 'background', 'active-break-point');
        programCodeMirror.removeLineClass(i, 'background', 'next-instruction');
        programCodeMirror.removeLineClass(i, 'background', 'highlighted-line');
      }

      return;
    }

    const current = sim.current();
    let line = current ? current.line : null;

    if (line !== undefined && line !== null) {
      line -= 1; // compensate for zero based lines
      programCodeMirror.addLineClass(line, 'background', 'next-instruction');
      lastCurrentLine = line;
      const info = programCodeMirror.lineInfo(line);
      if (info.gutterMarkers) {
        programCodeMirror.addLineClass(line, 'background', 'active-break-point');
        lastBreakPointLine = line;
        breaking = true;
      }
    }
  }

  function updateCurrentInstructionLine() {
    if (!viewingInstruction && currentInstructionLine !== undefined
      && currentInstructionLine !== null) {
      programCodeMirror.removeLineClass(currentInstructionLine - 1, 'background', 'highlighted-line');
    }

    const current = sim.current();
    currentInstructionLine = current ? current.line : null;

    if (!viewingInstruction && currentInstructionLine !== undefined
      && currentInstructionLine !== null) {
      programCodeMirror.addLineClass(currentInstructionLine - 1, 'background', 'highlighted-line');
    }
  }

  function initializeOutputLog() {
    while (outputLog.firstChild) {
      outputLog.removeChild(outputLog.firstChild);
    }
    outputList = [];
  }

  $('#input-dialog').on('shown.bs.modal', () => {
    $('#input-value').val('').focus();
  });

  const placeInputDialog = document.createElement('div');
  placeInputDialog.id = 'place-input-dialog';
  document.body.appendChild(placeInputDialog);

  $('#input-dialog').popoverX({
    show: false,
    keyboard: false,
    $target: $('#place-input-dialog'),
    placement: 'left',
    closeOtherPopovers: false,
    useOffsetForPos: false,
  });

  $('#input-value').keypress((e) => {
    if (e.which === 13) {
      $('#input-dialog').popoverX('hide');
    }
  });

  function finishInput(output) {
    const type = $('#input-type').val();
    let value = $('#input-value').val().split(' ').join('');

    switch (type) {
      case ('HEX'):
        value = parseInt(value, 16);
        break;
      case ('DEC'):
        value = parseInt(value, 10);
        break;
      case ('UNICODE'):
        value = value.charCodeAt(0);
        break;
      case ('BIN'):
        value = parseInt(value, 2);
        break;
    }

    if (!isNaN(value)) {
      $('#input-dialog').on('hidden.bs.modal', () => {
        output(value);
        runLoop(microStepping);
        stopWaiting();
      });
      $('#input-dialog').popoverX('hide');
    } else {
      $('#input-error').show({
        step() {
          $('#input-dialog').popoverX('refreshPosition');
        },
      });
    }
  }

  function inputFunc(output) {
    startWaiting();

    $('#input-error').hide();

    $('#input-dialog').popoverX('show');

    $('#input-dialog').off('hidden.bs.modal');
    $('#input-button').off('click');
    $('#input-button-pause').off('click');
    $('#input-value').off('keypress');

    $('#input-value').on('keypress', (e) => {
      if (e.which === 13) {
        finishInput(output);
      }
    });

    $('#input-button').on('click', () => {
      finishInput(output);
    });

    $('#input-pause-button').on('click', () => {
      stopWaiting();
      stop(true);
      setStatus('Halted at user request.');
      runButton.textContent = 'Continue';
      running = false;
      $('#input-dialog').popoverX('hide');
      pausedOnInput = true;
      savedOutput = output;
    });
  }

  function outputFunc(value) {
    const shouldScrollToBottomOutputLog = outputLog.getAttribute('data-stick-to-bottom') === 'true';

    outputList.push(value);

    outputLog.appendChild(document.createTextNode(convertOutput(value)));
    outputLog.appendChild(document.createElement('br'));

    if (shouldScrollToBottomOutputLog) {
      outputLog.scrollTop = outputLog.scrollHeight;
    }
  }

  function setStatus(message, error) {
    statusInfo.textContent = message;

    if (error) {
      statusInfo.className = 'error';
      $('#datapath-status-bar').removeClass('alert-info alert-warning').addClass('alert-danger').text(message);
    } else {
      statusInfo.className = '';

      $('#datapath-status-bar').removeClass('alert-danger');

      if (!$('#datapath-status-bar').hasClass('alert-warning')) {
        $('#datapath-status-bar').addClass('alert-info');
      }

      if ($('#datapath-status-bar').hasClass('alert-info')) {
        $('#datapath-status-bar').text(message);
      }
    }
  }

  function regLogFunc(message, aluType, notAnRTL) {
    if (!running || delay >= prefs.minDatapathDelay) {
      datapath.appendMicroInstruction(message);
      datapath.setALUBus(aluType);
    }

    const shouldScrollToBottomRegisterLog = registerLog.getAttribute('data-stick-to-bottom') === 'true';

    if (notAnRTL) {
      currentInstructionRegisterLog.classList.add('finished-instruction');
      registerLog.appendChild(document.createTextNode(message));
      registerLog.appendChild(document.createElement('br'));
    } else {
      currentInstructionRegisterLog.appendChild(document.createTextNode(message));
      currentInstructionRegisterLog.appendChild(document.createElement('br'));
    }

    if (shouldScrollToBottomRegisterLog) {
      registerLog.scrollTop = registerLogOuter.scrollHeight;
    }
  }

  function startWaiting() {
    if (interval) {
      window.clearInterval(interval);
      interval = null;
    }
    waiting = true;
    assembleButton.disabled = true;
    stepButton.disabled = true;
    stepBackButton.disabled = true;
    microStepButton.disabled = true;
    restartButton.disabled = true;
  }

  function stopWaiting() {
    waiting = false;
    assembleButton.disabled = false;
    restartButton.disabled = false;
    stepButton.disabled = false;
    stepBackButton.disabled = false;
    microStepButton.disabled = false;
    if (running) {
      run();
    }
  }

  function stop(pause) {
    if (waiting) {
      return;
    }

    if (interval) {
      window.clearInterval(interval);
      interval = null;
    }
    if (pause) {
      stepButton.disabled = false;
      microStepButton.disabled = false;
    } else {
      runButton.disabled = true;
      stepButton.disabled = true;
      microStepButton.disabled = true;
    }
  }

  function run() {
    if (waiting) {
      return;
    }

    if (interval) {
      window.clearInterval(interval);
    }

            // Don't pass in setInterval callback arguments into runLoop function.
    interval = window.setInterval(() => {
      runLoop();
    }, delay);

    runButton.textContent = 'Pause';
    runButton.disabled = false;
    stepButton.disabled = true;
    stepBackButton.disabled = true;
    microStepButton.disabled = true;
    setStatus('Running...');
  }

  function datapathWarning(showWarning) {
    if ($('#datapath-status-bar').hasClass('alert-danger')) {
      return;
    }

    if (showWarning) {
      $('#datapath-status-bar').removeClass('alert-info').addClass('alert-warning').html('<strong> Note: </strong> Delay is set too low for datapath to update. Increase delay to at least ' + prefs.minDatapathDelay.toString() + ' ms, or set simulator to stepping mode.');
      datapath.restart();
    } else {
      $('#datapath-status-bar').removeClass('alert-warning').addClass('alert-info').text(statusInfo.textContent);
      if (sim) {
        datapath.setAllRegisters([Utility.hex(sim.mar, 3), Utility.hex(sim.pc, 3),
          Utility.hex(sim.mbr), Utility.hex(sim.ac), Utility.hex(sim.in),
          Utility.hex(sim.out), Utility.hex(sim.ir)]);
        datapath.showInstruction();
      }
    }
  }

  function runLoop(micro) {
    microStepping = micro;

    let step = true;

    try {
      if (micro) {
        step = sim.microStep() === 'step';
      } else {
        sim.step();
      }
    } catch (e) {
      // prevents catastrophic failure if an error occurs
      // (whether it is MARIE or some other JavaScript error)
      setStatus(e.toString(), true);

      stepBackButton.disabled = true;

      stop();
      runButton.textContent = 'Halted';
      throw e;
    }

    updateCurrentLine();

    stepBackButton.disabled = false;

    if (sim.halted) {
      stop();
      runButton.textContent = 'Halted';
      setStatus('Machine halted normally.');
    } else if (breaking) {
      stop(true);
      running = false;

      datapathWarning(false);

      runButton.textContent = 'Continue';
      setStatus('Machine paused at break point.');
    } else {
      return step;
    }
  }



  assembleButton.addEventListener('click', () => {
    assembleButton.textContent = 'Assembling...';
    assembleButton.disabled = true;
    setStatus('Assembling...', false);

    setTimeout(() => {
      stop();
      running = false;

      datapathWarning(false);

      savedOutput = null;
      pausedOnInput = false;

      if (lastErrorLine !== null) {
        programCodeMirror.removeLineClass(lastErrorLine, 'background', 'error-line');
        lastErrorLine = null;
      }

      const assembler = new MarieAsm(programCodeMirror.getValue());

      try {
        asm = assembler.assemble();
      } catch (e) {
        setStatus(e.toString(), true);
        lastErrorLine = e.lineNumber - 1;
        programCodeMirror.addLineClass(lastErrorLine, 'background', 'error-line');
        assembleButton.innerHTML = "<span class='fa fa-th'></span> Assemble";
        assembleButton.disabled = false;
        throw e;
      }

      try {
        sim = new MarieSim(asm, inputFunc, outputFunc);
      } catch (e) {
        setStatus(e.message, true);
        assembleButton.innerHTML = "<span class='fa fa-th'></span> Assemble";
        assembleButton.disabled = false;
        throw e;
      }

      datapath.attachSimulator(sim);

      sim.setEventListener('regread', (e) => {
        if (!running || delay >= prefs.minDatapathDelay) {
          datapath.setControlBus(e.register, 'read');

          datapath.showDataBusAccess(false, running ? delay / 2 : 1000);
        }
      });

      sim.setEventListener('regwrite', (e) => {
        document.getElementById(e.register).textContent = Utility.hex(e.newValue, e.register === 'mar' || e.register === 'pc' ? 3 : 4);

        if (!running || delay >= prefs.minDatapathDelay) {
          datapath.setRegister(e.register, Utility.hex(e.newValue, e.register === 'mar' || e.register === 'pc' ? 3 : 4));
          datapath.setControlBus(e.register, 'write');

          datapath.showDataBusAccess(false, running ? delay / 2 : 1000);
        }

        if (e.register === 'pc') {
          if (e.oldValue >= 0 && e.oldValue <= 4095) {
            document.getElementById('cell' + e.oldValue.toString()).classList.remove('current-pc');
          } else {
            console.warn('Address', e.oldValue, 'for PC is out of bounds, and consequently it cannot update the memory view.');
          }

          if (e.newValue >= 0 && e.newValue <= 4095) {
            document.getElementById('cell' + e.newValue).classList.add('current-pc');
          } else {
            console.warn('Address', e.newValue, 'for PC is out of bounds, and consequently it cannot update the memory view.');
          }
        }

        if (e.register == 'mar') {
          if (0 <= e.oldValue && e.oldValue <= 4095) {
            document.getElementById('cell' + e.oldValue).classList.remove('current-mar');
          } else {
            console.warn('Address', e.oldValue, 'for MAR is out of bounds, and consequently it cannot update the memory view.');
          }

          if (0 <= e.newValue && e.newValue <= 4095) {
            document.getElementById('cell' + e.newValue).classList.add('current-mar');
          } else {
            console.warn('Address', e.newValue, 'for MAR is out of bounds, and consequently it cannot update the memory view.');
          }
        }
      });

      populateMemoryView(sim);
      symbolCells = populateWatchList(asm, sim);
      initializeOutputLog();
      initializeRegisterLog();
      resetRegisters();

      sim.setEventListener('memread', () => {
        if (!running || delay >= prefs.minDatapathDelay) {
          datapath.setControlBus('memory', 'read');
          datapath.showDataBusAccess(true, running ? delay / 2 : 1000);
        }
      });

      sim.setEventListener('memwrite', (e) => {
        if (!running || delay >= prefs.minDatapathDelay) {
          datapath.setControlBus('memory', 'write');
          datapath.showDataBusAccess(true, running ? delay / 2 : 1000);
        }
        const val = 'cell' + $(e.address);
        const cell = document.getElementById(val);
        cell.textContent = Utility.hex(e.newCell.contents, false);
        cell.classList.add('memory-changed');

        for (const address in symbolCells) {
          if (address === e.address) {
            symbolCells[address].textContent = Utility.hex(e.newCell.contents);
          }
        }
      });

      sim.setEventListener('newinstruction', () => {
        if (!running || delay >= prefs.minDatapathDelay) {
          datapath.showInstruction();
        }

        updateCurrentInstructionLine();

        if (currentInstructionRegisterLog) {
          currentInstructionRegisterLog.classList.add('finished-instruction');
        }

        const currentInstruction = sim.memory[sim.pc];

        currentInstructionRegisterLog = document.createElement('div');
        currentInstructionRegisterLog.classList.add('instruction-register-log');

        if (currentInstruction && typeof currentInstruction.line !== 'undefined') {
          currentInstructionRegisterLog.dataset.currentLine = currentInstruction.line - 1;
        }

        registerLog.appendChild(currentInstructionRegisterLog);
      });

      sim.setEventListener('reglog', regLogFunc);
      sim.setEventListener('decode', () => {
        datapath.setALUBus('decode');
      });

      stepButton.disabled = false;
      microStepButton.disabled = false;
      stepBackButton.disabled = true;
      runButton.disabled = false;
      runButton.textContent = 'Run';
      restartButton.disabled = false;

      setStatus('Assembled successfully', false);
      assembleButton.innerHTML = "<span class='fa fa-th'></span> Assemble";
      assembleButton.disabled = false;

      updateCurrentLine(true);
    }, 1);
  });

  stepButton.addEventListener('click', () => {
    runLoop();

    if (!sim.halted) {
      setStatus('Performed one step');
    }
  });

  stepBackButton.addEventListener('click', () => {
    if (pausedOnInput) {
      savedOutput = null;
      pausedOnInput = false;
    }

    let action = sim.stateHistory[sim.stateHistory.length - 1];
    if (action.type != 'step')
      sim.step();
    sim.stateHistory.pop();
    action = sim.stateHistory.pop();

    if (sim.stateHistory.length > 0) {
      setStatus('Stepped backwards one step');
    }

    while (action.type != 'step' && sim.stateHistory.length > 0) {
      switch (action.type) {
        case 'regread':
          datapath.setControlBus(action.register, 'read');
          datapath.showDataBusAccess(false, 1000);
          datapath.setALUBus(action.aluType);
          break;
        case 'regwrite':
          var oldValue = sim[action.register],
            newValue = action.value;
          sim[action.register] = newValue;

          datapath.showDataBusAccess(false, 1000);

          datapath.setControlBus(action.register, 'write');
          datapath.setRegister(action.register, Utility.hex(newValue, action.register == 'mar' || action.register == 'pc' ? 3 : 4));

          document.getElementById(action.register).textContent = Utility.hex(newValue, action.register == 'mar' || action.register == 'pc' ? 3 : 4);
          if (action.register == 'pc') {
            document.getElementById('cell' + oldValue).classList.remove('current-pc');
            document.getElementById('cell' + newValue).classList.add('current-pc');
          }

          if (action.register == 'mar') {
            document.getElementById('cell' + oldValue).classList.remove('current-mar');
            document.getElementById('cell' + newValue).classList.add('current-mar');
          }
          break;
        case 'memread':
          datapath.showDataBusAccess(true, 1000);
          break;
        case 'memwrite':
          datapath.showDataBusAccess(true, 1000);

          sim.memory[action.address].contents = action.value;
          var cell = document.getElementById('cell' + action.address);
          cell.textContent = Utility.hex(action.value, false);
          for (const address in symbolCells) {
            if (address == action.address) {
              symbolCells[address].textContent = Utility.hex(action.value);
            }
          }
          break;
        case 'output':
          outputList.pop();
          repopulateOutputLog();
          break;
        case 'decode':
          if (action.opcode)
            sim.opcode = action.opcode;
          break;
        case 'halt':
          sim.halted = false;
          running = false;
          runButton.textContent = 'Run';
          runButton.disabled = false;
          stepButton.disabled = false;
          microStepButton.disabled = false;
          break;
      }
      action = sim.stateHistory.pop();
    }

    if (sim.stateHistory.length === 0) {
      stepBackButton.disabled = true;
    }
    else {
      sim.stateHistory.push({ type: 'step' });
    }

    datapath.showInstruction();
    regLogFunc('----- stepped back -----', null, true);
    updateCurrentLine();
    updateCurrentInstructionLine();
  });

  microStepButton.addEventListener('click', () => {
    const step = runLoop(true);

    if (!sim.halted) {
      if (step) {
        setStatus('Completed instruction. Click Microstep to proceed to the next one.');
      } else {
        setStatus('Performed one micro-step');
      }
    }
  });

  runButton.addEventListener('click', () => {
    if (running) {
      stop(true);

      datapathWarning(false);

      setStatus('Halted at user request.');
      runButton.textContent = 'Continue';
      running = false;
    }
    else {
      breaking = false;
      run();
      runButton.textContent = 'Pause';
      running = true;

      if (pausedOnInput) {
        pausedOnInput = false;
        inputFunc(savedOutput);
      }

      if (delay < prefs.minDatapathDelay) {
        datapathWarning(true);
      }
    }
  });

  rangeDelay.addEventListener('input', function () {
    displayDelayMs.textContent = this.value + ' ms';
  });

  function updateRangeDelay() {
    delay = parseInt(rangeDelay.value);
    displayDelayMs.textContent = delay + ' ms';

    datapathWarning(running && delay < prefs.minDatapathDelay);

    if (interval) {
      run();
    }
  }
  getPrefs();
  rangeDelay.addEventListener('change', updateRangeDelay);

  restartButton.addEventListener('click', () => {
    stop();
    running = false;
    sim.restart();
    resetRegisters();
    updateCurrentLine(true);
    runButton.textContent = 'Run';
    runButton.disabled = false;
    stepButton.disabled = false;
    stepBackButton.disabled = true;
    microStepButton.disabled = false;
    datapathWarning(false);
    datapath.restart();
    savedOutput = null;
    pausedOnInput = false;
    setStatus('Restarted simulator (memory contents are still preserved)');
  });

  outputSelect.addEventListener('change', function () {
    outputType = this.selectedIndex;
    repopulateOutputLog();
  });

  window.addEventListener('resize', () => {
    handleDatapathUI();
  }, false);



  $(window).bind('keydown', (event) => {
    if (event.ctrlKey || event.metaKey) {
      switch (String.fromCharCode(event.which).toLowerCase()) {
        case 's':
          event.preventDefault();
          saveFile();
          break;
      }
    }
  });

  $('#save').on('click', () => {
    saveFile();
  });

  window.onbeforeunload = function () {
    if (prefs.autosave) {
      saveFile();
    }
    else if (modifiedFile) {
      return 'You have unsaved changes and autosave is off. Do you want to leave MARIE.js?';
    }
    return;
  };

  uploadButton.addEventListener('click', () => {
    fileInput.click();
  });

  $('#undo').click(() => {
	                                                                                                                                                                      programCodeMirror.undo();
  });

  $('#redo').click(() => {
    programCodeMirror.redo();
  });

  $('#prefs').click(() => {
    changedInputMode = false;
    changedOutputMode = false;

    $('#save-changes').prop('disabled', true);
    $('#prefs-invalid-input-error').hide();
    $('#autocomplete').prop('checked', prefs.autocomplete);
    $('#autosave').prop('checked', prefs.autosave);

    $('#min-delay').val(prefs.minDelay);
    $('#max-delay').val(prefs.maxDelay);
    $('#min-datapath-delay').val(prefs.minDatapathDelay);
    $('#bstringLength').val(prefs.binaryStringGroupLength);
    $('#defaultInputModeSelect').val(prefs.defaultInputMode);
    $('#defaultOutputModeSelect').val(prefs.defaultOutputMode);
    $('#prefs-modal').modal('show');
  });

  $('#min-delay, #max-delay, #min-datapath-delay').off();

  $('#min-delay, #max-delay, #min-datapath-delay').on('input', () => {
    $('#save-changes').prop('disabled', false);
  });

  $('#autocomplete, #autosave').off();

  $('#autocomplete, #autosave').on('change', () => {
    $('#save-changes').prop('disabled', false);
  });

  $('#bstringLength, #defaultOutputModeSelect, #defaultInputModeSelect').change((e) => {
    $('#save-changes').prop('disabled', false);

    const target = $(e.target);

    if (target.is('#defaultInputModeSelect')) {
      changedInputMode = true;
    } else if (target.is('#defaultOutputModeSelect')) {
      changedOutputMode = true;
    }
  });

  $('#save-changes').click(() => {
    let autocomplete = $('#autocomplete').prop('checked');
      autosave = $('#autosave').prop('checked');

    const minDelay = parseInt($('#min-delay').val());
    const maxDelay = parseInt($('#max-delay').val());
    const stringLength = parseInt($('#bstringLength').val());
    const defaultInputMode = $('#defaultInputModeSelect').val();
    const defaultOutputMode = $('#defaultOutputModeSelect').val();
    if (isNaN(minDelay) || isNaN(maxDelay) || minDelay >= maxDelay || minDelay < 0 || maxDelay < 0) {
      $('#prefs-invalid-input-error').show();
      return;
    }

    const minDatapathDelay = parseInt($('#min-datapath-delay').val());

    if (isNaN(minDatapathDelay) || minDatapathDelay < 0) {
      $('#prefs-invalid-input-error').show();
      return;
    }

    prefs.autocomplete = autocomplete;
    prefs.autosave = autosave;
    prefs.minDelay = minDelay;
    prefs.maxDelay = maxDelay;
    prefs.minDatapathDelay = minDatapathDelay;
    prefs.binaryStringGroupLength = stringLength;
    prefs.defaultInputMode = defaultInputMode;
    prefs.defaultOutputMode = defaultOutputMode;
    setPrefs();

    $('#prefs-modal').modal('hide');
  });

  $('#set-to-defaults').click(() => {
    prefs = $.extend(defaultPrefs);
    setPrefs();
  });

  $('#download').click(() => {
    $('#dFileModal').modal('show');
  });

  $('#downloadbtn').click(() => {
    const text = programCodeMirror.getValue();
    const filename = $('#name').val();
    const fileType = $('#downloadMode option:selected').val();

    let extension = '';

    if (fileType === 'mas') {
      extension = '.mas';
    }
    else if (fileType === 'txt') {
      extension = '.txt';
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, filename + extension);
  });

  $('#newfilebtn').click(() => {
    newfile();
  });

  $('#clear').click(() => {
    $('#newfoldermodal').modal('show');
  });

  $('#cnclnewfile').click(() => {
    $('#newfoldermodal').modal('hide');
  });

  $('#exportfile').click(() => {
    const text = programCodeMirror.getValue();
    const filename = 'code';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, filename + '.mas');
  });

  $('#fileInput').change(() => {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function () {
      programCodeMirror.setValue(reader.result);
    };
    reader.readAsText(file);
  });

  $('#dpath-menu').click(() => {
    if (window.location.hash === '#datapath') {
      window.location.hash = '';
    } else {
      window.location.hash = '#datapath';
    }
  });

  $('#close-datapath').click(() => {
    window.location.hash = '';
  });

    // readCode() does a GET request for the the file based on the URL
  function readCode() {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status == 200) {
          loadContents(xhr.responseText, xhr);
          console.log('File Sucessfully Loaded');
        }
        else if (xhr.status == 404) {
          $('#warn-missing-file').show();
        }
      }
    };
    xhr.open('GET', fileAddress, true);
    xhr.send();
  }
  $('#warn-missing-file').hide();

    // loadContents() works in conjunction with readCode(); if the server responds with a Code 200
  function loadContents(responseText) {
    programCodeMirror.setValue(responseText);
  }

  if (queryString !== '') {
    var fileAddress = './code/' + queryString + '.mas';
    console.log('Loading from' + fileAddress);
    programCodeMirror.setValue('');
    readCode();
  }

  $('#clearBreakPoints').click(() => {
    clearGutters();
  });

  function handleDatapathUI() {
    if (window.location.hash === '#datapath') {
      if (!datapath.loaded) {
        console.warn('DataPath SVG object has not loaded yet.');

        datapath.onLoad = function () {
          handleDatapathUI();
        };
        return;
      }

      $('#datapath-tick').show();

      const dpBoundingRect = datapath.datapath.getBoundingClientRect();
      const boundingRect = datapath.datapath.contentDocument
                                                .getElementById('in_register')
                                                .getBoundingClientRect();
      $('#place-input-dialog').css({
        top: dpBoundingRect.top + boundingRect.top,
        left: dpBoundingRect.left + boundingRect.left,
        width: boundingRect.width,
        height: boundingRect.height,
      });
    } else {
      const inBoundingRect = document.getElementById('in').getBoundingClientRect();

      $('#datapath-tick').hide();
      $('#place-input-dialog').css({
        top: inBoundingRect.top,
        left: inBoundingRect.left,
        width: inBoundingRect.width,
        height: inBoundingRect.height,
      });
    }

    $('#input-dialog').popoverX('refreshPosition');
  }

  handleDatapathUI();

  $(window).on('hashchange', () => {
    handleDatapathUI();
  });

  $('body').removeClass('preload');


  $('#submitToU').click(() => {
    localStorage.setItem('tosAgreed', 1);
    $('#tosModal').modal('hide');
  });
});

$(document).ready(() => {
  if (localStorage.getItem('tosAgreed') === null || localStorage.getItem('tosAgreed') === 0) {
    $('#tosModal').modal('show');
  }
});

// enabling bootstrap-tooltip
$(document).ready(() => {
  $('[data-toggle="tooltip"]').tooltip();
});
