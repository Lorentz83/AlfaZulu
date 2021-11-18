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


if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(function(registration) {
            console.log('Registration successful, scope is:', registration.scope);
        })
        .catch(function(error) {
            console.log('Service worker registration failed, error:', error);
        });
}


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
    document.querySelector('#reset-to-spell').addEventListener('click', function(){
        userInput.value = '';
        writeSpelling(); // Input type="reset" doesn't trigger the event "input" on click;
    });

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

    // re-enable transitions.
    setTimeout( () => document.body.classList.remove('no-transitions') );
}
