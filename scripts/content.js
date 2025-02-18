// this file is where you can inject code into the page

// selects all h1 tags and changes the text content
const h1s = document.querySelectorAll('h1');
h1s.forEach(h1 => {
    h1.textContent = 'This is injected content';
});