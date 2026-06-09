import { auth, db, storage } from './firebaseConfig.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { collection, onSnapshot, addDoc, doc, setDoc, getDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
const WAPP_NUMBER = "573177307192";

let products = [];
let cart = [];
let auditLogs = [];
let currentFilter = 'all';
let currentGarmentFilter = 'all';
let currentUser = null;
let currentProductDetail = null;

const ADMIN_EMAIL = 'cuenta.suscriptores@gmail.com';
let userProfile = null;

function getCollectionDisplayName(category) {
  const mapping = {
    'allegra': 'Allegra (E-241)',
    'col2': 'Mila (B-242)',
    'col3': 'Closet de Antonella (B-241)',
    'col4': 'Nostalgia del arte (B-243)'
  };
  return mapping[category] || category;
}

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
const btnDashboard = document.getElementById('btn-dashboard');
const dashboardView = document.getElementById('dashboard-view');
const dashboardTableBody = document.querySelector('#dashboard-view table tbody');
const auditTableBody = document.getElementById('audit-table-body');
const btnDashBack = document.getElementById('btn-dash-back');

// Auth DOM
const authModal = document.getElementById('auth-modal');
const closeAuthModal = document.getElementById('close-auth-modal');
const btnLoginOpen = document.getElementById('btn-login-open');
const btnLogout = document.getElementById('btn-logout');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authName = document.getElementById('auth-name');
const authCollection = document.getElementById('auth-collection');
const authToggleBtn = document.getElementById('auth-toggle-btn');
const authTitle = document.getElementById('auth-title');
const authSubmit = document.getElementById('auth-submit');
const authError = document.getElementById('auth-error');
let isRegisterMode = false;

// Upload DOM
const uploadModal = document.getElementById('upload-modal');
const closeUploadModal = document.getElementById('close-upload-modal');
const btnUploadOpen = document.getElementById('btn-upload-open');
const uploadForm = document.getElementById('upload-form');
const uploadError = document.getElementById('upload-error');

// --- FIREBASE SYNC ---
// --- FIREBASE SYNC ---
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    document.getElementById('btn-login-open').classList.add('hidden');
    document.getElementById('btn-logout').classList.remove('hidden');
    document.getElementById('btn-upload-open').classList.remove('hidden');
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        userProfile = userDoc.data();
      }
    } catch(e) { console.error("Error fetching user profile", e); }
    
    if (user.email === ADMIN_EMAIL) {
      document.getElementById('btn-dashboard').classList.remove('hidden');
    }
  } else {
    userProfile = null;
    document.getElementById('btn-login-open').classList.remove('hidden');
    document.getElementById('btn-logout').classList.add('hidden');
    document.getElementById('btn-upload-open').classList.add('hidden');
    document.getElementById('btn-dashboard').classList.add('hidden');
    
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('main-view').classList.remove('hidden');
  }
  
  // Re-render products to show/hide edit icons
  renderProducts();
});

// Fetch products from Firestore
onSnapshot(collection(db, 'products'), (snapshot) => {
  products = [];
  snapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() });
  });
  renderProducts();
});

// Fetch audit logs
onSnapshot(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc')), (snapshot) => {
  auditLogs = [];
  snapshot.forEach((doc) => {
    auditLogs.push({ id: doc.id, ...doc.data() });
  });
  renderDashboard(); // Re-render dashboard if it's open
});

// Audit Logger
async function logAudit(action, productName) {
  if (!currentUser) return;
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      productName,
      userEmail: currentUser.email,
      userName: currentUser.displayName || currentUser.email.split('@')[0],
      timestamp: new Date()
    });
  } catch (err) {
    console.error("Error logging audit:", err);
  }
}

// --- RENDERING ---

function renderProducts() {
  grid.innerHTML = '';
  const filtered = products.filter(p => {
    const matchesCollection = currentFilter === 'all' || p.category === currentFilter;
    const matchesGarmentType = currentGarmentFilter === 'all' || p.garmentType === currentGarmentFilter;
    return matchesCollection && matchesGarmentType;
  });
  
  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color: #888; text-align: center; grid-column: 1/-1;">No hay prendas en esta colección aún.</p>';
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    if (window.matchMedia("(hover: hover)").matches) {
      card.setAttribute('data-tilt', '');
      card.setAttribute('data-tilt-max', '10');
    }
    
    // Check if user owns the product or is admin
    const canEdit = currentUser && (currentUser.uid === product.authorUid || (userProfile && userProfile.role === 'admin') || currentUser.email === ADMIN_EMAIL);
    
    card.innerHTML = `
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.name}" class="product-image">
        ${canEdit ? `
        <div class="card-actions">
          <button class="btn-card-edit" title="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="btn-card-delete" title="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
        ` : ''}
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${product.price}</p>
      </div>
    `;
    
    card.addEventListener('click', () => showProductDetail(product));

    if (canEdit) {
      const editBtn = card.querySelector('.btn-card-edit');
      const deleteBtn = card.querySelector('.btn-card-delete');
      
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditModal(product);
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if(confirm('¿Estás seguro de que deseas eliminar esta prenda?')) {
            try {
              await logAudit('Eliminar', product.name);
              await deleteDoc(doc(db, 'products', product.id));
            } catch(err) {
              alert('Error al eliminar');
            }
          }
        });
      }
    }

    grid.appendChild(card);
  });
  
  setup3DTilt();
}

function openEditModal(product) {
  document.getElementById('up-name').value = product.name;
  document.getElementById('up-price').value = product.price;
  document.getElementById('up-authors').value = product.authors || '';
  document.getElementById('up-materials').value = product.materials || '';
  document.getElementById('up-collection').value = product.category || 'allegra';
  document.getElementById('up-garment-type').value = product.garmentType || 'prenda_superior';
  document.getElementById('up-sizes').value = product.sizes || '';
  document.getElementById('up-desc').value = product.description || '';
  
  uploadForm.dataset.editId = product.id;
  
  const upCol = document.getElementById('up-collection');
  if (userProfile && userProfile.role !== 'admin' && currentUser?.email !== ADMIN_EMAIL) {
    upCol.disabled = true;
  } else {
    upCol.disabled = false;
  }

  // Populate tempImages with existing product images
  tempImages = [];
  if (product.images && product.images.length > 0) {
    tempImages = product.images.map(url => ({ type: 'existing', url }));
  } else if (product.image) {
    tempImages = [{ type: 'existing', url: product.image }];
  }
  renderUploadPreviews();
  
  uploadModal.classList.remove('hidden');
}

function showProductDetail(product) {
  currentProductDetail = product;
  mainView.classList.add('hidden');
  detailView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'instant' });

  let sizesArr = [];
  if (Array.isArray(product.sizes)) sizesArr = product.sizes;
  else if (typeof product.sizes === 'string') sizesArr = product.sizes.split(',').map(s=>s.trim());

  const sizesHtml = sizesArr.map(size => 
    `<button class="size-btn detail-size-btn" data-size="${size}">${size}</button>`
  ).join('');

  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const hasMultiple = images.length > 1;

  const navButtonsHtml = hasMultiple ? `
    <button id="gallery-prev" class="gallery-nav-btn">&#10094;</button>
    <button id="gallery-next" class="gallery-nav-btn">&#10095;</button>
  ` : '';

  const thumbnailsHtml = hasMultiple ? `
    <div class="thumbnail-strip" id="gallery-thumbnails">
      ${images.map((imgUrl, index) => `
        <img src="${imgUrl}" class="thumbnail-item ${index === 0 ? 'active' : ''}" data-index="${index}" alt="Miniatura ${index + 1}">
      `).join('')}
    </div>
  ` : '';

  detailContent.innerHTML = `
    <div class="detail-grid">
      <div class="gallery-container">
        <div class="main-image-wrapper">
          <img src="${images[0]}" alt="${product.name}" class="detail-image" id="gallery-main">
          ${navButtonsHtml}
        </div>
        ${thumbnailsHtml}
      </div>
      <div>
        <h2 class="detail-title">${product.name}</h2>
        <p class="detail-price">${product.price}</p>
        
        <p class="detail-desc">${product.description}</p>
        
        <div class="detail-meta">
          <p><strong>Colección:</strong> <span>${getCollectionDisplayName(product.category)}</span></p>
          ${product.authors ? `<p><strong>Autores:</strong> ${product.authors}</p>` : ''}
          ${product.materials ? `<p><strong>Materiales:</strong> ${product.materials}</p>` : ''}
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
          ${ (currentUser && (currentUser.uid === product.authorUid || (userProfile && userProfile.role === 'admin'))) ? `
          <div style="display: flex; gap: 10px; margin-top: 20px; border-top: 1px solid #333; padding-top: 20px;">
            <button id="btn-edit-product" style="flex: 1; padding: 10px; background: transparent; border: 1px solid #555; color: #fff; cursor: pointer; border-radius: 4px; transition: background 0.3s;">Editar</button>
            <button id="btn-delete-product" style="flex: 1; padding: 10px; background: #900; border: none; color: #fff; cursor: pointer; border-radius: 4px; transition: background 0.3s;">Eliminar</button>
          </div>
          ` : '' }
        </div>
      </div>
    </div>
  `;

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
    const text = encodeURIComponent(`Hola Seconda, quiero pedir el producto: ${product.name} (Talla: ${selectedSize}).`);
    window.open(`https://wa.me/${WAPP_NUMBER}?text=${text}`, '_blank');
  });

  // Gallery Navigation Lgc
  if (hasMultiple) {
    let currentImageIndex = 0;
    const mainImg = document.getElementById('gallery-main');
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');
    const thumbs = document.querySelectorAll('.thumbnail-item');

    function updateMainImage(index) {
      currentImageIndex = index;
      if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
          mainImg.src = images[currentImageIndex];
          mainImg.style.opacity = '1';
        }, 150);
      }
      thumbs.forEach(t => t.classList.remove('active'));
      const activeThumb = document.querySelector(`.thumbnail-item[data-index="${currentImageIndex}"]`);
      if (activeThumb) {
        activeThumb.classList.add('active');
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        let index = currentImageIndex - 1;
        if (index < 0) index = images.length - 1;
        updateMainImage(index);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        let index = (currentImageIndex + 1) % images.length;
        updateMainImage(index);
      });
    }

    thumbs.forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        updateMainImage(index);
      });
    });

    // Touch swipe gestures for mobile navigation
    if (mainImg) {
      let touchStartX = 0;
      let touchEndX = 0;

      mainImg.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      mainImg.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const swipeThreshold = 50; // pixels
        if (touchEndX < touchStartX - swipeThreshold) {
          // Swipe left -> next image
          let index = (currentImageIndex + 1) % images.length;
          updateMainImage(index);
        } else if (touchEndX > touchStartX + swipeThreshold) {
          // Swipe right -> previous image
          let index = currentImageIndex - 1;
          if (index < 0) index = images.length - 1;
          updateMainImage(index);
        }
      }, { passive: true });
    }
  }

  const btnEdit = document.getElementById('btn-edit-product');
  const btnDelete = document.getElementById('btn-delete-product');
  
  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      openEditModal(product);
    });
  }

  if (btnDelete) {
    btnDelete.addEventListener('click', async () => {
      if(confirm('¿Estás seguro de que deseas eliminar esta prenda?')) {
        try {
          await deleteDoc(doc(db, 'products', product.id));
          hideProductDetail();
        } catch(e) {
          alert('Error al eliminar');
        }
      }
    });
  }
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
  
  const cartTotalPriceEl = document.getElementById('cart-total-price');
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="color: #888; text-align: center; margin-top: 50px;">Tu carrito está vacío.</p>';
    btnCheckoutCart.disabled = true;
    if (cartTotalPriceEl) cartTotalPriceEl.innerText = "$0";
    return;
  }

  let total = 0;
  cart.forEach(item => {
    const numericPrice = parseFloat(item.price.replace(/[$\.]/g, '').replace(/,/g, ''));
    if (!isNaN(numericPrice)) {
      total += numericPrice * item.qty;
    }
  });

  if (cartTotalPriceEl) {
    cartTotalPriceEl.innerText = "$" + total.toLocaleString('es-CO');
  }

  btnCheckoutCart.disabled = false;
  cartItemsContainer.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.name}</h4>
        <p class="cart-item-meta">Talla: ${item.size}</p>
        <p class="cart-item-price">${item.price}</p>
        <div class="cart-item-actions">
          <div class="qty-selector">
            <button class="qty-btn" onclick="updateQty(${index}, -1)">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
          </div>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${index})">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
      </button>
    </div>
  `).join('');
}

function updateQty(index, delta) {
  if (cart[index].qty + delta > 0) {
    cart[index].qty += delta;
  } else {
    removeFromCart(index);
    return;
  }
  updateCartUI();
}

window.removeFromCart = removeFromCart;
window.updateQty = updateQty;

function openCart() {
  cartOverlay.classList.remove('hidden');
  cartDrawer.classList.add('open');
}

function closeCart() {
  cartOverlay.classList.add('hidden');
  cartDrawer.classList.remove('open');
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCartUI();

  // Hero Background Slider
  const heroBgs = document.querySelectorAll('.hero-bg');
  let currentBgIndex = 0;
  if (heroBgs.length > 0) {
    setInterval(() => {
      heroBgs[currentBgIndex].classList.remove('active');
      currentBgIndex = (currentBgIndex + 1) % heroBgs.length;
      heroBgs[currentBgIndex].classList.add('active');
    }, 5000);
  }

  // Filters
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderProducts();
    });
  });

  // Sub-Filters for Garment Type
  const subFilterBtns = document.querySelectorAll('.sub-filter-btn');
  subFilterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      subFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGarmentFilter = btn.getAttribute('data-subfilter');
      renderProducts();
    });
  });

  // Logo → go home
  document.getElementById('logo-home').addEventListener('click', (e) => {
    e.preventDefault();
    closeMobileMenu();
    if (!detailView.classList.contains('hidden')) hideProductDetail();
    if (!dashboardView.classList.contains('hidden')) {
      dashboardView.classList.add('hidden');
      document.getElementById('main-view').classList.remove('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Asesoria Nav click
  const navAsesoria = document.getElementById('nav-asesoria');
  if (navAsesoria) {
    navAsesoria.addEventListener('click', (e) => {
      if (!detailView.classList.contains('hidden') || !dashboardView.classList.contains('hidden')) {
        e.preventDefault();
        hideProductDetail();
        document.getElementById('main-view').classList.remove('hidden');
        dashboardView.classList.add('hidden');
        setTimeout(() => {
          document.getElementById('asesoria').scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      document.querySelector('.nav-links').classList.remove('active');
    });
  }

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinksContainer = document.querySelector('.nav-links');

  function closeMobileMenu() {
    if (navLinksContainer) navLinksContainer.classList.remove('active');
  }

  if (mobileMenuBtn && navLinksContainer) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinksContainer.classList.toggle('active');
    });

    // Close on any nav link click
    navLinksContainer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });

    // Close when clicking outside the navbar
    document.addEventListener('click', (e) => {
      const navbar = document.getElementById('navbar');
      if (!navbar.contains(e.target)) {
        closeMobileMenu();
      }
    });

    // Close when scrolling
    window.addEventListener('scroll', closeMobileMenu, { passive: true });
  }

  document.getElementById('btn-back').addEventListener('click', hideProductDetail);

  // Cart
  document.getElementById('cart-icon').addEventListener('click', (e) => {
    e.preventDefault();
    openCart();
  });
  document.getElementById('close-cart').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  
  btnCheckoutCart.addEventListener('click', () => {
    let orderText = "Hola Seconda, quiero hacer el siguiente pedido:\n\n";
    cart.forEach(item => {
      orderText += `- ${item.name} (Talla: ${item.size}) x${item.qty}\n`;
    });
    window.open(`https://wa.me/${WAPP_NUMBER}?text=${encodeURIComponent(orderText)}`, '_blank');
  });

  // Auth Modal
  btnLoginOpen.addEventListener('click', () => {
    authModal.classList.remove('hidden');
  });
  closeAuthModal.addEventListener('click', () => {
    authModal.classList.add('hidden');
  });
  function toggleAuthMode(e) {
    if (e) e.preventDefault();
    isRegisterMode = !isRegisterMode;
    authTitle.innerText = isRegisterMode ? 'Registrarse' : 'Iniciar Sesión';
    authSubmit.innerText = isRegisterMode ? 'Crear Cuenta' : 'Entrar';
    
    if (isRegisterMode) {
      authName.classList.remove('hidden');
      authName.setAttribute('required', 'true');
      authCollection.classList.remove('hidden');
      authCollection.setAttribute('required', 'true');
      document.getElementById('auth-toggle-text').innerHTML = `¿Ya tienes cuenta? <a href="#" id="auth-toggle-btn" style="color: var(--color-accent);">Entrar</a>`;
    } else {
      authName.classList.add('hidden');
      authName.removeAttribute('required');
      authCollection.classList.add('hidden');
      authCollection.removeAttribute('required');
      document.getElementById('auth-toggle-text').innerHTML = `¿No tienes cuenta? <a href="#" id="auth-toggle-btn" style="color: var(--color-accent);">Regístrate</a>`;
    }
    
    document.getElementById('auth-toggle-btn').addEventListener('click', toggleAuthMode);
  }

  authToggleBtn.addEventListener('click', toggleAuthMode);

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;
    const name = authName.value;
    authError.innerText = '';
    
    try {
      if (isRegisterMode) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // Save to users collection
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          name: name,
          collection: authCollection.value,
          role: email === ADMIN_EMAIL ? 'admin' : 'user'
        });

        // Update local currentUser immediately so upload sees it without reload
        currentUser = { ...userCredential.user, displayName: name };
        userProfile = { email, name, collection: authCollection.value, role: email === ADMIN_EMAIL ? 'admin' : 'user' };
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      authModal.classList.add('hidden');
      authForm.reset();
    } catch (err) {
      authError.innerText = 'Error: No se pudo completar la acción. Verifica si tienes Auth habilitado en Firebase.';
    }
  });

  btnLogout.addEventListener('click', () => {
    signOut(auth);
  });

  // Upload Modal and Drag & Drop
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('up-file');
  const dropText = document.getElementById('drop-text');
  let tempImages = [];

  btnUploadOpen.addEventListener('click', () => {
    if (userProfile && userProfile.role !== 'admin') {
      const upCol = document.getElementById('up-collection');
      upCol.value = userProfile.collection || 'allegra';
      upCol.disabled = true;
    } else {
      document.getElementById('up-collection').disabled = false;
    }
    uploadModal.classList.remove('hidden');
  });
  
  closeUploadModal.addEventListener('click', () => {
    uploadModal.classList.add('hidden');
    resetUploadForm();
  });

  function resetUploadForm() {
    uploadForm.reset();
    tempImages = [];
    delete uploadForm.dataset.editId;
    renderUploadPreviews();
  }

  function renderUploadPreviews() {
    const previewContainer = document.getElementById('preview-container');
    previewContainer.innerHTML = '';
    
    if (tempImages.length === 0) {
      previewContainer.classList.add('hidden');
      dropText.classList.remove('hidden');
      return;
    }
    
    previewContainer.classList.remove('hidden');
    dropText.classList.add('hidden');
    
    tempImages.forEach((img, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'preview-thumb-wrapper';
      
      const imgSrc = img.type === 'existing' ? img.url : img.previewUrl;
      
      wrapper.innerHTML = `
        <img src="${imgSrc}" class="preview-thumb" alt="Preview">
        <button type="button" class="preview-thumb-remove" onclick="removeTempImage(${idx})">&times;</button>
      `;
      previewContainer.appendChild(wrapper);
    });
  }

  window.removeTempImage = function(index) {
    tempImages.splice(index, 1);
    renderUploadPreviews();
  };

  // Drag and drop events
  dropzone.addEventListener('click', () => fileInput.click());
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  });

  function handleFileSelect(files) {
    let invalidCount = 0;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        invalidCount++;
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        tempImages.push({
          type: 'new',
          file: file,
          previewUrl: e.target.result
        });
        renderUploadPreviews();
      };
      reader.readAsDataURL(file);
    });
    
    if (invalidCount > 0) {
      uploadError.innerText = 'Algunos archivos no eran imágenes válidas y se omitieron.';
    } else {
      uploadError.innerText = '';
    }
  }

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    uploadError.innerText = '';
    
    if (!currentUser) {
      uploadError.innerText = 'Debes iniciar sesión para subir una prenda.';
      return;
    }

    if (tempImages.length === 0) {
      uploadError.innerText = 'Por favor, selecciona o arrastra al menos una imagen.';
      return;
    }

    const name = document.getElementById('up-name').value;
    const price = document.getElementById('up-price').value;
    const authors = document.getElementById('up-authors').value;
    const materials = document.getElementById('up-materials').value;
    const category = (userProfile && userProfile.role !== 'admin') 
      ? userProfile.collection || 'allegra' 
      : document.getElementById('up-collection').value;
    const garmentType = document.getElementById('up-garment-type').value;
    const sizes = document.getElementById('up-sizes').value;
    const description = document.getElementById('up-desc').value;
    
    const submitBtn = uploadForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Subiendo fotos...';
    submitBtn.disabled = true;

    try {
      const finalUrls = [];
      for (const img of tempImages) {
        if (img.type === 'existing') {
          finalUrls.push(img.url);
        } else if (img.type === 'new') {
          const fileRef = ref(storage, `products/${Date.now()}_${img.file.name}`);
          const uploadResult = await uploadBytes(fileRef, img.file);
          const downloadURL = await getDownloadURL(uploadResult.ref);
          finalUrls.push(downloadURL);
        }
      }

      if (finalUrls.length === 0) {
        throw new Error("Se requiere al menos una imagen.");
      }

      const editId = uploadForm.dataset.editId;
      const productData = {
        name,
        price,
        authors,
        materials,
        category,
        garmentType,
        sizes,
        description,
        image: finalUrls[0],
        images: finalUrls
      };
      
      if (editId) {
        // Update existing document
        await updateDoc(doc(db, 'products', editId), productData);
        await logAudit('Editar', name);
      } else {
        // Save new document to Firestore
        await addDoc(collection(db, 'products'), {
          ...productData,
          author: currentUser.displayName || currentUser.email.split('@')[0],
          authorEmail: currentUser.email,
          authorUid: currentUser.uid,
          createdAt: new Date()
        });
        await logAudit('Crear', name);
      }
      
      uploadModal.classList.add('hidden');
      resetUploadForm();
    } catch (err) {
      console.error(err);
      uploadError.innerText = 'Error al subir: Verifica tu conexión y que Firebase Storage esté habilitado.';
    } finally {
      submitBtn.innerText = originalText;
      submitBtn.disabled = false;
    }
  });

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
  
  // Dashboard Logic
  btnDashboard.addEventListener('click', () => {
    document.getElementById('main-view').classList.add('hidden');
    document.getElementById('detail-view').classList.add('hidden');
    dashboardView.classList.remove('hidden');
    renderDashboard();
  });
  
  btnDashBack.addEventListener('click', () => {
    dashboardView.classList.add('hidden');
    document.getElementById('main-view').classList.remove('hidden');
  });
});

function renderDashboard() {
  dashboardTableBody.innerHTML = products.map(product => `
    <tr style="border-bottom: 1px solid var(--color-card-border);">
      <td style="padding: 15px;"><img src="${product.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
      <td style="padding: 15px;">${product.name}</td>
      <td style="padding: 15px;">${product.author || 'Anónimo'} <br><small style="color: var(--color-text-muted);">${product.authorEmail || ''}</small></td>
      <td style="padding: 15px;">
        ${getCollectionDisplayName(product.category)}
        <br><small style="color: var(--color-text-muted); text-transform: uppercase;">${(product.garmentType || 'prenda_superior').replace('_', ' ')}</small>
      </td>
      <td style="padding: 15px;">
        <button onclick="deleteProductFromDash('${product.id}', '${product.name.replace(/'/g, "\\'")}')" style="background: #900; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Eliminar</button>
      </td>
    </tr>
  `).join('');

  if (auditTableBody) {
    auditTableBody.innerHTML = auditLogs.map(log => {
      const date = log.timestamp && log.timestamp.toDate ? log.timestamp.toDate() : new Date();
      const formattedDate = date.toLocaleString('es-CO');
      
      let actionColor = 'var(--color-text)';
      if (log.action === 'Crear') actionColor = '#25D366';
      if (log.action === 'Editar') actionColor = 'var(--color-accent)';
      if (log.action === 'Eliminar') actionColor = '#ff4444';

      return `
        <tr style="border-bottom: 1px solid var(--color-card-border);">
          <td style="padding: 15px; color: var(--color-text-muted);">${formattedDate}</td>
          <td style="padding: 15px; font-weight: bold; color: ${actionColor};">${log.action}</td>
          <td style="padding: 15px;">${log.productName}</td>
          <td style="padding: 15px;">${log.userName || 'Usuario'} <br><small style="color: var(--color-text-muted);">${log.userEmail}</small></td>
        </tr>
      `;
    }).join('');
  }
}

window.deleteProductFromDash = async function(id, name) {
  if(confirm('¿Seguro que deseas eliminar esta prenda desde el dashboard?')) {
    try {
      await logAudit('Eliminar', name);
      await deleteDoc(doc(db, 'products', id));
      renderDashboard(); // Re-render table since snapshot will update products array
    } catch(e) {
      alert('Error al eliminar');
    }
  }
};

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
