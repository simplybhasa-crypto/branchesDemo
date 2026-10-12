const ANSWERS = [
  'APPLE', 'BRAVE', 'CLOUD', 'DREAM', 'EARTH', 'FLAME', 'GRAPE', 'HEART', 'IVORY', 'JUICE',
  'KNACK', 'LEMON', 'MANGO', 'NORTH', 'OCEAN', 'PIANO', 'QUIET', 'ROBIN', 'SHINE', 'TRAIL',
  'UNITY', 'VIVID', 'WATER', 'YOUTH', 'ZEBRA', 'ALERT', 'BLOOM', 'CHARM', 'DANCE', 'ELBOW',
  'FAITH', 'GIANT', 'HONEY', 'IMAGE', 'JOLLY', 'KOALA', 'LUCKY', 'MIRTH', 'NOBLE', 'OLIVE',
  'PEACH', 'QUILT', 'RADIO', 'STORM', 'TULIP', 'URBAN', 'VOICE', 'WHALE', 'YEARN', 'ZESTY',
  'ABOVE', 'BERRY', 'CRISP', 'DELTA', 'ENJOY', 'FROST', 'GLOWY', 'HUMAN', 'IDEAL', 'JOKER',
];
const ROWS = 5;
const WORD_LENGTH = 5;
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const KEY_STATES = { absent: 1, present: 2, correct: 3 };

const board = document.querySelector('#board');
const keyboard = document.querySelector('#keyboard');
const message = document.querySelector('#message');
const dateDisplay = document.querySelector('#date-display');
const todayLabel = document.querySelector('#today-label');

const today = new Date();
const dayNumber = Math.floor(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) / 86400000);
const answer = ANSWERS[((dayNumber % ANSWERS.length) + ANSWERS.length) % ANSWERS.length];
let guesses = [];
let currentGuess = '';
let finished = false;
const keyElements = new Map();

dateDisplay.textContent = today.toLocaleDateString('en', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
todayLabel.textContent = `TODAY'S PUZZLE / ${dateDisplay.textContent}`;

for (let row = 0; row < ROWS; row += 1) {
  for (let column = 0; column < WORD_LENGTH; column += 1) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.setAttribute('role', 'gridcell');
    tile.setAttribute('aria-label', `Guess ${row + 1}, letter ${column + 1}`);
    board.append(tile);
  }
}

for (const [rowIndex, letters] of KEY_ROWS.entries()) {
  const row = document.createElement('div');
  row.className = 'key-row';
  if (rowIndex === KEY_ROWS.length - 1) addKey(row, 'ENTER', 'wide', submitGuess);
  for (const letter of letters) addKey(row, letter, '', () => addLetter(letter));
  if (rowIndex === KEY_ROWS.length - 1) addKey(row, '⌫', 'wide', removeLetter);
  keyboard.append(row);
}

function addKey(row, label, extraClass, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `key ${extraClass}`.trim();
  button.textContent = label;
  button.setAttribute('aria-label', label === '⌫' ? 'Backspace' : label);
  button.addEventListener('click', action);
  row.append(button);
  if (label.length === 1) keyElements.set(label, button);
}

function renderCurrentGuess() {
  const tiles = board.querySelectorAll('.tile');
  for (let column = 0; column < WORD_LENGTH; column += 1) {
    const tile = tiles[guesses.length * WORD_LENGTH + column];
    tile.textContent = currentGuess[column] || '';
    tile.classList.toggle('filled', Boolean(currentGuess[column]));
  }
}

function addLetter(letter) {
  if (finished || currentGuess.length >= WORD_LENGTH) return;
  currentGuess += letter;
  renderCurrentGuess();
  message.textContent = 'Type a five-letter word to begin.';
  message.classList.remove('is-result');
}

function removeLetter() {
  if (finished || currentGuess.length === 0) return;
  currentGuess = currentGuess.slice(0, -1);
  renderCurrentGuess();
}

function scoreGuess(guess) {
  const result = Array(WORD_LENGTH).fill('absent');
  const remaining = answer.split('');

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = 'correct';
      remaining[index] = null;
    }
  }
  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (result[index] === 'correct') continue;
    const matchIndex = remaining.indexOf(guess[index]);
    if (matchIndex !== -1) {
      result[index] = 'present';
      remaining[matchIndex] = null;
    }
  }
  return result;
}

function submitGuess() {
  if (finished) return;
  if (currentGuess.length !== WORD_LENGTH) {
    message.textContent = 'Your guess needs five letters.';
    return;
  }

  const result = scoreGuess(currentGuess);
  const rowIndex = guesses.length;
  const tiles = board.querySelectorAll('.tile');
  for (let column = 0; column < WORD_LENGTH; column += 1) {
    const tile = tiles[rowIndex * WORD_LENGTH + column];
    tile.classList.add(result[column], 'reveal');
    tile.setAttribute('aria-label', `Guess ${rowIndex + 1}, ${currentGuess[column]}, ${result[column]}`);
    const key = keyElements.get(currentGuess[column]);
    const nextState = result[column];
    const currentState = [...key.classList].find((name) => KEY_STATES[name]);
    if (!currentState || KEY_STATES[nextState] > KEY_STATES[currentState]) {
      key.classList.remove('absent', 'present', 'correct');
      key.classList.add(nextState);
    }
  }

  guesses.push(currentGuess);
  const won = currentGuess === answer;
  currentGuess = '';
  if (won) finish(`You got it in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}!`);
  else if (guesses.length === ROWS) finish(`Today's word was ${answer}.`);
  else message.textContent = `${ROWS - guesses.length} ${ROWS - guesses.length === 1 ? 'guess' : 'guesses'} left. Keep going.`;
}

function finish(result) {
  finished = true;
  message.textContent = result;
  message.classList.add('is-result');
  keyboard.querySelectorAll('button').forEach((button) => { button.disabled = true; });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') submitGuess();
  else if (event.key === 'Backspace') removeLetter();
  else if (/^[a-z]$/i.test(event.key)) addLetter(event.key.toUpperCase());
});