'use strict';

window.onload = function() {
  init();
};

const storagePrefix = 'AlfaZulu-';

const letterMap = new Map();
letterMap.set('A', 'Alfa');
letterMap.set('B', 'Bravo');
letterMap.set('C', 'Charlie');
letterMap.set('D', 'Delta');
letterMap.set('E', 'Echo');
letterMap.set('F', 'Foxtrot');
letterMap.set('G', 'Golf');
letterMap.set('H', 'Hotel');
letterMap.set('I', 'India');
letterMap.set('J', 'Juliett');
letterMap.set('K', 'Kilo');
letterMap.set('L', 'Lima');
letterMap.set('M', 'Mike');
letterMap.set('N', 'November');
letterMap.set('O', 'Oscar');
letterMap.set('P', 'Papa');
letterMap.set('Q', 'Quebec');
letterMap.set('R', 'Romeo');
letterMap.set('S', 'Sierra');
letterMap.set('T', 'Tango');
letterMap.set('U', 'Uniform');
letterMap.set('V', 'Victor');
letterMap.set('W', 'Whiskey');
letterMap.set('X', 'X-ray');
letterMap.set('Y', 'Yankee');
letterMap.set('Z', 'Zulu');

letterMap.set(' ', '[space]');
letterMap.set('.', '[dot]');
letterMap.set(',', '[comma]');
letterMap.set('-', '[dash]');
letterMap.set('_', '[underscore]');
letterMap.set(';', '[semicolon]');
letterMap.set(':', '[colon]');
letterMap.set('&', '[ampersand]');
letterMap.set('@', '[at]');

// All the service worker initialization is in this block.

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(function(registration) {
            console.log('Registration successful, scope is:', registration.scope);
        })
        .catch(function(error) {
            console.log('Service worker registration failed, error:', error);
        });
}

// SpellingBox is the class to manipulate the DOM to render the
// sequence of code words with their corresponding letters.
class SpellingBox {
    #container = null;
    #table = null;
    #tableContainer = null;
    #quickView = null;

    constructor(container) {
        this.#container = container;
        this.#tableContainer = null;
        this.#table = null;
        this.#quickView = null;
    }

    clear() {
        if ( this.#table ) {
            this.#tableContainer.remove();
            this.#tableContainer = null;
            this.#table = null;
        }
        if ( this.#quickView ) {
            this.#quickView.remove();
            this.#quickView = null;
        }
    }

    addEntry(letter, codeWord) {
        if ( !this.#quickView ) {
            this.#quickView = document.createElement('div');
            this.#quickView.id = 'quick-view';
            this.#quickView.style.display = 'flex';
            this.#quickView.style.height = '2em';
            this.#quickView.style.minHeight = '2em';
            this.#quickView.style.alignItems = 'center';
            this.#quickView.style.fontFamily = 'monospace';
            this.#quickView.style.fontSize = '140%';
            this.#quickView.style.overflow = 'hidden';

            const pad = document.createElement('div');
            // If emtpy the scroll doesn't work properly because the element gets collapsed.
            pad.innerText = '=';
            pad.style.visibility = 'hidden';
            pad.style.minWidth = '50vw';
            this.#quickView.appendChild(pad);
            this.#quickView.appendChild(pad.cloneNode(true));

            this.#container.appendChild(this.#quickView);
        }
        if ( !this.#tableContainer ) {
            this.#tableContainer = document.createElement('div');
            this.#tableContainer.style.overflow = 'hidden';
            this.#tableContainer.style.padding = '5px'; // To leave some space for the shadow. TODO: move in the css.
            this.#container.appendChild(this.#tableContainer);

            this.#table = new Table();
            this.#tableContainer.appendChild(this.#table.domElement);
        }

        const l = document.createElement('span');
        this.#quickView.insertBefore(l, this.#quickView.lastChild);
        l.innerText = letter;
        this.#horizontalScroll(this.#quickView.querySelector('span'), this.#quickView);

        this.#table.addRow(letter, codeWord);
    }

    // highlightFirst highlights the 1st letter.
    //
    // returns: a boolean if there is something to highlight
    highlightFirst() {
        const rows = this.#tableContainer.querySelectorAll('tr')
        if ( rows.length == 0 ) {
            return false;
        }
        rows.forEach(r => r.classList.remove('highlighted'));
        rows[0].classList.add('highlighted');
        this.#verticalScroll(rows[0], this.#tableContainer);

        const letters = this.#quickView.querySelectorAll('span');
        letters.forEach(r => r.classList.remove('highlighted'));
        letters[0].classList.add('highlighted');
        this.#horizontalScroll(letters[0], this.#quickView);

        return true;
    }

    // moveHighlight moves the highlight one position by one.
    // If no highlight is present it is added on the 1st letter.
    //
    // Args:
    //  - moveNext: a boolean to define if we need to move to the next or the previous letter.
    // returns: a boolean if it could move.
    moveHighlight(moveNext) {
        const r = this.#moveSingleHighlight(moveNext, this.#tableContainer, this.#verticalScroll);
        if ( r === false ) {
            return this.highlightFirst();
        }
        if ( r === true ) {
            return false;
        }

        this.#moveSingleHighlight(moveNext, this.#quickView, this.#horizontalScroll);
        return true;
    }

    // return: true if the highlight cannot be moved (already at end or start)
    //         false if the highlight is not present
    //         the new dom highlighted otherwise
    #moveSingleHighlight(moveNext, container, scrollFn) {
        let curr = container.querySelector('.highlighted');
        if ( ! curr ) { // if there is no highligh, highligh the first.
            return false
        }
        const next = moveNext ? curr.nextElementSibling : curr.previousElementSibling;
        if ( ! next ) {
            return true;
        }
        curr.classList.remove('highlighted');
        next.classList.add('highlighted');

        scrollFn(next, container);

        return next
    }

    #verticalScroll(center, container) {
        // Keep it centered whenever it is possible.
        container.scrollTop = center.offsetTop - container.clientHeight / 2 + center.offsetHeight / 2;
    }

    #horizontalScroll(center, container) {
        // Keep it centered whenever it is possible.
        container.scrollLeft = center.offsetLeft - container.clientWidth / 2 + center.offsetWidth / 2;
    }
}

// Accordion is the DOM handling to make an accordion UI.
// Folding details are delegated to CSS, this class simply toggles a
// class to the titles and stores the status in the UR hash.
class Accordion {

    #allTitles = [];

    // Initializes the accordion. All the provided titles must have an ID.
    //
    // Args:
    //  - allTitles: an array of dom objects, one for each title of the accordion.
    constructor(allTitles) {
        this.#allTitles = allTitles;

        this.#allTitles.forEach( t => t.addEventListener('click', () => {
            for ( const title of this.#allTitles ) {
                if ( title == t ) {
                    title.classList.remove('collapsed');
                    history.replaceState(null, '', '#' + t.id);
                } else {
                    title.classList.add('collapsed');
                }
            }
        }));

        this.openCurrentHash();
        window.addEventListener("hashchange", () => this.openCurrentHash());

        // re-enable transitions on the next event cycle.
        setTimeout( () => document.body.classList.remove('no-transitions') );
    }

    openCurrentHash() {
        this.open(window.location.hash.substring(1));
    }

    open(id) {
        let toOpen = this.#allTitles[0];
        if ( id != '') {
            toOpen = this.#allTitles.find( t => t.id === id );
        }
        if ( toOpen === undefined ) {
            return false;
        }
        this.#allTitles.forEach( t => t.classList.add('collapsed') );
        toOpen.classList.toggle('collapsed');
        return true;
    }
}

class TouchDirectionDetector {
    #lastTouch = null;
    #callbacks = {
        left: () => console.log("touch moved left"),
        right: () => console.log("touch moved right"),
        up: () => console.log("touch moved up"),
        down: () => console.log("touch moved down"),
    };
    #triggerAt = 30;

    constructor(target, callbacks, triggerAt) {
        this.#callbacks = {...this.#callbacks, ...callbacks};

        if ( triggerAt ) {
            this.#triggerAt = triggerAt;
        }

        target.addEventListener('touchstart', e => {
            e.preventDefault();
            this.#lastTouch = e.touches[0];
        });

        target.addEventListener('touchmove', e => {
            e.preventDefault();

            const curr = e.touches[0];
            const dx = curr.clientX - this.#lastTouch.clientX;
            const dy = curr.clientY - this.#lastTouch.clientY;

            if ( Math.abs(dx) > this.#triggerAt ) {
                if ( dx > 0 ) {
                    this.#callbacks.left();
                } else {
                    this.#callbacks.right();
                }
            }

            if ( Math.abs(dy) > this.#triggerAt ) {
                if ( dy > 0 ) {
                    this.#callbacks.down();
                } else {
                    this.#callbacks.up();
                }
                this.#lastTouch = curr;
            }
        });
    }
}

class SavedWords {
    #savedWords = null;

    constructor() {
        const saved = JSON.parse(localStorage.getItem(`${storagePrefix}saved-words`));
        try {
            this.#savedWords = new Set(saved);
            // TODO add more validation.
        } catch(e) {
            console.log('error reading saved words:', e, saved)
            this.#savedWords = new Set();
        }
    }

    #save() {
        const s = JSON.stringify([...this.#savedWords]);
        localStorage.setItem(`${storagePrefix}saved-words`, s);
    }

    add(word) {
        this.#savedWords.add(word);
        this.#save();
    }

    delete(word) {
        this.#savedWords.delete(word);
        this.#save();
    }

    getAll() {
        return [...this.#savedWords].sort();
    }

    deleteAll() {
        this.#savedWords = new Set();
        this.#save();
    }
}

// Table is a helper to easily create HTML tables.
class Table {
    domElement = null;

    // id is optional. If present must be a string.
    constructor(id) {
        this.domElement = document.createElement('table');
        if ( id ) {
            this.domElement.id = id;
        }
    }

    get classList() {
        return this.domElement.classList;
    }

    // addRow appends a new row to the table.
    // Each argument is a new cell, it must be either a string or a dom object.
    addRow(...cells) {
        const tr = document.createElement('tr');
        this.domElement.appendChild(tr);

        for ( let c of cells ) {
            if ( typeof c === 'string' ) {
                c = document.createTextNode(c)
            }
            const td = document.createElement('td');
            tr.appendChild(td);
            td.appendChild(c);
        }
    }
}

function init() {
    new Accordion([...document.querySelectorAll('h2')]);

    const userInput = document.querySelector('#to-spell');

    const outputBox = document.querySelector('#spelling-section');
    const output = new SpellingBox(outputBox);


    userInput.value = localStorage.getItem(`${storagePrefix}current-word`);

    const savedWords = new SavedWords()

    const displaySavedWords = function() {
        const words = savedWords.getAll();
        const box = document.querySelector('#saved-list');
        box.innerHTML = '';

        if ( words.length == 0 ) {
            const p = document.createElement('p');
            box.appendChild(p);
            p.innerHTML = `
        You didn't save any word to spell yet.</br>
        Don't worry, everything you write here stays on your device only.</br>
        Just tap the save button nearby the word while you write it in the <a href="#spelling">spelling tool</a>.
`;
        } else {
            const table = new Table();
            table.classList.add('borderless');
            box.appendChild(table.domElement);

            for ( const w of words ) {
                const a = document.createElement('a');
                a.innerText = w;
                a.href="#spelling"
                a.addEventListener('click', () => {
                    userInput.value = a.innerText;
                    writeSpelling();
                });

                const b = document.createElement('input');
                b.type = 'button';
                b.title = 'Delete';
                b.value = '✕';
                b.addEventListener('click', () => {
                    savedWords.delete(w);
                    displaySavedWords();
                });

                table.addRow(b, a);
            }

            const btn = document.createElement('button');
            btn.innerText = '✕ Delete all';

            btn.addEventListener('click', () => {
                savedWords.deleteAll();
                displaySavedWords();
            });

            table.addRow('', btn);
        }
    }
    displaySavedWords();

    const writeSpelling = function(){
        const word = userInput.value.trim();

        localStorage.setItem(`${storagePrefix}current-word`, word);
        output.clear();

        for ( const line of getSpelling(word) ) {
            output.addEntry(line.letter, line.codeWord);
        }
    }

    writeSpelling();

    userInput.addEventListener('input', writeSpelling);
    userInput.addEventListener('keypress', e => {
        if (e.key == "Enter") {
            // On mobile we want the virtual keyboard to disappear to get some
            // more space for the spelling table.
            userInput.blur();
            output.highlightFirst();
            const h = window.innerHeight;
            setTimeout( () => {
                if ( h === window.innerHeight ) {
                    // If the window size didn't change, we can assume we don't have
                    // a virtual keyboard, therefore re-focus the user input.
                    userInput.focus();
                }
            }, 100);
        }
    });
    userInput.addEventListener('keydown', e => {
        switch (e.key) {
        case 'ArrowDown':
            output.moveHighlight(true);
            e.preventDefault();
            return;
        case 'ArrowUp':
            output.moveHighlight(false);
            e.preventDefault();
            return;
        }
    });
    outputBox.addEventListener('wheel', e => {
        const nextLetter = e.wheelDelta < 0;
        if ( output.moveHighlight(nextLetter) ) {
            e.preventDefault();
        }
    });

    // TODO re-enable this on the table and quick view only.
    // new TouchDirectionDetector(outputBox, {
    //     up: () => output.moveHighlight(true),
    //     down: () => output.moveHighlight(false),
    // });

    document.querySelector('#reset-to-spell').addEventListener('click', function(){
        userInput.value = '';
        writeSpelling(); // Input type="reset" doesn't trigger the event "input" on click;
    });
    document.querySelector('#save-to-spell').addEventListener('click', function(){
        const toSave = userInput.value.trim();
        if ( toSave == '' ) {
            return
        }
        savedWords.add(toSave);
        displaySavedWords();
        window.location.hash = '#saved';
    });
}

// getSpelling returns the spelling of the text.
// It removes the diacritics, correctly handle the case and some common symbols.
//
// returns: an array of {letter, codeWord}.
function getSpelling(text) {
    let ret = [];
    for (var i = 0; i < text.length; i++) {
        const l = text.charAt(i);
        // Remove diacritics https://stackoverflow.com/questions/990904
        const n = l.toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
        let r = '[?]'
        if ( n >= 0 && n <= 9 ) {
            r = `[${n}]`;
        }
        if ( letterMap.has(n) ) {
            r = letterMap.get(n);
        }
        ret.push({letter: l, codeWord: r});
    }
    return ret;
}
