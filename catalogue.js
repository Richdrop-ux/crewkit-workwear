const dncPants = 'https://www.dncworkwear.com.au/categories/Workwear/Work-Pants';
const dncCoveralls = 'https://www.dncworkwear.com.au/ProductDisplay.aspx?filterProduct=CategoryCode%3Ane%3ASX99&productsearch=coveralls';
const catalogue = [
  {sku:'WSL503', brand:'Workcraft', category:'Shirts', name:'Hi-vis long-sleeve work shirt', source:'https://www.nccapparel.com.au/catalogue/'},
  {sku:'3311', brand:'DNC Workwear', category:'Pants', name:'Cotton Drill Work Pants', source:dncPants},
  {sku:'3312', brand:'DNC Workwear', category:'Pants', name:'Cotton Drill Cargo Pants', source:dncPants},
  {sku:'K8044', brand:'Portwest / Huski', category:'Jackets', name:'Huski Freezer Jacket', source:'https://bjsworkwear.com.au/products/huski-hi-vis-contrast-freezer-jacket'},
  {sku:'3101', brand:'DNC Workwear', category:'Coveralls', name:'Cotton Drill Coverall', source:dncCoveralls},
  {sku:'3851', brand:'DNC Workwear', category:'Coveralls', name:'Hi-vis Two-Tone Cotton Coverall', source:dncCoveralls},
];

const byId = (id) => document.getElementById(id);
const quote = new Map();
const storageKey = 'crewkit-quote-v1';

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  for (const entry of saved) {
    if (catalogue.some((product) => product.sku === entry.sku)) quote.set(entry.sku, entry);
  }
} catch {
  // The quote list still works when browser storage is unavailable.
}

function saveQuote() {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...quote.values()]));
  } catch {
    // Keep editing the current list in memory.
  }
}

function element(tag, value, className) {
  const node = document.createElement(tag);
  if (value) node.textContent = value;
  if (className) node.className = className;
  return node;
}

function renderCatalogue() {
  const term = byId('search').value.trim().toLowerCase();
  const brand = byId('brand').value;
  const category = byId('category').value;
  const matches = catalogue.filter((product) =>
    (!brand || product.brand === brand) &&
    (!category || product.category === category) &&
    `${product.name} ${product.sku} ${product.brand}`.toLowerCase().includes(term)
  );

  byId('results').textContent = matches.length ? `${matches.length} styles` : 'No matching styles. Try a different code or filter.';
  byId('products').replaceChildren(...matches.map((product) => {
    const card = element('article', '', 'card');
    const source = element('a', 'View supplier details');
    source.href = product.source;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    const added = quote.has(product.sku);
    const button = element('button', added ? 'View quote item' : 'Add to Quote', 'button');
    button.type = 'button';
    button.addEventListener('click', () => {
      if (quote.has(product.sku)) {
        byId(`sizes-${product.sku}`).focus();
      } else {
        quote.set(product.sku, {sku:product.sku, colour:'', sizes:''});
        saveQuote();
        renderItems();
        button.textContent = 'View quote item';
        byId('feedback').textContent = `${product.sku} added to your quote list.`;
      }
    });
    card.append(element('p', `${product.brand} · ${product.sku}`), element('h3', product.name), source, button);
    return card;
  }));
}

function itemField(entry, field, labelText, placeholder) {
  const label = element('label', labelText);
  const input = element('input');
  input.id = `${field}-${entry.sku}`;
  input.value = entry[field];
  input.placeholder = placeholder;
  input.addEventListener('input', () => {
    entry[field] = input.value;
    saveQuote();
  });
  label.append(input);
  return label;
}

function renderItems() {
  byId('count').textContent = quote.size;
  if (!quote.size) {
    byId('items').replaceChildren(element('p', 'Add a catalogue item or enter an unlisted style in the form.'));
    return;
  }
  byId('items').replaceChildren(...[...quote.values()].map((entry) => {
    const product = catalogue.find((item) => item.sku === entry.sku);
    const card = element('div', '', 'quote-item');
    const head = element('header');
    const remove = element('button', 'Remove', 'remove');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Remove ${product.sku}`);
    remove.addEventListener('click', () => {
      quote.delete(entry.sku);
      saveQuote();
      renderItems();
      renderCatalogue();
      byId('feedback').textContent = `${product.sku} removed.`;
    });
    head.append(element('strong', `${product.sku} · ${product.name}`), remove);
    card.append(head, itemField(entry, 'colour', 'Preferred colour', 'e.g. Yellow / Navy'), itemField(entry, 'sizes', 'Sizes and quantities', 'e.g. 4 × M, 6 × L'));
    return card;
  }));
}

for (const id of ['search','brand','category']) byId(id).addEventListener('input', renderCatalogue);

byId('quote-form').addEventListener('submit', (event) => {
  const form = event.currentTarget;
  const fields = new FormData(form);
  const status = byId('form-status');
  if (!quote.size && !fields.get('extra').trim()) {
    event.preventDefault();
    status.textContent = 'Add a catalogue item or enter an unlisted style.';
    return;
  }
  for (const entry of quote.values()) {
    if (!entry.sizes.trim()) {
      event.preventDefault();
      status.textContent = `Enter sizes and quantities for ${entry.sku}.`;
      byId(`sizes-${entry.sku}`).focus();
      return;
    }
  }
  byId('quote-items').value = [...quote.values()].map((entry) => {
    const product = catalogue.find((item) => item.sku === entry.sku);
    return `${product.brand} | ${entry.sku} | ${product.name} | ${entry.colour || 'Colour to confirm'} | ${entry.sizes}`;
  }).join('\n');
  status.textContent = 'Sending your quote request…';
});

renderCatalogue();
renderItems();

byId('quote-action').disabled = false;
