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
const headerAddBtn = document.getElementById("header-add-btn");
const searchInput = document.getElementById("search");
const summaryEl = document.getElementById("shelf-summary");
const filterBtns = Array.from(document.querySelectorAll(".filter-btn"));

const MAX_TITLE_LENGTH = 200;
const MAX_AUTHOR_LENGTH = 100;
const MIN_PAGES = 1;
const MAX_PAGES = 100000;

const state = { query: "", filter: "all" };

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
    document.body.style.overflow = "hidden";
    if (formTitle && typeof formTitle.focus === "function") {
        setTimeout(() => formTitle.focus(), 0);
    }
}

function closeModal() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    document.body.style.overflow = "";
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

function getVisibleBooks() {
    const q = state.query.trim().toLowerCase();
    return myLibrary
        .map((book, index) => ({ book, index }))
        .filter(({ book }) => {
            if (!book || typeof book !== "object") return false;
            if (!validateBookData(book.title, book.author, book.pages)) return false;
            if (state.filter === "read" && !book._isRead) return false;
            if (state.filter === "unread" && book._isRead) return false;
            if (!q) return true;
            const hay = `${book.title} ${book.author}`.toLowerCase();
            return hay.includes(q);
        });
}

function updateSummary(visibleCount) {
    if (!summaryEl) return;
    const total = myLibrary.length;
    if (total === 0) {
        summaryEl.textContent = "An empty shelf, waiting for its first spine.";
        return;
    }
    const read = myLibrary.filter((b) => b && b._isRead).length;
    const pages = myLibrary.reduce((sum, b) => sum + (Number.isFinite(Number(b && b.pages)) ? Number(b.pages) : 0), 0);
    const pagesStr = pages.toLocaleString();
    if (state.query || state.filter !== "all") {
        summaryEl.textContent = `${visibleCount} of ${total} ${total === 1 ? "book" : "books"} shown · ${read} read · ${pagesStr} pages shelved.`;
        return;
    }
    if (total === 1) {
        summaryEl.textContent = `One book shelved · ${read ? "read" : "to read"} · ${pagesStr} pages.`;
        return;
    }
    summaryEl.textContent = `${total} books shelved · ${read} read · ${pagesStr} pages in all.`;
}

function emptyShelfHTML(isFiltering) {
    if (!isFiltering) {
        return `
            <div class="empty-shelf">
                <h2>An empty shelf, waiting for its first spine.</h2>
                <p>Shelve the book on your nightstand, the one you lend too freely, the one you mean to finish this winter.</p>
                <button type="button" class="add-btn" data-action="add">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                    <span>Shelve your first book</span>
                </button>
            </div>`;
    }
    return `
        <div class="empty-shelf">
            <h2>Nothing on this shelf matches.</h2>
            <p>No title or author fits that search in this view. Try a shorter search, or clear the filter.</p>
            <button type="button" class="add-btn" data-action="clear-filters"><span>Clear search &amp; filters</span></button>
        </div>`;
}

function render() {
    if (!container) return;
    container.setAttribute("aria-busy", "true");
    container.innerHTML = '';

    const visible = getVisibleBooks();
    updateSummary(visible.length);

    const isFiltering = myLibrary.length > 0 && visible.length === 0;

    if (visible.length === 0) {
        container.insertAdjacentHTML("beforeend", emptyShelfHTML(isFiltering));
        if (myLibrary.length === 0) {
            // Truly empty: empty-shelf carries its own CTA; no extra tile needed.
        } else {
            appendNewBookTile(false);
        }
        container.setAttribute("aria-busy", "false");
        return;
    }

    visible.forEach(({ book, index }, i) => {
        const title = String(book.title ?? "");
        const author = String(book.author ?? "");
        const pages = Number(book.pages);

        const card = document.createElement('div');
        card.className = 'book-card';
        card.style.animationDelay = `${Math.min(i * 55, 420)}ms`;

        const folio = `No. ${String(index + 1).padStart(2, "0")}`;
        const statusLabel = book._isRead ? "Read" : "To read";
        const toggleHint = book._isRead ? "Mark as unread" : "Mark as read";

        // Escape user content: titles like <img src=x onerror=...> must not execute.
        card.innerHTML = `
            <div class="card-folio"><span>${escapeHTML(folio)}</span><span class="folio-pages">${pages.toLocaleString()} pages</span></div>
            <h2>${escapeHTML(title)}</h2>
            <p class="byline">by ${escapeHTML(author)}</p>
            <div class="card-actions">
                <button type="button" class="status ${book._isRead ? 'read' : 'unread'}" data-index="${index}" title="${toggleHint}" aria-label="${escapeHTML(title)}: ${toggleHint}">${statusLabel}</button>
                <button type="button" class="remove-btn" data-index="${index}" aria-label="Remove ${escapeHTML(title)}">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 3.2H10M4.5 3.2V2.2C4.5 1.8 4.8 1.5 5.2 1.5H6.8C7.2 1.5 7.5 1.8 7.5 2.2V3.2M3 3.2L3.4 10.2C3.4 10.6 3.7 10.9 4.1 10.9H7.9C8.3 10.9 8.6 10.6 8.6 10.2L9 3.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span>Remove</span>
                </button>
            </div>
        `;

        container.appendChild(card);
    });
    appendNewBookTile(true);
    container.setAttribute("aria-busy", "false");
}

function appendNewBookTile(withDelay) {
    const newBookBtn = document.createElement('button');
    newBookBtn.type = "button";
    newBookBtn.className = 'new-book-btn';
    if (withDelay) newBookBtn.style.animationDelay = "120ms";
    newBookBtn.innerHTML = `
        <span class="plus" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </span>
        <span>New Book</span>
        <small>Shelve title, author &amp; pages</small>`;
    newBookBtn.addEventListener("click", openModal);
    container.appendChild(newBookBtn);
}

if (container) {
    container.addEventListener("click", function(event) {
        const actionBtn = event.target && event.target.closest
            ? event.target.closest('[data-action]')
            : null;
        if (actionBtn && container.contains(actionBtn)) {
            const action = actionBtn.dataset.action;
            if (action === "add") { openModal(); return; }
            if (action === "clear-filters") {
                state.query = "";
                state.filter = "all";
                if (searchInput) searchInput.value = "";
                syncFilterButtons();
                render();
                return;
            }
        }

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

function syncFilterButtons() {
    filterBtns.forEach((b) => {
        const active = b.dataset.filter === state.filter;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
    });
}

if (filterBtns.length) {
    filterBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            state.filter = btn.dataset.filter || "all";
            syncFilterButtons();
            render();
        });
    });
}

if (searchInput) {
    searchInput.addEventListener("input", () => {
        state.query = searchInput.value || "";
        render();
    });
}

if (headerAddBtn) {
    headerAddBtn.addEventListener("click", openModal);
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

// First-run shelf: three honest starters so the room reads as designed.
// Real titles, real page counts, removable in one click.
if (myLibrary.length === 0) {
    myLibrary.push(
        new Book("The Left Hand of Darkness", "Ursula K. Le Guin", 304, true),
        new Book("Pilgrim at Tinker Creek", "Annie Dillard", 271, false),
        new Book("The Master and Margarita", "Mikhail Bulgakov", 384, false)
    );
}

syncFilterButtons();
render();
