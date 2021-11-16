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


function init() {
    const userInput = document.querySelector('#to-spell');
    const outputBox = document.querySelector('#spelled');

    const spellingOutput = {};

    const writeSpelling = function(){
        outputBox.innerHTML = '';
        const t = document.createElement('table');
        outputBox.appendChild(t);
        
        updateSpelling(userInput.value, function(l, code){
            const r = document.createElement('tr');
            t.appendChild(r);

            const lBox = document.createElement('td');
            r.appendChild(lBox);
            const codeBox = document.createElement('td');
            r.appendChild(codeBox);

            lBox.innerText += l;
            codeBox.innerText = code;
        });
    }

    writeSpelling();
    
    userInput.addEventListener('input', writeSpelling);

    makeAccordion();
}

function updateSpelling(text, addPairFn) {
    for (var i = 0; i < text.length; i++) {
        const l = text.charAt(i);
        // Remove diacritics https://stackoverflow.com/questions/990904
        const n = l.toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
        const r = letterMap.has(n) ? letterMap.get(n) : '[?]';
        addPairFn(l, r);
    }
}


function makeAccordion() {
    const allTitles = [...document.querySelectorAll('h2')];

    allTitles.forEach( t => t.addEventListener('click', function(){
        for ( const title of allTitles ) {
            if ( title == t ) {
                title.classList.remove('collapsed');
            } else {
                title.classList.add('collapsed');
            }
        }
    }));

    allTitles.slice(1).forEach( t => t.classList.add('collapsed') );
}

function makeAccordion_() {
    let first = true;
    const allTitles = [];
    const selectTitle = function(selected) {
        for ( const title of allTitles ) {
            if ( title == selected ) {
                title.classList.remove('collapsed');
                title.nextElementSibling.classList.remove('collapsed');
            } else {
                title.classList.add('collapsed');
                title.nextElementSibling.classList.add('collapsed');
            }
        }
    }
    for ( const title of document.querySelectorAll('h2') ) {
        const section = title.nextElementSibling;
        if ( section.tagName != 'SECTION' ) {
            console.log('error: h2 without a section', title)
        }
        allTitles.push(title);
        if ( !first ) {
            title.classList.add('collapsed');
            section.classList.add('collapsed');
        }
        first = false;
        title.addEventListener('click', function(){
            selectTitle(title);
        });
    }    
}
