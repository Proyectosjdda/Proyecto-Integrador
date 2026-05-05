const WAPP_NUMBER = "573177307192";

// Products Data
const products = [
  {
    id: 1,
    name: "Conjunto Haute Couture Borgoña",
    category: "nina",
    price: "$2,500",
    image: "./conjunto_borgona.jpg",
    sizes: ["8", "10", "12"],
    author: "Valentina Sierra Perez",
    description: "Diseñado para ocasiones muy especiales como visitas a galerías de arte o reuniones familiares exclusivas. Este majestuoso conjunto fusiona la elegancia clásica con una paleta de colores sofisticada en borgoña, negro, blanco y gris.",
    materials: "Chaqueta estructurada en Scuba Luxury negro y borgoña, con encaje blanco y detalles de Faux Fur (ecopiel) en puños y cuello. Falda de gran vuelo confeccionada en seda Mikado y Jacquard, con acentos de encaje negro. Forro interior de punto de viscosa extrasuave.",
    history: "La matriz de este diseño de alta moda nace de la fusión de texturas premium. Cada capa de la falda y la estructura de la chaqueta fueron seleccionadas meticulosamente (Scuba, Mikado, Jacquard) para garantizar un aspecto de lujo absoluto y comodidad inigualable."
  },
  {
    id: 2,
    name: "Traje Sastre Moderno",
    category: "nino",
    price: "$1,850",
    image: "./premium_suit_1777947112656.png",
    sizes: ["8", "10", "12"],
    author: "Valou Design Team",
    description: "Un traje a medida meticulosamente confeccionado. Perfecto para ceremonias y eventos donde el porte es imprescindible.",
    materials: "Lana virgen fría 120s, Forro de cupro transpirable.",
    history: "Nacido de la necesidad de ofrecer sastrería tradicional europea adaptada al dinamismo y confort que requieren los niños."
  },
  {
    id: 3,
    name: "Blusa Couture Champagne",
    category: "nina",
    price: "$850",
    image: "./premium_blouse_1777947132769.png",
    sizes: ["8", "10", "12"],
    author: "Valou Design Team",
    description: "Blusa minimalista con un tono champagne deslumbrante. El corte moderno la hace versátil tanto para faldas de tul como pantalones de vestir.",
    materials: "Seda charmeuse, Botones de nácar natural.",
    history: "Una pieza atemporal. Su diseño fue finalizado tras meses de buscar el tono dorado perfecto que reflejara la luz del atardecer."
  }
];

let cart = [];
let currentFilter = 'all';
let currentProductDetail = null;

// DOM Elements
const mainView = document.getElementById('main-view');
const detailView = document.getElementById('detail-view');
const detailContent = document.getElementById('detail-content');
const grid = document.getElementById('product-grid');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const btnCheckoutCart = document.getElementById('btn-checkout-cart');
const btnTop = document.getElementById('btn-top');

// --- RENDERING ---

function renderProducts() {
  grid.innerHTML = '';
  const filtered = currentFilter === 'all' ? products : products.filter(p => p.category === currentFilter);
  
  filtered.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    if (window.matchMedia("(hover: hover)").matches) {
      card.setAttribute('data-tilt', '');
      card.setAttribute('data-tilt-max', '10');
    }
    
    card.innerHTML = `
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.name}" class="product-image">
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${product.price}</p>
      </div>
    `;
    
    card.addEventListener('click', () => showProductDetail(product));
    grid.appendChild(card);
  });
  
  setup3DTilt();
}

function showProductDetail(product) {
  currentProductDetail = product;
  mainView.classList.add('hidden');
  detailView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'instant' });

  const sizesHtml = product.sizes.map(size => 
    `<button class="size-btn detail-size-btn" data-size="${size}">${size}</button>`
  ).join('');

  detailContent.innerHTML = `
    <div class="detail-grid">
      <div>
        <img src="${product.image}" alt="${product.name}" class="detail-image">
      </div>
      <div>
        <h2 class="detail-title">${product.name}</h2>
        <p class="detail-price">${product.price}</p>
        
        <p class="detail-desc">${product.description}</p>
        
        <div class="detail-meta">
          <p><strong>Materiales:</strong> ${product.materials}</p>
          <p><strong>Historia:</strong> ${product.history}</p>
          <p><strong>Hecho por:</strong> ${product.author}</p>
        </div>

        <div style="margin-bottom: 10px;"><strong>Selecciona una Talla:</strong></div>
        <div class="size-selector" id="detail-sizes">
          ${sizesHtml}
        </div>

        <div class="action-buttons">
          <button class="btn-cart" id="btn-add-cart" disabled>Añadir al Carrito</button>
          <button class="btn-whatsapp" id="btn-buy-direct" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827zM22.002 12c0-5.514-4.486-10-10-10-5.512 0-10 4.486-10 10 0 1.827.49 3.536 1.349 5.05l-1.35 4.95 5.093-1.33c1.477.781 3.167 1.225 4.935 1.225l.006-.002c5.512 0 10-4.486 10-10zm-10 8.058l-.004.002c-1.554 0-3.075-.417-4.402-1.204l-.316-.188-3.27.854.87-3.188-.206-.328c-.868-1.381-1.325-2.981-1.325-4.606 0-4.409 3.589-8 8-8s8 3.591 8 8-3.589 8-8 8z"/></svg>
            Comprar Ahora por WhatsApp
          </button>
        </div>
      </div>
    </div>
  `;

  // Size selection logic
  let selectedSize = null;
  const sizeBtns = document.querySelectorAll('.detail-size-btn');
  const btnAddCart = document.getElementById('btn-add-cart');
  const btnBuyDirect = document.getElementById('btn-buy-direct');

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      selectedSize = e.target.getAttribute('data-size');
      btnAddCart.disabled = false;
      btnBuyDirect.disabled = false;
    });
  });

  btnAddCart.addEventListener('click', () => {
    addToCart(product, selectedSize);
    openCart();
  });

  btnBuyDirect.addEventListener('click', () => {
    const text = encodeURIComponent(`Hola Valou, quiero pedir el producto: ${product.name} (Talla: ${selectedSize}).`);
    window.open(`https://wa.me/${WAPP_NUMBER}?text=${text}`, '_blank');
  });
}

function hideProductDetail() {
  detailView.classList.add('hidden');
  mainView.classList.remove('hidden');
  window.scrollTo({ top: document.getElementById('collections').offsetTop - 100, behavior: 'smooth' });
}

// --- CART LOGIC ---

function addToCart(product, size) {
  const existing = cart.find(i => i.id === product.id && i.size === size);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, size, qty: 1 });
  }
  updateCartUI();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function updateCartUI() {
  cartCount.innerText = cart.reduce((acc, item) => acc + item.qty, 0);
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="color: #888; text-align: center; margin-top: 50px;">Tu carrito está vacío.</p>';
    btnCheckoutCart.disabled = true;
    return;
  }

  btnCheckoutCart.disabled = false;
  cartItemsContainer.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.name}</h4>
        <p class="cart-item-meta">Talla: ${item.size} | Cantidad: ${item.qty}</p>
        <p class="cart-item-price">${item.price}</p>
        <button class="cart-item-remove" onclick="removeFromCart(${index})">Eliminar</button>
      </div>
    </div>
  `).join('');
}

// Global scope for onclick
window.removeFromCart = removeFromCart;

function openCart() {
  cartOverlay.classList.remove('hidden');
  cartDrawer.classList.add('open');
}

function closeCart() {
  cartOverlay.classList.add('hidden');
  cartDrawer.classList.remove('open');
}

btnCheckoutCart.addEventListener('click', () => {
  let orderText = "Hola Valou, quiero hacer el siguiente pedido:\n\n";
  cart.forEach(item => {
    orderText += `- ${item.name} (Talla: ${item.size}) x${item.qty}\n`;
  });
  window.open(`https://wa.me/${WAPP_NUMBER}?text=${encodeURIComponent(orderText)}`, '_blank');
});


// --- INITIALIZATION & EVENTS ---

document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCartUI();

  // Filters
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.getAttribute('data-filter');
      renderProducts();
    });
  });

  // Navigation
  document.getElementById('nav-home').addEventListener('click', (e) => {
    if (!detailView.classList.contains('hidden')) {
      e.preventDefault();
      hideProductDetail();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  document.getElementById('nav-collections').addEventListener('click', (e) => {
    if (!detailView.classList.contains('hidden')) {
      e.preventDefault();
      hideProductDetail();
    }
  });

  document.getElementById('btn-back').addEventListener('click', hideProductDetail);

  // Cart toggles
  document.getElementById('cart-icon').addEventListener('click', (e) => {
    e.preventDefault();
    openCart();
  });
  document.getElementById('close-cart').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  // Back to Top Button
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      btnTop.classList.remove('hidden');
    } else {
      btnTop.classList.add('hidden');
    }
  });

  btnTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// Vanilla JS 3D Tilt Effect
function setup3DTilt() {
  if (!window.matchMedia("(hover: hover)").matches) return;
  const elements = document.querySelectorAll('[data-tilt]');
  elements.forEach(el => {
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
  });
  function handleMouseMove(e) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const maxTilt = el.getAttribute('data-tilt-max') || 10;
    const tiltX = ((y - centerY) / centerY) * -maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;
    el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
  }
  function handleMouseLeave(e) {
    const el = e.currentTarget;
    el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  }
}
