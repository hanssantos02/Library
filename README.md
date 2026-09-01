# My Library

A simple browser-based app for tracking books you own or want to read. Add books through a modal form, mark them as read/unread with a click, and remove them from your collection — all without a page reload.

This project was built as a learning exercise, focused on core vanilla JavaScript concepts: constructor functions, prototypes, getters/setters, and DOM manipulation without any frameworks.

## Features

- **Add books** via a modal form (title, author, page count, read status)
- **Toggle read status** by clicking a book's status badge — updates instantly
- **Remove books** from the collection with one click
- **Dynamic grid layout** that automatically re-flows as books are added or removed
- **"New Book" button** repositions itself to always sit right after the last book card

## How It's Built

### `Book` constructor

Each book is created with a constructor function (not `class` syntax), enforced to only be called with `new`:

```javascript
function Book(title, author, pages, isRead) { ... }
```

### Getter/setter for `isRead`

Rather than storing `isRead` as a plain boolean, it's implemented as a **getter/setter pair** on `Book.prototype` via `Object.defineProperty`:

- The raw boolean lives in `book._isRead`
- Reading `book.isRead` returns a human-readable string (`"Read"` / `"not read yet"`)
- Writing `book.isRead = value` updates the underlying boolean

This keeps display logic (`info()`, the rendered status badge) clean, since they can just reference `book.isRead` directly without manual formatting.

### Rendering

A single `render()` function is the source of truth for the DOM:

1. Clears `#library-container`
2. Rebuilds one card per book in `myLibrary`
3. Appends the "New Book" button last, so it always visually follows the most recent card

`render()` is called any time the underlying data changes — after adding, removing, or toggling a book — so the UI always reflects the current state of `myLibrary`.

### Event delegation

Rather than attaching a listener to every remove button or status badge individually, a **single click listener** lives on `#library-container`. It inspects `event.target` to determine what was actually clicked, and reads a `data-index` attribute to know which book in `myLibrary` to act on. This avoids re-attaching (and stacking) listeners every time `render()` rebuilds the cards.

The "New Book" button is the one exception — since only one exists at a time and it's fully recreated on every render, it gets a direct listener instead.

### Modal form

Clicking "New Book" reveals a hidden overlay containing a form. On submit, the page reload is prevented, input values are read and converted to the correct types (numbers, booleans), a new book is created and added to the library, and the form/modal are reset and closed.

## File Structure

```
├── index.html      # Page structure, modal/form markup
├── styles.css      # Grid layout, card styling, modal styling
└── javascript.js   # Book constructor, prototype methods, render logic, event handling
```

## Possible Next Steps

- Persist `myLibrary` to `localStorage` so books survive a page refresh
- Add form validation feedback beyond native browser validation
- Add sorting/filtering (e.g., show only unread books)
- Add a confirmation step before removing a book