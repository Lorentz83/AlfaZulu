'use strict';

window.onload = function() {
  init();
};

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
    constructor(container) {
        this.container = container;
        this.table = null;
    }

    clear() {
        this.container.innerHTML = '';
        this.table = null;
    }

    addEntry(letter, codeWord) {
        if ( !this.table ) {
            this.table = document.createElement('table');
            this.container.appendChild(this.table);
        }
        const t = this.table;

        const r = document.createElement('tr');
        t.appendChild(r);
        
        const lBox = document.createElement('td');
        r.appendChild(lBox);
        const codeBox = document.createElement('td');
        r.appendChild(codeBox);
        
        lBox.innerText = letter;
        codeBox.innerText = codeWord;
    }

    // highlightFirst highlights the 1st letter.
    //
    // returns: a bollean if there is something to highlight
    highlightFirst() {
        const rows = this.container.querySelectorAll('tr')
        if ( rows.length == 0 ) {
            return false;
        }
        rows.forEach(r => r.classList.remove('highlighted'));
        rows[0].classList.add('highlighted');
        return true;
    }

    // moveHighlight moves the highlight one position by one.
    // If no highlight is present it is added on the 1st letter.
    //
    // Args:
    //  - moveNext: a boolean to define if we need to move to the next or the previous letter.
    // returns: a boolean if it could move.
    moveHighlight(moveNext) {
        let curr = this.container.querySelector('tr.highlighted');
        if ( ! curr ) { // if there is no highligh, highligh the first.
            return this.highlightFirst();
        }
        const next = moveNext ? curr.nextElementSibling : curr.previousElementSibling;
        if ( ! next || next.tagName !== 'TR' ) {
            return false;
        }
        curr.classList.remove('highlighted');
        next.classList.add('highlighted');
        return true;
    }
}

// Accordion is the DOM handling to make an accordion UI.
// Folding details are delegated to CSS, this class simply toggles a
// class to the titles and stores the status in the UR hash.
class Accordion {
    
    // Initializes the accordion. All the provided titles must have an ID.
    //
    // Args:
    //  - allTitles: an array of dom objects, one for each title of the accordion.
    constructor(allTitles) {
        allTitles.forEach( t => t.addEventListener('click', function(){
            for ( const title of allTitles ) {
                if ( title == t ) {
                    title.classList.remove('collapsed');
                    history.replaceState(null, '', '#' + t.id);
                } else {
                    title.classList.add('collapsed');
                }
            }
        }));
        
        allTitles.forEach( t => t.classList.add('collapsed') );
        
        const toOpenID = window.location.hash.substring(1);
        
        let toOpen = allTitles.find( t => t.id === toOpenID );
        if ( toOpen === undefined ) {
            toOpen = allTitles[0];
        }
        toOpen.classList.toggle('collapsed');
        
        // re-enable transitions on the next event cycle.
        setTimeout( () => document.body.classList.remove('no-transitions') );
    }
}

function init() {
    new Accordion([...document.querySelectorAll('h2')]);

    const userInput = document.querySelector('#to-spell');

    const outputBox = document.querySelector('#spelled');
    const output = new SpellingBox(outputBox);

    const writeSpelling = function(){
        output.clear();
        
        for ( const line of getSpelling(userInput.value) ) {
            output.addEntry(line.letter, line.codeWord);
        }
    }

    writeSpelling();
    
    userInput.addEventListener('input', writeSpelling);
    userInput.addEventListener('keypress', e => {
        if (e.key == "Enter") {
            userInput.blur(); // To make virtual keyboard disappear on mobile.
            output.highlightFirst();
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
    document.querySelector('#reset-to-spell').addEventListener('click', function(){
        userInput.value = '';
        writeSpelling(); // Input type="reset" doesn't trigger the event "input" on click;
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
        const r = letterMap.has(n) ? letterMap.get(n) : '[?]';
        ret.push({letter: l, codeWord: r});
    }
    return ret;
}


