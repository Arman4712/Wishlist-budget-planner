(() => {
  'use strict';

  const STORAGE_KEY = 'wishlynk_data_v1';
  const MONTH_COUNT = 4;
  const STEP = 50;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : 0; };
  const fmt = (n) => '\u20B9' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  function defaultMonths() {
    const now = new Date();
    const start = now.getMonth();
    return Array.from({ length: MONTH_COUNT }, (_, i) => ({
      id: 'm' + i,
      name: MONTH_NAMES[(start + i) % 12],
      budget: 0,
      items: {}
    }));
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.wishlist) && Array.isArray(d.months)) return d;
      }
    } catch (e) { /* corrupted */ }
    return { wishlist: [], months: defaultMonths() };
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { /* storage full */ }
  }

  // ---------- Helpers ----------

  function toast(msg, type = 'success') {
    const wrap = $('#toastWrap');
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
    };
    el.innerHTML = icons[type] || icons.info;
    el.appendChild(document.createTextNode(msg));
    wrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 320);
    }, 2200);
  }

  async function copyText(text, label = 'Link copied') {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      toast(label);
      return true;
    } catch (e) {
      toast('Could not copy. Select the link manually.', 'error');
      return false;
    }
  }

  // ---------- Wishlist ----------

  const wishlistGrid = $('#wishlistGrid');
  const wishlistEmpty = $('#wishlistEmpty');

  function renderWishlist() {
    const list = state.wishlist;
    $('#wishlistCount').textContent = list.length + ' product' + (list.length === 1 ? '' : 's') + ' saved';
    wishlistGrid.innerHTML = '';
    wishlistEmpty.remove();

    if (!list.length) {
      wishlistGrid.appendChild(wishlistEmpty);
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach((p, i) => {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.dataset.id = p.id;
      card.draggable = !('ontouchstart' in window);
      card.innerHTML = `
        <div class="card-top">
          <span class="drag-handle" title="Drag to reorder">
            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>
          </span>
          <span class="card-badge">${i + 1}</span>
          <span class="card-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</span>
          <div class="card-actions">
            <button class="icon-btn arrow-up" data-act="up" title="Move up">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <button class="icon-btn arrow-down" data-act="down" title="Move down">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <button class="icon-btn remove-btn" data-act="remove" title="Remove product">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="card-price">
          <span class="price-amount">${fmt(p.price)}</span>
          <span class="price-label">Price</span>
        </div>
        <div class="card-link-row">
          <span class="link-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </span>
          <a class="card-link" href="${escapeAttr(p.link)}" target="_blank" rel="noopener noreferrer" title="${escapeAttr(p.link)}">${escapeHtml(p.link)}</a>
          <button class="copy-btn" data-link="${escapeAttr(p.link)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
        </div>`;
      frag.appendChild(card);
    });
    wishlistGrid.appendChild(frag);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const escapeAttr = escapeHtml;

  function reorder(fromId, toId) {
    const list = state.wishlist;
    const from = list.findIndex((p) => p.id === fromId);
    const to = list.findIndex((p) => p.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    save();
    renderWishlist();
  }

  function moveBy(id, dir) {
    const list = state.wishlist;
    const idx = list.findIndex((p) => p.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    save();
    renderWishlist();
  }

  function removeProduct(id) {
    const p = state.wishlist.find((x) => x.id === id);
    state.wishlist = state.wishlist.filter((x) => x.id !== id);
    state.months.forEach((m) => { delete m.items[id]; });
    save();
    renderWishlist();
    renderMonthTabs();
    renderPlanner();
    toast((p ? '\u201C' + p.name + '\u201D' : 'Product') + ' removed from wishlist', 'info');
  }

  // ---------- Drag & drop ----------

  let dragId = null;

  wishlistGrid.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.product-card');
    if (!card || card.draggable === false) return;
    dragId = card.dataset.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
  });

  wishlistGrid.addEventListener('dragend', () => {
    dragId = null;
    $$('.product-card').forEach((c) => c.classList.remove('dragging', 'drag-over'));
  });

  wishlistGrid.addEventListener('dragover', (e) => {
    e.preventDefault();
    const card = e.target.closest('.product-card');
    if (!card || !dragId) return;
    $$('.product-card').forEach((c) => c.classList.remove('drag-over'));
    card.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'move';
  });

  wishlistGrid.addEventListener('drop', (e) => {
    e.preventDefault();
    const card = e.target.closest('.product-card');
    if (card && dragId) reorder(dragId, card.dataset.id);
    dragId = null;
    $$('.product-card').forEach((c) => c.classList.remove('dragging', 'drag-over'));
  });

  // Touch drag & drop (HTML5 DnD does not work on touch devices)
  let touchDrag = null;

  wishlistGrid.addEventListener('touchstart', (e) => {
    const handle = e.target.closest('.drag-handle');
    if (!handle) return;
    const card = handle.closest('.product-card');
    if (!card) return;
    const t = e.touches[0];
    touchDrag = { id: card.dataset.id, card, startX: t.clientX, startY: t.clientY, moved: false };
  }, { passive: true });

  wishlistGrid.addEventListener('touchmove', (e) => {
    if (!touchDrag || !touchDrag.id) return;
    const t = e.touches[0];
    const dx = t.clientX - touchDrag.startX;
    const dy = t.clientY - touchDrag.startY;
    if (!touchDrag.moved && Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    if (!touchDrag.moved) {
      touchDrag.moved = true;
      touchDrag.card.classList.add('dragging');
      e.preventDefault();
    }
    touchDrag.card.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(1.5deg)';
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const over = el && el.closest('.product-card');
    $$('.product-card').forEach((c) => c.classList.remove('drag-over'));
    if (over && over !== touchDrag.card) over.classList.add('drag-over');
  }, { passive: false });

  function endTouchDrag(e) {
    if (!touchDrag || !touchDrag.id) return;
    if (touchDrag.moved && e.changedTouches && e.changedTouches.length) {
      const t = e.changedTouches[0];
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const over = el && el.closest('.product-card');
      if (over && over.dataset.id !== touchDrag.id) reorder(touchDrag.id, over.dataset.id);
    }
    touchDrag.card.classList.remove('dragging');
    touchDrag.card.style.transform = '';
    $$('.product-card').forEach((c) => c.classList.remove('drag-over'));
    touchDrag = null;
  }

  wishlistGrid.addEventListener('touchend', endTouchDrag);
  wishlistGrid.addEventListener('touchcancel', endTouchDrag);

  wishlistGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.product-card');
    if (!card) return;
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.classList.contains('copy-btn')) {
      copyText(btn.dataset.link);
      return;
    }

    const act = btn.dataset.act;
    const id = card.dataset.id;
    if (act === 'up') moveBy(id, -1);
    else if (act === 'down') moveBy(id, 1);
    else if (act === 'remove') removeProduct(id);
  });

  // ---------- Add product modal ----------

  const addModal = $('#addProductModal');
  const productForm = $('#productForm');

  function openAddModal() {
    productForm.reset();
    $('#pName').focus();
    openModal(addModal);
  }

  productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#pName').value.trim();
    const price = num($('#pPrice').value);
    const link = $('#pLink').value.trim();

    if (!name) { toast('Please enter a product name', 'error'); return; }
    if (!link) { toast('Please enter a purchase link', 'error'); return; }
    if (!/^https?:\/\//i.test(link)) {
      toast('Link must start with http:// or https://', 'error');
      return;
    }

    state.wishlist.push({ id: uid(), name, price, link });
    save();
    renderWishlist();
    closeModal(addModal);
    toast('\u201C' + name + '\u201D' + ' added to wishlist');
  });

  // ---------- Modals ----------

  function openModal(overlay) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  $$('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('[data-close]')) closeModal(overlay);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $$('.modal-overlay.open').forEach(closeModal);
  });

  // ---------- Tab switching (views) ----------

  $$('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const target = 'view-' + btn.dataset.tab;
      $$('.view').forEach((v) => v.classList.remove('active'));
      $('#' + target).classList.add('active');
    });
  });

  // ---------- Budget planner ----------

  const monthTabs = $('#monthTabs');
  const plannerList = $('#plannerList');
  const plannerEmpty = $('#plannerEmpty');
  let currentMonth = 0;

  function monthUtilised(m) {
    return Object.values(m.items).reduce((a, b) => a + num(b), 0);
  }

  function renderMonthTabs(preview) {
    const editing = preview !== undefined;
    monthTabs.innerHTML = '';
    state.months.forEach((m, i) => {
      const budget = editing && i === currentMonth ? num(preview) : m.budget;
      const used = monthUtilised(m);
      const pct = budget > 0 ? Math.min(100, (used / budget) * 100) : 0;
      const tab = document.createElement('button');
      tab.className = 'month-tab' + (i === currentMonth ? ' active' : '');
      tab.dataset.idx = i;
      tab.innerHTML = `
        <span class="month-tab-name">${escapeHtml(m.name)}</span>
        <span class="month-tab-meta">${fmt(used)} ${budget > 0 ? '/' + fmt(budget) : ''}</span>
        <span class="mini-bar"><i style="width:${pct.toFixed(1)}%"></i></span>`;
      monthTabs.appendChild(tab);
    });

    const totalItems = state.months.reduce((a, m) => a + Object.keys(m.items).length, 0);
    const badge = $('#plannerBadge');
    badge.textContent = totalItems;
    badge.style.display = totalItems ? 'inline-grid' : 'none';
  }

  monthTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.month-tab');
    if (!tab) return;
    commitBudget();
    currentMonth = parseInt(tab.dataset.idx, 10);
    renderMonthTabs();
    renderPlanner();
  });

  function month() { return state.months[currentMonth]; }

  function renderPlanner(preview) {
    const m = month();
    const editing = preview !== undefined;
    const budget = editing ? num(preview) : m.budget;
    const used = monthUtilised(m);
    const over = budget > 0 && used > budget;

    if (!editing) {
      $('#monthTitle').textContent = m.name;
      $('#budgetInput').value = m.budget ? m.budget : '';
    }

    $('#statBudget').textContent = fmt(budget);
    const uEl = $('#statUtilised');
    uEl.textContent = fmt(used);
    uEl.classList.toggle('over', over);
    const rEl = $('#statRemaining');
    rEl.textContent = fmt(budget - used);
    rEl.classList.toggle('over', budget - used < 0);
    $('#statItems').textContent = Object.keys(m.items).length;

    const pct = budget > 0 ? Math.min(100, (used / budget) * 100) : 0;
    const fill = $('#progressFill');
    fill.style.width = pct.toFixed(1) + '%';
    fill.className = 'progress-fill' + (over ? ' danger' : (pct > 85 ? ' warn' : ''));

    $('#progressPct').textContent = Math.round(pct) + '%';

    const hint = $('#progressHint');
    if (!budget) hint.textContent = 'Set a budget to start planning.';
    else if (over) hint.textContent = 'You are over budget by ' + fmt(used - budget) + '. Reduce an item or raise the budget.';
    else hint.textContent = 'You have ' + fmt(budget - used) + ' left to spend this month.';

    if (editing) return;

    plannerList.innerHTML = '';
    plannerEmpty.remove();
    const ids = Object.keys(m.items);
    if (!ids.length) {
      plannerList.appendChild(plannerEmpty);
      return;
    }

    const frag = document.createDocumentFragment();
    ids.forEach((pid) => {
      const p = state.wishlist.find((x) => x.id === pid);
      const amount = num(m.items[pid]);
      if (!p) return;
      const row = document.createElement('div');
      row.className = 'planned-item';
      row.dataset.pid = pid;
      row.innerHTML = `
        <span class="planned-badge">${state.wishlist.indexOf(p) + 1}</span>
        <div class="planned-info">
          <div class="planned-name" title="${escapeAttr(p.name)}">${escapeHtml(p.name)}</div>
        </div>
        <div class="planned-actions">
          <div class="stepper">
            <button class="step-minus" data-pid="${pid}" title="Subtract \u20B950" ${amount <= 0 ? 'disabled' : ''}>&minus;</button>
            <span class="stepper-value">${fmt(amount)}</span>
            <button class="step-plus" data-pid="${pid}" title="Add \u20B950">+</button>
          </div>
          <button class="icon-btn copy-planned" data-link="${escapeAttr(p.link)}" title="Copy purchase link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="icon-btn remove-planned" data-pid="${pid}" title="Remove from plan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>`;
      frag.appendChild(row);
    });
    plannerList.appendChild(frag);
  }

  plannerList.addEventListener('click', (e) => {
    const m = month();
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.classList.contains('step-plus') || btn.classList.contains('step-minus')) {
      const pid = btn.dataset.pid;
      if (m.items[pid] === undefined) return;
      const delta = btn.classList.contains('step-plus') ? STEP : -STEP;
      m.items[pid] = Math.max(0, num(m.items[pid]) + delta);
      save();
      renderPlanner();
      renderMonthTabs();
      return;
    }

    if (btn.classList.contains('copy-planned')) {
      copyText(btn.dataset.link);
      return;
    }

    if (btn.classList.contains('remove-planned')) {
      delete m.items[btn.dataset.pid];
      save();
      renderPlanner();
      renderMonthTabs();
    }
  });

  // ---------- Budget set (live preview + auto-save) ----------

  function commitBudget() {
    const m = month();
    m.budget = num($('#budgetInput').value);
    save();
    renderPlanner();
    renderMonthTabs();
    return m.budget;
  }

  $('#setBudgetBtn').addEventListener('click', () => {
    const b = commitBudget();
    toast(b ? 'Budget set to ' + fmt(b) : 'Budget cleared', 'info');
  });

  $('#budgetInput').addEventListener('input', () => {
    const raw = $('#budgetInput').value;
    renderPlanner(raw);
    renderMonthTabs(raw);
  });

  $('#budgetInput').addEventListener('change', commitBudget);

  $('#budgetInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#setBudgetBtn').click();
  });

  // ---------- Rename month ----------

  $('#editMonthNameBtn').addEventListener('click', startEditMonthName);

  function startEditMonthName() {
    const title = $('#monthTitle');
    const m = month();
    const input = document.createElement('input');
    input.type = 'text';
    input.value = m.name;
    input.className = 'month-name-input';
    input.maxLength = 30;

    title.replaceWith(input);
    input.focus();
    input.select();

    const commit = () => {
      const val = input.value.trim();
      m.name = val || m.name;
      save();
      input.replaceWith(title);
      renderMonthTabs();
      renderPlanner();
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      else if (e.key === 'Escape') { input.value = m.name; input.blur(); }
    });
  }

  // ---------- Pick items modal ----------

  const pickModal = $('#pickModal');
  const pickList = $('#pickList');
  let pickSelection = new Set();

  function openPickModal() {
    commitBudget();
    const m = month();
    if (!state.wishlist.length) {
      toast('Your wishlist is empty. Add products first.', 'error');
      return;
    }
    if (!m.budget) {
      toast('Set a monthly budget first.', 'error');
      return;
    }
    $('#pickMonthName').textContent = m.name;
    pickSelection = new Set(Object.keys(m.items));
    renderPickList();
    openModal(pickModal);
  }

  function pickTotal(m) {
    return Array.from(pickSelection).reduce((sum, pid) => {
      const amount = m.items[pid];
      if (amount !== undefined) return sum + num(amount);
      const p = state.wishlist.find((x) => x.id === pid);
      return sum + (p ? num(p.price) : 0);
    }, 0);
  }

  function renderPickList() {
    const m = month();
    const budget = m.budget;
    const selected = pickTotal(m);
    const remaining = budget - selected;

    $('#pickBudget').textContent = fmt(budget);
    const remEl = $('#pickRemaining');
    remEl.textContent = fmt(Math.max(0, remaining));
    remEl.className = remaining < 0 ? 'neg' : 'pos';
    const note = $('#pickRemainingNote');
    note.textContent = remaining < 0
      ? 'Over budget by ' + fmt(Math.abs(remaining)) + '. Untick something.'
      : 'You can add up to ' + fmt(remaining) + ' more.';

    pickList.innerHTML = '';
    if (!state.wishlist.length) {
      pickList.innerHTML = '<div class="empty-state compact"><h3>Wishlist is empty</h3><p>Add products to your wishlist first.</p></div>';
      return;
    }

    const frag = document.createDocumentFragment();
    state.wishlist.forEach((p, i) => {
      const isSelected = pickSelection.has(p.id);
      const cost = m.items[p.id] !== undefined ? num(m.items[p.id]) : num(p.price);
      const canAfford = remaining >= 0 && num(p.price) <= remaining + (isSelected ? cost : 0);
      const disabled = !isSelected && !canAfford;

      const row = document.createElement('div');
      row.className = 'pick-item' + (isSelected ? ' checked' : '') + (disabled ? ' disabled' : '');
      row.dataset.pid = p.id;
      row.innerHTML = `
        <span class="pick-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <div class="pick-info">
          <div class="pick-name">${i + 1}. ${escapeHtml(p.name)}</div>
          <div class="pick-price"><strong>${fmt(p.price)}</strong>${isSelected && m.items[p.id] !== undefined ? ' \u00B7 planned ' + fmt(cost) : ''}</div>
          <div class="pick-link" title="${escapeAttr(p.link)}">${escapeHtml(p.link)}</div>
        </div>`;
      frag.appendChild(row);
    });
    pickList.appendChild(frag);
  }

  pickList.addEventListener('click', (e) => {
    const m = month();
    const row = e.target.closest('.pick-item');
    if (!row) return;
    const pid = row.dataset.pid;
    const wasSelected = pickSelection.has(pid);

    if (wasSelected) {
      pickSelection.delete(pid);
    } else {
      const p = state.wishlist.find((x) => x.id === pid);
      if (!p) return;
      const selected = pickTotal(m);
      if (m.budget > 0 && selected + num(p.price) > m.budget) {
        toast('This item exceeds your remaining budget.', 'error');
        return;
      }
      pickSelection.add(pid);
    }
    renderPickList();
  });

  $('#pickConfirmBtn').addEventListener('click', () => {
    const m = month();
    const before = Object.keys(m.items).length;
    const currentIds = new Set(Object.keys(m.items));

    state.wishlist.forEach((p) => {
      if (pickSelection.has(p.id)) {
        if (!currentIds.has(p.id)) m.items[p.id] = num(p.price);
      } else {
        delete m.items[p.id];
      }
    });

    const added = pickSelection.size - before;
    save();
    closeModal(pickModal);
    renderPlanner();
    renderMonthTabs();
    toast(added >= 0
      ? (added ? added + ' item' + (added === 1 ? '' : 's') + ' added to ' + m.name : 'Selection saved')
      : 'Items updated');
  });

  $('#addItemsBtn').addEventListener('click', openPickModal);

  // ---------- Reset ----------

  const resetModal = $('#resetModal');

  $('#clearDataBtn').addEventListener('click', () => openModal(resetModal));

  $('#confirmResetBtn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    state = { wishlist: [], months: defaultMonths() };
    currentMonth = 0;
    save();
    closeModal(resetModal);
    renderWishlist();
    renderMonthTabs();
    renderPlanner();
    toast('All data has been reset', 'info');
  });

  // ---------- Init ----------

  $('#addProductBtn').addEventListener('click', openAddModal);
  $('#wishlistEmpty .btn').addEventListener('click', openAddModal);

  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then((granted) => {
      console.log(granted
        ? 'Storage will persist and not be cleared automatically.'
        : 'Storage is not explicitly persistent.');
    }).catch(() => {});
  }

  renderWishlist();
  renderMonthTabs();
  renderPlanner();
})();
