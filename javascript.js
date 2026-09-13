const myLibrary = [];
const container = document.getElementById('library-container');
const overlay = document.getElementById('overlay');
const closeFormBtn = document.getElementById("close-modal-btn");
const form = document.getElementById("new-book-form");

class Book {
    constructor(title, author, pages, isRead) {
        this.title = title;
        this.author = author;
        this.pages = pages;
        this._isRead = isRead;
    }

    get isRead() {
        return this._isRead ? "Read" : "not read yet";
    }
    set isRead(value) {
        this._isRead = value;
    }

    info() {
        return `${this.title} by ${this.author}, ${this.pages} pages, ${this.isRead}`;
    }
}

function addBookToLibrary(title, author, pages, isRead) {
    const books = new Book(title, author, pages, isRead);
    myLibrary.push(books);
    render();
}

function render() {
    container.innerHTML = '';

    myLibrary.forEach((book, index) => {
        const card = document.createElement('div');
        card.className = 'book-card';

        card.innerHTML = `
            <h2>${book.title}</h2>
            <p>by ${book.author}</p>
            <p>${book.pages} pages</p>
            <span class="status ${book._isRead ? 'read' : 'unread'}" data-index="${index}">${book.isRead}</span>
            <button class="remove-btn" data-index="${index}">Remove</button>
        `;

        container.appendChild(card);
    });
    const newBookBtn = document.createElement('button');
    newBookBtn.className = 'new-book-btn';
    newBookBtn.textContent = "New Book";
    container.appendChild(newBookBtn);

    newBookBtn.addEventListener("click", () => {
        overlay.classList.remove('hidden');
    });
};

container.addEventListener("click", function(event) {
    if (event.target.classList.contains('remove-btn')) {
        const index = event.target.dataset.index;
        myLibrary.splice(index, 1);
        render();
    };

    if (event.target.classList.contains('status')) {
        const index = event.target.dataset.index;
        const book = myLibrary[index];
        book._isRead = !book._isRead;
        render();
    };
});

closeFormBtn.addEventListener("click", () => {
    overlay.classList.add('hidden');
    form.reset();
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const pages = document.getElementById('pages').value;
    const isRead = document.getElementById('isRead').checked;
    addBookToLibrary(title, author, Number(pages), isRead);
    overlay.classList.add('hidden');
    form.reset();
});

render();