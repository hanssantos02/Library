const myLibrary = [];
const container = document.getElementById('library-container');
const overlay = document.getElementById('overlay');
const closeFormBtn = document.getElementById("close-modal-btn");
const form = document.getElementById("new-book-form");
const formTitle = document.getElementById("title");
const titleError = document.getElementById("titleError");
const formAuthor = document.getElementById("author");
const authorError = document.getElementById("authorError");
const formPages = document.getElementById("pages");
const pagesError = document.getElementById("pagesError");
const isReadInput = document.getElementById("isRead");

const MAX_TITLE_LENGTH = 200;
const MAX_AUTHOR_LENGTH = 100;
const MIN_PAGES = 1;
const MAX_PAGES = 100000;

const requiredEls = { container, overlay, closeFormBtn, form, formTitle, titleError, formAuthor, authorError, formPages, pagesError };
Object.entries(requiredEls).forEach(([name, el]) => {
    if (!el) console.error(`[Library] Missing required element: #${name}`);
});

class Book {
    constructor(title, author, pages, isRead) {
        this.title = title;
        this.author = author;
        this.pages = pages;
        this.isRead = isRead; // goes through setter -> always boolean
    }

    get isRead() {
        return this._isRead ? "Read" : "not read yet";
    }
    set isRead(value) {
        this._isRead = Boolean(value);
    }

    info() {
        return `${String(this.title)} by ${String(this.author)}, ${Number(this.pages)} pages, ${this.isRead}`;
    }
}


function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[ch]));
}

function setError(input, errorEl, message) {
    if (input && typeof input.setCustomValidity === "function") input.setCustomValidity(message);
    if (errorEl) errorEl.textContent = message;
}

function clearError(input, errorEl) {
    setError(input, errorEl, "");
}

function clearFormErrors() {
    clearError(formTitle, titleError);
    clearError(formAuthor, authorError);
    clearError(formPages, pagesError);
}

function resetForm() {
    if (!form) return;
    form.reset();
    clearFormErrors();
}

function openModal() {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    if (formTitle && typeof formTitle.focus === "function") {
        setTimeout(() => formTitle.focus(), 0);
    }
}

function closeModal() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    resetForm();
}

function parseBookIndex(raw) {
    const n = Number(raw);
    if (!Number.isInteger(n)) return -1;
    if (n < 0 || n >= myLibrary.length) return -1;
    return n;
}

function validateBookData(title, author, pages) {
    const t = String(title ?? "").trim();
    const a = String(author ?? "").trim();
    const p = Number(pages);
    if (t.length === 0 || t.length > MAX_TITLE_LENGTH) return false;
    if (a.length === 0 || a.length > MAX_AUTHOR_LENGTH) return false;
    if (!Number.isInteger(p) || p < MIN_PAGES || p > MAX_PAGES) return false;
    return true;
}

function addBookToLibrary(title, author, pages, isRead) {
    const cleanTitle = String(title ?? "").trim();
    const cleanAuthor = String(author ?? "").trim();
    const cleanPages = Number(pages);
    if (!validateBookData(cleanTitle, cleanAuthor, cleanPages)) return false;
    const books = new Book(cleanTitle, cleanAuthor, cleanPages, Boolean(isRead));
    myLibrary.push(books);
    render();
    return true;
}

function render() {
    if (!container) return;

    container.innerHTML = '';

    myLibrary.forEach((book, index) => {
        if (!book || typeof book !== "object") return;
        const title = String(book.title ?? "");
        const author = String(book.author ?? "");
        const pages = Number(book.pages);
        if (!validateBookData(title, author, pages)) return;

        const card = document.createElement('div');
        card.className = 'book-card';

        // Escape user content: titles like <img src=x onerror=...> must not execute.
        card.innerHTML = `
            <h2>${escapeHTML(title)}</h2>
            <p>by ${escapeHTML(author)}</p>
            <p>${pages} pages</p>
            <span class="status ${book._isRead ? 'read' : 'unread'}" data-index="${index}">${book.isRead}</span>
            <button type="button" class="remove-btn" data-index="${index}">Remove</button>
        `;

        container.appendChild(card);
    });
    const newBookBtn = document.createElement('button');
    newBookBtn.type = "button";
    newBookBtn.className = 'new-book-btn';
    newBookBtn.textContent = "New Book";
    container.appendChild(newBookBtn);

    newBookBtn.addEventListener("click", openModal);
}

if (container) {
    container.addEventListener("click", function(event) {
        const btn = event.target && event.target.closest
            ? event.target.closest('.remove-btn, .status')
            : null;
        if (!btn || !container.contains(btn)) return;

        const index = parseBookIndex(btn.dataset && btn.dataset.index);
        if (index === -1) return;

        if (btn.classList.contains('remove-btn')) {
            myLibrary.splice(index, 1);
            render();
        } else if (btn.classList.contains('status')) {
            const book = myLibrary[index];
            if (!book) return;
            book._isRead = !book._isRead;
            render();
        }
    });
}

if (closeFormBtn) {
    closeFormBtn.addEventListener("click", closeModal);
}

// Backdrop click + Escape so the modal can't trap the user.
if (overlay) {
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeModal();
    });
}
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay && !overlay.classList.contains("hidden")) {
        closeModal();
    }
});

function validateTitle() {
    if (!formTitle) return false;
    const value = formTitle.value.trim();
    if (formTitle.validity.valueMissing || value.length === 0) {
        setError(formTitle, titleError, "Title is required");
        return false;
    }
    if (value.length > MAX_TITLE_LENGTH) {
        setError(formTitle, titleError, `Title must be under ${MAX_TITLE_LENGTH} characters`);
        return false;
    }
    clearError(formTitle, titleError);
    return true;
}

function validateAuthor() {
    if (!formAuthor) return false;
    const value = formAuthor.value.trim();
    if (formAuthor.validity.valueMissing || value.length === 0) {
        setError(formAuthor, authorError, "Author is required");
        return false;
    }
    if (value.length > MAX_AUTHOR_LENGTH) {
        setError(formAuthor, authorError, `Author must be under ${MAX_AUTHOR_LENGTH} characters`);
        return false;
    }
    clearError(formAuthor, authorError);
    return true;
}

function validatePages() {
    if (!formPages) return false;
    const raw = formPages.value.trim();

    if (formPages.validity.valueMissing || raw === "") {
        setError(formPages, pagesError, "Pages are required");
        return false;
    }
    // Covers "e", "1.2.3", decimals when step=1, etc. Previously unhandled,
    // so the form could fail silently with no message.
    if (formPages.validity.badInput) {
        setError(formPages, pagesError, "Pages must be a whole number");
        return false;
    }
    const num = Number(raw);
    if (!Number.isFinite(num) || !Number.isInteger(num)) {
        setError(formPages, pagesError, "Pages must be a whole number");
        return false;
    }
    if (formPages.validity.rangeUnderflow || num < MIN_PAGES) {
        setError(formPages, pagesError, "Pages must be at least 1 page");
        return false;
    }
    if (formPages.validity.rangeOverflow || num > MAX_PAGES) {
        setError(formPages, pagesError, `Pages must be under ${MAX_PAGES.toLocaleString()}`);
        return false;
    }
    if (formPages.validity.stepMismatch) {
        setError(formPages, pagesError, "Pages must be a whole number");
        return false;
    }
    clearError(formPages, pagesError);
    return true;
}

if (formTitle) formTitle.addEventListener("input", validateTitle);
if (formAuthor) formAuthor.addEventListener("input", validateAuthor);
if (formPages) formPages.addEventListener("input", validatePages);

if (form) {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        try {
            const okTitle = validateTitle();
            const okAuthor = validateAuthor();
            const okPages = validatePages();
            if (!okTitle || !okAuthor || !okPages) return;
            if (!form.checkValidity()) return;

            const title = formTitle.value.trim();
            const author = formAuthor.value.trim();
            const pages = Number(formPages.value);
            const isRead = isReadInput ? isReadInput.checked : false;

            const added = addBookToLibrary(title, author, pages, isRead);
            if (!added) return; // validation already failed; keep modal open
            closeModal();
        } catch (err) {
            console.error("[Library] Failed to add book:", err);
        }
    });
}

render();
