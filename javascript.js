const myLibrary = [];
const container = document.getElementById('library-container');

function Book(title, author, pages, isRead) {
    if (!new.target) {
        throw Error("You must use the 'new' operator to make an object");
    }
    this.title = title;
    this.author = author;
    this.pages = pages;
    this._isRead = isRead;
    
}

Object.defineProperty(Book.prototype, 'isRead', {
    get: function() {
        return this._isRead ? "Read" : "not read yet"
    },
    set: function(value) {
        this._isRead = value;
    },
    enumerable: true
});

Book.prototype.info = function() {
    return `${this.title} by ${this.author}, ${this.pages} pages, ${this.isRead}`;
}

function addBookToLibrary(title, author, pages, isRead) {
    const books = new Book(title, author, pages, isRead);
    myLibrary.push(books);
    render();
}

addBookToLibrary("The Hobbit", "IDK WHO", 295, true);
console.log(myLibrary);

addBookToLibrary("Harry Potter", "JK Rowling", 452, false);

function render() {
    container.innerHTML = '';

    myLibrary.forEach((book, index) => {
        const card = document.createElement('div');
        card.className = 'book-card';

        card.innerHTML = `
            <h2>${book.title}</h2>
            <p>by ${book.author}</p>
            <p>${book.pages} pages</p>
            <span class="status ${book._isRead ? 'read' : 'unread'}">${book.isRead}</span>
            <button class="remove-btn" data-index="${index}">Remove</button>
        `;

        container.appendChild(card);
    });
};

container.addEventListener("click", function(event) {
    if (event.target.classList.contains('remove-btn')) {
        const index = event.target.dataset.index;
        myLibrary.splice(index, 1);
        render();
    };
});