
 
/* script.js
   Full frontend logic for products.html
   - Render products from an array
   - Filters, search, sort
   - Cart & wishlist persistence (localStorage)
   - Modals with accessibility (focus trap, Esc to close)
   - Checkout validation
   - Toast notifications
   - Scroll-to-top
   - Dark mode persistence
*/

// ------------------------------
// Sample product data
// ------------------------------
const products = [
  { id: 1, name: "Wireless Headphones", category: "Audio", price: 99.99, rating: 4.5, image: "./Images/Headphones.png", description: "Sleek wireless headphones with high-fidelity sound, comfortable ear cushions, and long-lasting battery life." },
  { id: 2, name: "Smartwatch Pro", category: "Wearables", price: 149.99, rating: 4.3, image: "./Images/Smartwatch.png", description: "Modern smartwatch with fitness tracking, notifications, and stylish touchscreen design."},
  { id: 3, name: "Gaming Keyboard", category: "Peripherals", price: 79.99, rating: 4.6, image: "./Images/Keyboard.png", description: "Mechanical keys with customizable RGB lighting." },
  { id: 4, name: "4K Monitor", category: "Displays", price: 299.99, rating: 4.7, image: "./Images/Monitor.png", description: "High-resolution 4K monitor with vibrant display and slim modern design, perfect for work and entertainment." },
  { id: 5, name: "Portable Charger ", category: "Accessories", price: 39.99, rating: 4.2, image:"./Images/Charger.png", description: "Keep your devices powered on the go." },
  { id: 6, name: "Modern Slim Laptop – High Performance & Sleek Design", category: "Audio", price: 1559.99, rating: 4.4, image: "./Images/Laptop.png", description: "Experience power and portability with this modern slim laptop." },
  { id: 7, name: "RGB Mouse", category: "Peripherals", price: 49.99, rating: 4.1, image: "./Images/Mouse.png", description: "Sleek RGB gaming mouse with customizable multicolor lighting and ergonomic design for precision gaming." },
  { id: 8, name: "NVMe SSD 1TB", category: "Storage", price: 119.99, rating: 4.8, image: "./Images/Aoros.png", description: "Blazing fast NVMe storage for OS and games." },
];

// ------------------------------
// App state & DOM references
// ------------------------------
let filteredProducts = [...products];
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

const productGrid = document.querySelector("main section.flex-grow") || document.querySelector("section.flex-grow");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const priceRange = document.getElementById("price-range");
const priceRangeValue = document.getElementById("price-range-value");
const sortSelect = document.getElementById("sort-select");

const cartBtn = document.getElementById("cart-btn");
const wishlistBtn = document.getElementById("wishlist-btn");
const cartCountEl = document.getElementById("cart-count");
const wishlistCountEl = document.getElementById("wishlist-count");

const productModal = document.getElementById("product-modal");
const productModalClose = document.getElementById("product-modal-close");
const modalName = document.getElementById("modal-product-name");
const modalImage = document.getElementById("modal-product-image");
const modalDesc = document.getElementById("modal-product-description");
const modalPrice = document.getElementById("modal-product-price");
const modalAddToCart = document.getElementById("modal-add-to-cart");
const modalBuyNow = document.getElementById("modal-buy-now");

const cartModal = document.getElementById("cart-modal");
const cartModalClose = document.getElementById("cart-modal-close");
const cartItemsList = document.getElementById("cart-items");
const cartTotalPrice = document.getElementById("cart-total-price");
const checkoutBtn = document.getElementById("checkout-btn");

const wishlistModal = document.getElementById("wishlist-modal");
const wishlistModalClose = document.getElementById("wishlist-modal-close");
const wishlistItemsList = document.getElementById("wishlist-items");

const checkoutModal = document.getElementById("checkout-modal");
const checkoutModalClose = document.getElementById("checkout-modal-close");
const checkoutForm = document.getElementById("checkout-form");
const errorName = document.getElementById("error-name");
const errorEmail = document.getElementById("error-email");
const errorAddress = document.getElementById("error-address");
const errorCard = document.getElementById("error-card");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");

const scrollToTopBtn = document.getElementById("scroll-to-top");

const darkToggle = document.getElementById("dark-mode-toggle");

// Keep track of last focused element before opening modal (for focus return)
let lastFocusedElement = null;

// ------------------------------
// Utility helpers
// ------------------------------
function saveState() {
  localStorage.setItem("cart", JSON.stringify(cart));
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}
function formatCurrency(num) {
  return `$${Number(num).toFixed(2)}`;
}
function showToast(message, type = "success") {
  // type can be used to style differently later
  toastMessage.textContent = message;
  toast.classList.remove("opacity-0", "pointer-events-none");
  toast.classList.add("opacity-100");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove("opacity-100");
    toast.classList.add("opacity-0", "pointer-events-none");
  }, 3000);
}
function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ------------------------------
// Dark mode persistence
// ------------------------------
function applyInitialDarkMode() {
  const prefer = localStorage.getItem("darkMode");
  if (prefer === "true") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}
function toggleDarkMode() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("darkMode", document.documentElement.classList.contains("dark"));
}
if (darkToggle) {
  darkToggle.addEventListener("click", toggleDarkMode);
  applyInitialDarkMode();
}

// ------------------------------
// Render helpers
// ------------------------------
function renderProducts(list = filteredProducts) {
  productGrid.innerHTML = "";
  if (!list.length) {
    productGrid.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400">No products found.</p>';
    return;
  }
  const fragment = document.createDocumentFragment();

  list.forEach(p => {
    const card = document.createElement("article");
    card.className = "bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" class="w-full h-48 object-cover" loading="lazy" />
      <div class="p-4 flex flex-col flex-grow">
        <h3 class="text-lg font-semibold mb-1">${p.name}</h3>
        <div class="text-sm text-yellow-500 mb-2">${renderStars(p.rating)}</div>
        <p class="text-gray-600 dark:text-gray-300 flex-grow mb-4">${p.description}</p>
        <p class="text-indigo-600 font-bold mb-4">${formatCurrency(p.price)}</p>
        <div class="flex gap-2 mt-auto">
          <button data-id="${p.id}" class="view-details btn-animated bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded">View Details</button>
          <button data-id="${p.id}" class="add-to-cart btn-animated bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded">Add to Cart</button>
          <button data-id="${p.id}" class="toggle-wishlist btn-animated bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-2 rounded">${isInWishlist(p.id) ? 'Remove' : 'Wishlist'}</button>
        </div>
      </div>
    `;
    fragment.appendChild(card);
  });

  productGrid.appendChild(fragment);

  // attach event listeners to new buttons
  document.querySelectorAll(".view-details").forEach(btn => btn.addEventListener("click", onViewDetails));
  document.querySelectorAll(".add-to-cart").forEach(btn => btn.addEventListener("click", e => addToCart(parseInt(e.currentTarget.dataset.id))));
  document.querySelectorAll(".toggle-wishlist").forEach(btn => btn.addEventListener("click", e => toggleWishlist(parseInt(e.currentTarget.dataset.id), e.currentTarget)));
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  let stars = "";
  for (let i = 0; i < full; i++) stars += "★";
  if (half) stars += "☆";
  return `<span aria-hidden="true">${stars}</span>`;
}

// ------------------------------
// Filters / Search / Sort
// ------------------------------
function populateCategories() {
  const categories = Array.from(new Set(products.map(p => p.category)));
  categoryFilter.innerHTML = `<option value="">All Categories</option>`;
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}
function applyFiltersAndSort() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  const maxPrice = Number(priceRange.value) || Infinity;
  const sort = sortSelect.value;

  filteredProducts = products.filter(p => {
    return (p.name.toLowerCase().includes(q))
      && (cat === "" || p.category === cat)
      && (p.price <= maxPrice);
  });

  if (sort === "price-asc") filteredProducts.sort((a,b) => a.price - b.price);
  else if (sort === "price-desc") filteredProducts.sort((a,b) => b.price - a.price);
  else if (sort === "name-asc") filteredProducts.sort((a,b) => a.name.localeCompare(b.name));
  else if (sort === "rating-desc") filteredProducts.sort((a,b) => b.rating - a.rating);

  renderProducts(filteredProducts);
}

const debouncedFilter = debounce(applyFiltersAndSort, 250);

// ------------------------------
// Cart & Wishlist
// ------------------------------
function isInCart(id) {
  return cart.some(i => i.id === id);
}
function isInWishlist(id) {
  return wishlist.some(i => i.id === id);
}
function addToCart(id, qty = 1) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const item = cart.find(i => i.id === id);
  if (item) item.quantity += qty;
  else cart.push({ ...product, quantity: qty });
  saveState();
  updateCounters();
  renderCartItems();
  showToast(`${product.name} added to cart`);
}
function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveState();
  updateCounters();
  renderCartItems();
  showToast(`Removed from cart`);
}
function changeCartQty(id, qty) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity = Math.max(1, qty);
  saveState();
  updateCounters();
  renderCartItems();
}
function toggleWishlist(id, btnEl) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const idx = wishlist.findIndex(i => i.id === id);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    if (btnEl) btnEl.textContent = "Wishlist";
    showToast(`Removed from wishlist`);
  } else {
    wishlist.push(product);
    if (btnEl) btnEl.textContent = "Remove";
    showToast(`Added to wishlist`);
  }
  saveState();
  updateCounters();
  renderWishlistItems();
}
function updateCounters() {
  cartCountEl.textContent = cart.reduce((s, i) => s + i.quantity, 0);
  wishlistCountEl.textContent = wishlist.length;
}
function renderCartItems() {
  cartItemsList.innerHTML = "";
  if (!cart.length) {
    cartItemsList.innerHTML = `<li class="p-4 text-gray-500">Your cart is empty.</li>`;
    cartTotalPrice.textContent = formatCurrency(0);
    return;
  }
  const frag = document.createDocumentFragment();
  cart.forEach(item => {
    const li = document.createElement("li");
    li.className = "p-4 flex items-center justify-between gap-4";
    li.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${item.image}" alt="${item.name}" class="w-16 h-12 object-cover rounded" loading="lazy">
        <div>
          <div class="font-semibold">${item.name}</div>
          <div class="text-sm text-gray-500">${formatCurrency(item.price)}</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <input type="number" min="1" value="${item.quantity}" class="w-16 text-center rounded border border-gray-300 dark:border-gray-600 px-2 py-1 qty-input" data-id="${item.id}">
        <button class="remove-cart text-red-600 hover:underline" data-id="${item.id}">Remove</button>
      </div>
    `;
    frag.appendChild(li);
  });
  cartItemsList.appendChild(frag);

  // attach events
  cartItemsList.querySelectorAll(".qty-input").forEach(inp => {
    inp.addEventListener("change", e => {
      const id = parseInt(e.currentTarget.dataset.id);
      const q = parseInt(e.currentTarget.value) || 1;
      changeCartQty(id, q);
    });
  });
  cartItemsList.querySelectorAll(".remove-cart").forEach(btn => btn.addEventListener("click", e => {
    removeFromCart(parseInt(e.currentTarget.dataset.id));
  }));
  updateCartTotal();
}
function updateCartTotal() {
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  cartTotalPrice.textContent = formatCurrency(total);
}
function renderWishlistItems() {
  wishlistItemsList.innerHTML = "";
  if (!wishlist.length) {
    wishlistItemsList.innerHTML = `<li class="p-4 text-gray-500">No items in wishlist.</li>`;
    return;
  }
  const frag = document.createDocumentFragment();
  wishlist.forEach(item => {
    const li = document.createElement("li");
    li.className = "p-4 flex items-center justify-between gap-4";
    li.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${item.image}" alt="${item.name}" class="w-16 h-12 object-cover rounded" loading="lazy">
        <div>
          <div class="font-semibold">${item.name}</div>
          <div class="text-sm text-gray-500">${formatCurrency(item.price)}</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="move-to-cart btn-animated bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded" data-id="${item.id}">Add to Cart</button>
        <button class="remove-wishlist text-red-600 hover:underline" data-id="${item.id}">Remove</button>
      </div>
    `;
    frag.appendChild(li);
  });
  wishlistItemsList.appendChild(frag);

  wishlistItemsList.querySelectorAll(".move-to-cart").forEach(btn => btn.addEventListener("click", e => {
    const id = parseInt(e.currentTarget.dataset.id);
    addToCart(id);
    wishlist = wishlist.filter(i => i.id !== id);
    saveState();
    updateCounters();
    renderWishlistItems();
  }));
  wishlistItemsList.querySelectorAll(".remove-wishlist").forEach(btn => btn.addEventListener("click", e => {
    const id = parseInt(e.currentTarget.dataset.id);
    wishlist = wishlist.filter(i => i.id !== id);
    saveState();
    updateCounters();
    renderWishlistItems();
    showToast("Removed from wishlist");
  }));
}

// ------------------------------
// Modal behavior & accessibility
// ------------------------------
function openModal(modal) {
  if (!modal) return;
  lastFocusedElement = document.activeElement;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  // trap focus
  trapFocus(modal);
}
function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  releaseFocusTrap();
  if (lastFocusedElement) lastFocusedElement.focus();
}
function trapFocus(modal) {
  const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first) return;

  function handleKey(e) {
    if (e.key === "Tab") {
      if (e.shiftKey) { // shift + tab
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else { // tab
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    } else if (e.key === "Escape") {
      // close modal on Esc
      closeModal(modal);
    }
  }
  modal._keyHandler = handleKey;
  document.addEventListener("keydown", handleKey);
  // focus first
  setTimeout(() => first.focus(), 50);
}
function releaseFocusTrap() {
  document.removeEventListener("keydown", (e) => {}); // noop - removed via handler reference below if exist
  // if modal stored handler, remove it
  [productModal, cartModal, wishlistModal, checkoutModal].forEach(m => {
    if (m && m._keyHandler) {
      document.removeEventListener("keydown", m._keyHandler);
      delete m._keyHandler;
    }
  });
}

// Product details handler
function onViewDetails(e) {
  const id = parseInt(e.currentTarget.dataset.id);
  const p = products.find(x => x.id === id);
  if (!p) return;
  modalName.textContent = p.name;
  modalImage.src = p.image;
  modalImage.alt = p.name;
  modalDesc.textContent = p.description;
  modalPrice.textContent = formatCurrency(p.price);
  modalAddToCart.onclick = () => {
    addToCart(p.id);
    closeModal(productModal);
  };
  modalBuyNow.onclick = () => {
    addToCart(p.id);
    closeModal(productModal);
    openModal(checkoutModal);
  };
  openModal(productModal);
}

// ------------------------------
// Checkout handling
// ------------------------------
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validateCard(card) {
  // Very simple check: digits only and length 13-19 (common card lengths)
  const digits = card.replace(/\s+/g, "").replace(/[^0-9]/g, "");
  return /^\d{13,19}$/.test(digits);
}
if (checkoutForm) {
  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = checkoutForm["name"].value.trim();
    const email = checkoutForm["email"].value.trim();
    const address = checkoutForm["address"].value.trim();
    const card = checkoutForm["card"].value.trim();

    let ok = true;
    if (!name) { errorName.classList.remove("hidden"); ok = false; } else errorName.classList.add("hidden");
    if (!validateEmail(email)) { errorEmail.classList.remove("hidden"); ok = false; } else errorEmail.classList.add("hidden");
    if (!address) { errorAddress.classList.remove("hidden"); ok = false; } else errorAddress.classList.add("hidden");
    if (!validateCard(card)) { errorCard.classList.remove("hidden"); ok = false; } else errorCard.classList.add("hidden");

    if (!ok) return;

    // simulate success
    cart = [];
    saveState();
    updateCounters();
    renderCartItems();
    closeModal(checkoutModal);
    showToast("Order placed successfully!");
  });
}

// ------------------------------
// Event wiring
// ------------------------------
function wireUI() {
  // populate categories and setup filters
  populateCategories();
  priceRangeValue.textContent = `$${priceRange.value}`;
  priceRange.addEventListener("input", () => {
    priceRangeValue.textContent = `$${priceRange.value}`;
    debouncedFilter();
  });
  searchInput.addEventListener("input", debouncedFilter);
  categoryFilter.addEventListener("change", applyFiltersAndSort);
  sortSelect.addEventListener("change", applyFiltersAndSort);

  // modal buttons
  if (productModalClose) productModalClose.addEventListener("click", () => closeModal(productModal));
  if (cartModalClose) cartModalClose.addEventListener("click", () => closeModal(cartModal));
  if (wishlistModalClose) wishlistModalClose.addEventListener("click", () => closeModal(wishlistModal));
  if (checkoutModalClose) checkoutModalClose.addEventListener("click", () => closeModal(checkoutModal));

  // navbar open modals
  if (cartBtn) cartBtn.addEventListener("click", () => { renderCartItems(); openModal(cartModal); });
  if (wishlistBtn) wishlistBtn.addEventListener("click", () => { renderWishlistItems(); openModal(wishlistModal); });
  if (checkoutBtn) checkoutBtn.addEventListener("click", () => { closeModal(cartModal); openModal(checkoutModal); });

  // global Esc to close any open modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      [productModal, cartModal, wishlistModal, checkoutModal].forEach(m => { if (m && !m.classList.contains("hidden")) closeModal(m); });
    }
  });

  // toast area already exists

  // scroll-to-top
  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) scrollToTopBtn.classList.remove("hidden");
    else scrollToTopBtn.classList.add("hidden");
  });
  scrollToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// ------------------------------
// Initialization
// ------------------------------
function init() {
  applyInitialDarkMode();
  populateCategories();
  renderProducts(products);
  updateCounters();
  renderCartItems();
  renderWishlistItems();
  wireUI();
  // ensure filters apply initial state
  applyFiltersAndSort();
}

init();

 
