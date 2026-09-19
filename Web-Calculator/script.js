// State variables
let currentOperand = '0';
let previousOperand = '';
let selectedOperator = null;
let resetScreenOnNextInput = false;
let historyData = [];

// DOM Elements
const currentOperandText = document.getElementById('current-operand');
const previousOperandText = document.getElementById('previous-operand');
const numberButtons = document.querySelectorAll('[data-number]');
const operatorButtons = document.querySelectorAll('[data-operator]');
const clearButton = document.querySelector('[data-action="clear"]');
const deleteButton = document.querySelector('[data-action="delete"]');
const equalsButton = document.querySelector('[data-action="calculate"]');

// History Elements
const historyToggleBtn = document.getElementById('history-toggle');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// Map operator codes to readable symbols
const operatorDisplaySymbols = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷'
};

/**
 * Updates the screen display
 */
function updateDisplay() {
  currentOperandText.textContent = currentOperand;

  if (selectedOperator !== null && previousOperand !== '') {
    const symbol = operatorDisplaySymbols[selectedOperator] || selectedOperator;
    previousOperandText.textContent = `${previousOperand} ${symbol}`;
  } else {
    previousOperandText.textContent = '';
  }
}

/**
 * Resets calculator state
 */
function clearAll() {
  currentOperand = '0';
  previousOperand = '';
  selectedOperator = null;
  resetScreenOnNextInput = false;
  updateDisplay();
}

/**
 * Deletes the last digit
 */
function deleteLastDigit() {
  if (currentOperand === 'Error') {
    clearAll();
    return;
  }
  
  if (resetScreenOnNextInput) return;

  if (currentOperand.length === 1 || (currentOperand.length === 2 && currentOperand.startsWith('-'))) {
    currentOperand = '0';
  } else {
    currentOperand = currentOperand.slice(0, -1);
  }
  updateDisplay();
}

/**
 * Appends a digit or decimal point
 */
function appendNumber(number) {
  if (currentOperand === 'Error') {
    clearAll();
  }

  if (resetScreenOnNextInput) {
    currentOperand = '';
    resetScreenOnNextInput = false;
  }

  if (number === '.' && currentOperand.includes('.')) return;

  if (currentOperand === '0' && number !== '.') {
    currentOperand = number;
  } else {
    currentOperand += number;
  }

  updateDisplay();
}

/**
 * Chooses an operation (+, -, *, /)
 */
function chooseOperator(operator) {
  if (currentOperand === 'Error') return;

  if (previousOperand !== '' && resetScreenOnNextInput) {
    selectedOperator = operator;
    updateDisplay();
    return;
  }

  if (previousOperand !== '') {
    computeResult();
    if (currentOperand === 'Error') return;
  }

  selectedOperator = operator;
  previousOperand = currentOperand;
  resetScreenOnNextInput = true;
  updateDisplay();
}

/**
 * Adds an item to calculation history
 */
function addToHistory(prev, operator, curr, result) {
  const symbol = operatorDisplaySymbols[operator] || operator;
  const historyItem = {
    calculation: `${prev} ${symbol} ${curr}`,
    result: result
  };
  historyData.unshift(historyItem); // Add to top
  renderHistory();
}

/**
 * Renders history list UI
 */
function renderHistory() {
  historyList.innerHTML = '';
  if (historyData.length === 0) {
    historyList.innerHTML = '<li class="history-empty">Koi history nahi hai abhi</li>';
    return;
  }

  historyData.forEach(item => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <span class="history-item-calc">${item.calculation} =</span>
      <span class="history-item-res">${item.result}</span>
    `;

    // Click on history item to recall result to calculator
    li.addEventListener('click', () => {
      currentOperand = item.result.toString();
      previousOperand = '';
      selectedOperator = null;
      resetScreenOnNextInput = true;
      updateDisplay();
      historyPanel.classList.add('hidden');
    });

    historyList.appendChild(li);
  });
}

/**
 * Evaluates the calculation
 */
function computeResult() {
  if (selectedOperator === null || previousOperand === '') return;

  const prev = parseFloat(previousOperand);
  const current = parseFloat(currentOperand);

  if (isNaN(prev) || isNaN(current)) return;

  let computation = 0;

  switch (selectedOperator) {
    case '+':
      computation = prev + current;
      break;
    case '-':
      computation = prev - current;
      break;
    case '*':
      computation = prev * current;
      break;
    case '/':
      if (current === 0) {
        currentOperand = 'Error';
        previousOperand = '';
        selectedOperator = null;
        resetScreenOnNextInput = true;
        updateDisplay();
        return;
      }
      computation = prev / current;
      break;
    default:
      return;
  }

  computation = Math.round((computation + Number.EPSILON) * 1000000000) / 1000000000;

  // Add successful calculation to history
  addToHistory(previousOperand, selectedOperator, currentOperand, computation);

  currentOperand = computation.toString();
  selectedOperator = null;
  previousOperand = '';
  resetScreenOnNextInput = true;
  updateDisplay();
}

// History Toggle and Clear
historyToggleBtn.addEventListener('click', () => {
  historyPanel.classList.toggle('hidden');
});

clearHistoryBtn.addEventListener('click', () => {
  historyData = [];
  renderHistory();
});

// Button Click Event Listeners
numberButtons.forEach(button => {
  button.addEventListener('click', () => {
    appendNumber(button.getAttribute('data-number'));
  });
});

operatorButtons.forEach(button => {
  button.addEventListener('click', () => {
    chooseOperator(button.getAttribute('data-operator'));
  });
});

equalsButton.addEventListener('click', computeResult);
clearButton.addEventListener('click', clearAll);
deleteButton.addEventListener('click', deleteLastDigit);

// Keyboard Event Listener
window.addEventListener('keydown', (event) => {
  const key = event.key;

  if ((key >= '0' && key <= '9') || key === '.') {
    appendNumber(key);
    triggerKeyFeedback(`[data-number="${key}"]`);
  }

  if (key === '+' || key === '-' || key === '*' || key === '/') {
    chooseOperator(key);
    triggerKeyFeedback(`[data-operator="${key}"]`);
  }

  if (key === 'Enter' || key === '=') {
    event.preventDefault();
    computeResult();
    triggerKeyFeedback('[data-action="calculate"]');
  }

  if (key === 'Escape') {
    if (!historyPanel.classList.contains('hidden')) {
      historyPanel.classList.add('hidden');
    } else {
      clearAll();
      triggerKeyFeedback('[data-action="clear"]');
    }
  }

  if (key === 'Backspace') {
    deleteLastDigit();
    triggerKeyFeedback('[data-action="delete"]');
  }
});

function triggerKeyFeedback(selector) {
  const button = document.querySelector(selector);
  if (button) {
    button.classList.add('active-key');
    setTimeout(() => {
      button.classList.remove('active-key');
    }, 120);
  }
}