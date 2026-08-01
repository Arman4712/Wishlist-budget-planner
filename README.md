# WishLynk — Wishlist & Budget Planner

A fully animated, mobile- and desktop-friendly web app to save products you want to buy and plan your spending month by month — all in your browser, no account needed.

## Features

### Wishlist
- Add products with their **name**, **price (in ₹)** and **purchase link**
- Copy any link to the clipboard with a single click
- Reorder products by **drag and drop** (touch supported) or the up/down arrows
- Remove products anytime

### Budget Planner
- **4 month tabs**: the current month plus the next 3, so you can pre-plan ahead
- **Renameable months** — the month name is fully under your control
- Set a monthly budget and watch **Budget / Utilised / Remaining** update **live as you type**, with an animated progress bar (turns amber near the limit, red when over)
- **"+ Add Items"** opens your wishlist as tickable checkboxes — items that don't fit the remaining budget are disabled automatically
- Each planned item has **+ / − steppers that adjust its amount by ₹50 at a time**
- Copy buttons for every planned item's link
- Per-month budgets and plans stay independent of each other

### Everywhere
- Responsive on **Android, iOS, Windows, macOS and Linux**
- Data stays in your browser (`localStorage`) — private, no server
- Reset button in the header to clear all data

## Usage

1. Open `index.html` in a browser, or serve the folder:

   ```
   python3 -m http.server 8080
   ```

2. **Wishlist tab** → add your products with name, price and link.
3. **Budget Planner tab** → pick a month, set a budget, press **Add Items**, and tick what you plan to buy. Use the **+ / −** buttons to fine-tune each item in ₹50 steps.
4. Copy purchase links straight from the list whenever you're ready to buy.

## Tech

- Plain **HTML + CSS + JavaScript** — zero build step, zero dependencies
- Single-page app with animated gradient background, glassmorphism, and smooth transitions
- Data persisted in `localStorage` under the key `wishlynk_data_v1`

## Project structure

```
index.html        App markup (views, modals, layout)
css/styles.css    Styling, animations and responsive design
js/app.js         App logic: wishlist, months, budgets, persistence
```

## Notes

- Prices and adjustments are in **Indian Rupees (₹)**.
- Resetting data is permanent and cannot be undone.

..
