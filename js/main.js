// تهيئة Supabase
const supabaseUrl = 'https://gtssadkmirharqiksgnz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0c3NhZGttaXJoYXJxaWtzZ256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNjEwNjIsImV4cCI6MjA2NzgzNzA2Mn0.SwYUMwavJwTxNS19kpObN5O74Cy3K5-ZOa98jOCUlBs';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// إدارة سلة التسوق
const cart = [];
const cartIcon = document.getElementById('cart-icon');
const cartOverlay = document.getElementById('cart-overlay');
const cartContainer = document.getElementById('cart-container');
const closeCart = document.getElementById('close-cart');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.querySelector('.cart-count');
const checkoutBtn = document.getElementById('checkout-btn');

// عناصر لوحة التحكم
const adminLink = document.getElementById('admin-link');
const adminPanel = document.getElementById('admin-panel');
const addProductForm = document.getElementById('add-product-form');
const productsContainer = document.getElementById('products-container');
const adminProductsList = document.getElementById('admin-products-list');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const previewText = document.getElementById('preview-text');
const productImageInput = document.getElementById('product-image');
const backToStoreBtn = document.getElementById('back-to-store');
const productImagesInput = document.getElementById('product-images');
const imagesPreview = document.getElementById('images-preview');
const addOptionBtn = document.getElementById('add-option');
const optionsContainer = document.getElementById('options-container');

// العناصر الرئيسية للصفحة
const heroSection = document.querySelector('.hero');
const featuresSection = document.querySelector('.features');
const productsSection = document.querySelector('.products');
const whatsappSection = document.getElementById('whatsapp-group');
const footerSection = document.querySelector('footer');
const productDetailSection = document.getElementById('product-detail');

// مصفوفة لتخزين المنتجات
let products = [];

// إدارة كلمة المرور
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const changePasswordForm = document.getElementById('change-password-form');
const passwordInput = document.getElementById('password');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');

// كلمة المرور الافتراضية (يمكن تغييرها)
const DEFAULT_PASSWORD = "admin123";

// تحميل كلمة المرور من Supabase
async function getStoredPassword() {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('password_hash')
    .single();
  
  if (error || !data) {
    // إذا لم توجد كلمة مرور محفوظة، استخدم الافتراضية
    return hashPassword(DEFAULT_PASSWORD);
  }
  
  return data.password_hash;
}

// حفظ كلمة المرور في Supabase
async function storePasswordHash(hash) {
  const { error } = await supabase
    .from('admin_settings')
    .upsert({ id: 1, password_hash: hash });
  
  if (error) {
    console.error('Error saving password:', error);
    showNotification('حدث خطأ في حفظ كلمة المرور');
  }
}

// دالة التشفير البسيطة (يمكن استبدالها بخوارزمية أقوى)
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

// التحقق من كلمة المرور
async function verifyPassword(password) {
  const storedHash = await getStoredPassword();
  return hashPassword(password) === storedHash;
}

// عرض نموذج تسجيل الدخول
function showLoginForm() {
  loginOverlay.style.display = 'flex';
  passwordInput.focus();
}

// إخفاء نموذج تسجيل الدخول
function hideLoginForm() {
  loginOverlay.style.display = 'none';
}

// معالجة تسجيل الدخول
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const password = passwordInput.value;
  
  if (await verifyPassword(password)) {
    hideLoginForm();
    showAdminPanel();
    showNotification('تم تسجيل الدخول بنجاح');
  } else {
    showNotification('كلمة المرور غير صحيحة');
    passwordInput.value = '';
    passwordInput.focus();
  }
});

// معالجة تغيير كلمة المرور
changePasswordForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  
  if (!(await verifyPassword(currentPassword))) {
    showNotification('كلمة المرور الحالية غير صحيحة');
    currentPasswordInput.focus();
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showNotification('كلمة المرور الجديدة غير متطابقة');
    newPasswordInput.focus();
    return;
  }
  
  if (newPassword.length < 6) {
    showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    newPasswordInput.focus();
    return;
  }
  
  // حفظ كلمة المرور الجديدة
  const newHash = hashPassword(newPassword);
  await storePasswordHash(newHash);
  
  // إعادة تعيين النموذج
  changePasswordForm.reset();
  
  showNotification('تم تغيير كلمة المرور بنجاح');
});

// تعديل معالج حدث رابط لوحة التحكم
adminLink.addEventListener('click', (e) => {
  e.preventDefault();
  showLoginForm();
});

// تعديل وظيفة العودة إلى المتجر لإعادة تحميل الصفحة
backToStoreBtn.addEventListener('click', (e) => {
  e.preventDefault();
  location.reload();
});

// فتح وإغلاق سلة التسوق
cartIcon.addEventListener('click', () => {
  cartContainer.classList.add('active');
  cartOverlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
});

closeCart.addEventListener('click', closeCartHandler);
cartOverlay.addEventListener('click', closeCartHandler);

function closeCartHandler() {
  cartContainer.classList.remove('active');
  cartOverlay.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// وظيفة لإظهار لوحة التحكم
function showAdminPanel() {
  adminPanel.style.display = 'block';
  heroSection.style.display = 'none';
  featuresSection.style.display = 'none';
  productsSection.style.display = 'none';
  whatsappSection.style.display = 'none';
  footerSection.style.display = 'none';
  productDetailSection.style.display = 'none';
  
  // تحميل منتجات لوحة التحكم
  loadAdminProducts();
  // تحميل الطلبات
  loadOrders();
}

// وظيفة لإظهار الأقسام الرئيسية
function showMainSections() {
  adminPanel.style.display = 'none';
  heroSection.style.display = 'flex';
  featuresSection.style.display = 'block';
  productsSection.style.display = 'block';
  whatsappSection.style.display = 'block';
  footerSection.style.display = 'block';
  productDetailSection.style.display = 'none';
  
  // تحديث المنتجات في الصفحة الرئيسية
  renderProducts();
}

// معاينة صورة المنتج الرئيسية
productImageInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      previewImg.style.display = 'block';
      previewText.style.display = 'none';
    }
    reader.readAsDataURL(file);
  }
});

// معاينة الصور الإضافية
productImagesInput.addEventListener('change', function(e) {
  imagesPreview.innerHTML = '';
  const files = e.target.files;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const imgContainer = document.createElement('div');
      imgContainer.style.position = 'relative';
      imgContainer.style.width = '100%';
      imgContainer.style.height = '100px';
      imgContainer.style.overflow = 'hidden';
      imgContainer.style.borderRadius = '5px';
      imgContainer.style.border = '1px solid #ddd';
      
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      
      imgContainer.appendChild(img);
      imagesPreview.appendChild(imgContainer);
    };
    
    reader.readAsDataURL(file);
  }
});

// إضافة خيار جديد
addOptionBtn.addEventListener('click', function() {
  const optionDiv = document.createElement('div');
  optionDiv.className = 'option-group';
  optionDiv.innerHTML = `
    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
      <input type="text" placeholder="اسم الخيار (مثل: لون)" class="option-name" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
      <input type="text" placeholder="قيم الخيار (مفصولة بفاصلة)" class="option-values" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
      <button type="button" class="btn btn-danger remove-option" style="padding: 8px;"><i class="fas fa-trash"></i></button>
    </div>
  `;
  
  optionsContainer.appendChild(optionDiv);
  
  // إضافة حدث لحذف هذا الخيار
  optionDiv.querySelector('.remove-option').addEventListener('click', function() {
    optionsContainer.removeChild(optionDiv);
  });
});

// دالة مساعدة للحصول على نص العلامة
function getBadgeText(badge) {
  switch(badge) {
    case 'new': return 'جديد';
    case 'best-seller': return 'الأكثر مبيعاً';
    case 'offer': return 'عروض';
    default: return '';
  }
}

// حفظ المنتجات في Supabase
async function saveProductsToStorage() {
  const { data, error } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'id' });
  
  if (error) {
    console.error('Error saving products:', error);
    showNotification('حدث خطأ في حفظ المنتجات');
  }
}

// تحميل المنتجات من Supabase
async function loadProductsFromStorage() {
  const { data, error } = await supabase
    .from('products')
    .select('*');
  
  if (error) {
    console.error('Error loading products:', error);
    showNotification('حدث خطأ في تحميل المنتجات');
    // استخدام المنتجات الافتراضية إذا فشل التحميل
    renderProducts();
  } else if (data && data.length > 0) {
    products = data;
    renderProducts();
  } else {
    // إذا لم توجد منتجات محفوظة، استخدم المنتجات الافتراضية
    renderProducts();
  }
}

// عرض المنتجات في الصفحة الرئيسية
function renderProducts() {
  productsContainer.innerHTML = '';
  
  if (products.length === 0) {
    productsContainer.innerHTML = '<p class="no-products">لا توجد منتجات متاحة حالياً</p>';
    return;
  }
  
  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.innerHTML = `
      ${product.badge ? `<div class="product-badge">${getBadgeText(product.badge)}</div>` : ''}
      <div class="product-image" style="background-image: url('${product.imageData}')">
        <img src="${product.imageData}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-price">
          <span class="price">${product.price} ر.س</span>
          <div class="add-to-cart" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
            <i class="fas fa-plus"></i>
          </div>
        </div>
      </div>
    `;
    
    productsContainer.appendChild(productCard);
    
    // إضافة حدث النقر لزر إضافة إلى السلة
    productCard.querySelector('.add-to-cart').addEventListener('click', function(e) {
      e.stopPropagation();
      addToCart(this.dataset.id, this.dataset.name, parseFloat(this.dataset.price), this.dataset.image);
    });
    
    // إضافة حدث النقر لفتح تفاصيل المنتج
    productCard.addEventListener('click', function() {
      showProductDetail(product.id);
    });
  });
}

// تحميل منتجات لوحة التحكم
function loadAdminProducts() {
  adminProductsList.innerHTML = '';
  
  if (products.length === 0) {
    adminProductsList.innerHTML = `
      <div class="no-products">
        <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px;"></i>
        <p>لا توجد منتجات مضافة بعد</p>
      </div>
    `;
    return;
  }
  
  products.forEach(product => {
    const productElement = document.createElement('div');
    productElement.className = 'admin-product';
    productElement.innerHTML = `
      <img src="${product.imageData}" alt="${product.name}" style="width: 100%; height: 150px; object-fit: contain;">
      <div class="admin-product-info">
        <h4>${product.name}</h4>
        <p>${product.description}</p>
        <div class="price">${product.price} ر.س</div>
        <div class="admin-product-actions">
          <button class="btn btn-danger delete-product" data-id="${product.id}">
            <i class="fas fa-trash"></i> حذف
          </button>
        </div>
      </div>
    `;
    
    adminProductsList.appendChild(productElement);
    
    // إضافة حدث الحذف
    productElement.querySelector('.delete-product').addEventListener('click', function() {
      deleteProduct(this.dataset.id);
    });
  });
}

// حذف منتج
async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting product:', error);
    showNotification('حدث خطأ في حذف المنتج');
    return;
  }
  
  // إزالة المنتج من المصفوفة المحلية
  products = products.filter(product => product.id !== id);
  
  // إعادة تحميل المنتجات في الصفحة الرئيسية
  renderProducts();
  
  // إعادة تحميل لوحة التحكم
  loadAdminProducts();
  
  showNotification('تم حذف المنتج بنجاح');
}

// تحميل الطلبات
async function loadOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error loading orders:', error);
    showNotification('حدث خطأ في تحميل الطلبات');
    return;
  }
  
  renderOrders(data);
}

// عرض الطلبات
function renderOrders(orders) {
  const ordersContainer = document.getElementById('orders-container');
  if (!ordersContainer) return;
  
  ordersContainer.innerHTML = '';
  
  if (orders.length === 0) {
    ordersContainer.innerHTML = '<p class="no-orders">لا توجد طلبات بعد</p>';
    return;
  }
  
  orders.forEach(order => {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-card';
    orderElement.innerHTML = `
      <div class="order-header">
        <h4>طلب #${order.id.slice(0, 8)}</h4>
        <span class="order-status ${order.status}">${order.status}</span>
      </div>
      <div class="order-details">
        <p>التاريخ: ${new Date(order.created_at).toLocaleString()}</p>
        <p>الإجمالي: ${order.total} ر.س</p>
        <button class="btn btn-primary view-order" data-id="${order.id}">
          <i class="fas fa-eye"></i> عرض التفاصيل
        </button>
      </div>
    `;
    
    ordersContainer.appendChild(orderElement);
    
    // إضافة معالج الحدث لعرض التفاصيل
    orderElement.querySelector('.view-order').addEventListener('click', () => {
      showOrderDetails(order.id);
    });
  });
}

// عرض تفاصيل الطلب
async function showOrderDetails(orderId) {
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  
  if (error || !order) {
    console.error('Error loading order:', error);
    showNotification('حدث خطأ في تحميل تفاصيل الطلب');
    return;
  }
  
  // بناء HTML لعناصر الطلب
  let itemsHTML = '';
  order.items.forEach(item => {
    itemsHTML += `
      <div class="order-item">
        <div class="item-name">${item.name}</div>
        <div class="item-quantity">${item.quantity} × ${item.price} ر.س</div>
        <div class="item-total">${item.quantity * item.price} ر.س</div>
      </div>
    `;
  });
  
  // عرض تفاصيل الطلب في نافذة منبثقة أو قسم مخصص
  alert(`
    تفاصيل الطلب #${order.id.slice(0, 8)}
    الحالة: ${order.status}
    التاريخ: ${new Date(order.created_at).toLocaleString()}
    
    العناصر:
    ${itemsHTML}
    
    الإجمالي: ${order.total} ر.س
  `);
}

// إضافة منتج جديد
addProductForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const name = document.getElementById('product-name').value;
  const description = document.getElementById('product-description').value;
  const details = document.getElementById('product-details').value;
  const benefitsText = document.getElementById('product-benefits').value;
  const benefits = benefitsText.split('\n').filter(b => b.trim() !== '');
  const price = parseFloat(document.getElementById('product-price').value);
  const badge = document.getElementById('product-badge').value;
  const mainImageFile = productImageInput.files[0];
  const additionalImagesFiles = productImagesInput.files;
  
  if (!name || !description || isNaN(price) || !mainImageFile) {
    showNotification('يرجى ملء جميع الحقول المطلوبة وتحديد صورة المنتج الرئيسية');
    return;
  }
  
  // توليد معرف فريد للمنتج
  const id = Date.now().toString();
  
  // جمع الخيارات
  const options = [];
  const optionGroups = document.querySelectorAll('.option-group');
  optionGroups.forEach(group => {
    const nameInput = group.querySelector('.option-name');
    const valuesInput = group.querySelector('.option-values');
    
    if (nameInput && valuesInput && nameInput.value && valuesInput.value) {
      const values = valuesInput.value.split(',').map(v => v.trim());
      options.push({
        name: nameInput.value,
        values: values
      });
    }
  });
  
  // قراءة الصورة الرئيسية كـ base64
  const mainImageReader = new FileReader();
  mainImageReader.onload = async function(e) {
    const mainImageData = e.target.result;
    
    // قراءة الصور الإضافية كـ base64
    const additionalImages = [];
    const additionalImagesPromises = [];
    
    for (let i = 0; i < additionalImagesFiles.length; i++) {
      const file = additionalImagesFiles[i];
      const reader = new FileReader();
      
      additionalImagesPromises.push(
        new Promise((resolve) => {
          reader.onload = function(e) {
            resolve(e.target.result);
          };
          reader.readAsDataURL(file);
        })
      );
    }
    
    const imagesBase64 = await Promise.all(additionalImagesPromises);
    
    const newProduct = {
      id: id,
      name: name,
      description: description,
      details: details,
      benefits: benefits,
      price: price,
      badge: badge,
      imageData: mainImageData,
      images: imagesBase64,
      options: options
    };
    
    // إضافة المنتج إلى المصفوفة المحلية
    products.push(newProduct);
    
    // حفظ المنتج في Supabase
    const { error } = await supabase
      .from('products')
      .insert([newProduct]);
    
    if (error) {
      console.error('Error saving product:', error);
      showNotification('حدث خطأ في حفظ المنتج');
      return;
    }
    
    // إضافة المنتج إلى الصفحة الرئيسية
    renderProducts();
    
    // إعادة تحميل لوحة التحكم
    loadAdminProducts();
    
    // إعادة تعيين النموذج
    addProductForm.reset();
    previewImg.style.display = 'none';
    previewText.style.display = 'block';
    imagesPreview.innerHTML = '';
    optionsContainer.innerHTML = '<div class="option-group"><div style="display: flex; gap: 10px; margin-bottom: 10px;"><input type="text" placeholder="اسم الخيار (مثل: لون)" class="option-name" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 5px;"><input type="text" placeholder="قيم الخيار (مفصولة بفاصلة)" class="option-values" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 5px;"><button type="button" class="btn btn-danger remove-option" style="padding: 8px;"><i class="fas fa-trash"></i></button></div></div>';
    
    // إعادة إضافة معالجات الأحداث لحذف الخيارات
    document.querySelectorAll('.remove-option').forEach(btn => {
      btn.addEventListener('click', function() {
        const optionGroup = this.closest('.option-group');
        optionsContainer.removeChild(optionGroup);
      });
    });
    
    showNotification('تم إضافة المنتج بنجاح!');
  };
  mainImageReader.readAsDataURL(mainImageFile);
});

// إضافة منتج إلى السلة
function addToCart(id, name, price) {
  // التحقق مما إذا كان المنتج موجودًا بالفعل في السلة
  const existingItem = cart.find(item => item.id === id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    const product = products.find(p => p.id === id);
    cart.push({
      id,
      name,
      price,
      quantity: 1,
      image: product.imageData
    });
  }
  
  // تحديث واجهة المستخدم
  updateCartUI();
  
  // رسالة تأكيد
  showNotification(`تم إضافة ${name} إلى سلة التسوق`);
  
  // إظهار سلة التسوق تلقائيًا
  cartContainer.classList.add('active');
  cartOverlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// تحديث واجهة سلة التسوق
function updateCartUI() {
  // تحديث عدد العناصر في أيقونة السلة
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount.textContent = totalItems;
  
  // تحديث محتوى سلة التسوق
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <p>سلة التسوق فارغة</p>
      </div>
    `;
    cartTotal.textContent = "0 ر.س";
    return;
  }
  
  cartItems.innerHTML = '';
  let total = 0;
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <div class="cart-item-image">
        <img src="${item.image}" alt="${item.name}">
      </div>
      <div class="cart-item-details">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-price">${item.price} ر.س × ${item.quantity}</div>
        <div class="cart-item-actions">
          <div class="quantity-control">
            <button class="quantity-btn minus" data-id="${item.id}">-</button>
            <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
            <button class="quantity-btn plus" data-id="${item.id}">+</button>
          </div>
          <button class="remove-item" data-id="${item.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    
    cartItems.appendChild(cartItem);
  });
  
  // تحديث الإجمالي
  cartTotal.textContent = `${total.toFixed(2)} ر.س`;
  
  // إضافة معالجات الأحداث للكميات والإزالة
  document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = cart.find(item => item.id === id);
      if (item && item.quantity > 1) {
        item.quantity--;
        updateCartUI();
      }
    });
  });
  
  document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = cart.find(item => item.id === id);
      if (item) {
        item.quantity++;
        updateCartUI();
      }
    });
  });
  
  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.dataset.id;
      const item = cart.find(item => item.id === id);
      const newQuantity = parseInt(input.value) || 1;
      
      if (item && newQuantity > 0) {
        item.quantity = newQuantity;
        updateCartUI();
      }
    });
  });
  
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const index = cart.findIndex(item => item.id === id);
      
      if (index !== -1) {
        const itemName = cart[index].name;
        cart.splice(index, 1);
        updateCartUI();
        showNotification(`تم إزالة ${itemName} من السلة`);
      }
    });
  });
}

// إرسال الطلب
async function sendOrder() {
  if (cart.length === 0) {
    showNotification('سلة التسوق فارغة. أضف منتجات أولاً.');
    return;
  }
  
  // جمع بيانات الطلب
  const order = {
    items: cart,
    total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    status: 'pending'
  };
  
  // حفظ الطلب في Supabase
  const { data, error } = await supabase
    .from('orders')
    .insert([order]);
  
  if (error) {
    console.error('Error saving order:', error);
    showNotification('حدث خطأ في إرسال الطلب');
    return;
  }
  
  // تفريغ السلة بعد إرسال الطلب
  cart.length = 0;
  updateCartUI();
  
  // إشعار
  showNotification('تم إرسال طلبك بنجاح! سنتصل بك قريباً');
  
  // إغلاق سلة التسوق
  closeCartHandler();
}

// إضافة معالج الحدث لزر إتمام الشراء
checkoutBtn.addEventListener('click', sendOrder);

// وظيفة عرض الإشعارات
function showNotification(message) {
  // إنشاء عنصر الإشعار
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    background-color: var(--orange);
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2000;
    animation: slideIn 0.5s, fadeOut 0.5s 2.5s;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // إزالة الإشعار بعد 3 ثواني
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.5s forwards';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 3000);
}

// إضافة أنماط للرسوم المتحركة
const style = document.createElement('style');
style.innerHTML = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// تمييز الرابط النشط في القائمة
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', function() {
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    this.classList.add('active');
  });
});

// تمييز قسم "اتصل بنا" عند الوصول إليه
const contactSection = document.getElementById('contact');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
      document.querySelector('a[href="#contact"]').classList.add('active');
    }
  });
}, { threshold: 0.5 });

if (contactSection) {
  observer.observe(contactSection);
}

// عرض صفحة تفاصيل المنتج
function showProductDetail(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  // إخفاء الأقسام الرئيسية
  heroSection.style.display = 'none';
  featuresSection.style.display = 'none';
  productsSection.style.display = 'none';
  whatsappSection.style.display = 'none';
  footerSection.style.display = 'none';
  adminPanel.style.display = 'none';
  
  // إظهار قسم تفاصيل المنتج
  productDetailSection.style.display = 'block';
  
  // بناء HTML للخيارات
  let optionsHTML = '';
  if (product.options && product.options.length > 0) {
    product.options.forEach(option => {
      optionsHTML += `
        <div class="option-group">
          <label>${option.name}:</label>
          <div class="option-buttons">
            ${option.values.map((value, index) => `
              <button class="option-btn ${index === 0 ? 'selected' : ''}" data-value="${value}">${value}</button>
            `).join('')}
          </div>
        </div>
      `;
    });
  }
  
  // بناء HTML للصور المصغرة
  let thumbnailsHTML = '';
  // الصورة الرئيسية
  thumbnailsHTML += `
    <div class="thumbnail active">
      <img src="${product.imageData}" alt="${product.name}" style="object-fit: contain;">
    </div>
  `;
  // الصور الإضافية
  if (product.images && product.images.length > 0) {
    product.images.forEach(img => {
      thumbnailsHTML += `
        <div class="thumbnail">
          <img src="${img}" alt="${product.name}" style="object-fit: cover;">
        </div>
      `;
    });
  }
  
  // ملء محتوى تفاصيل المنتج
  const productDetailContainer = document.querySelector('.product-detail-container');
  productDetailContainer.innerHTML = `
    <div class="product-images">
      <div class="main-image">
        <img id="main-product-image" src="${product.imageData}" alt="${product.name}" style="object-fit: contain;">
      </div>
      <div class="thumbnail-images">
        ${thumbnailsHTML}
      </div>
    </div>
    
    <div class="product-info-detail">
      <h1>${product.name}</h1>
      <div class="product-price-detail">${product.price} ر.س</div>
      <p class="product-description-detail">${product.description}</p>
      
      <div class="product-options">
        ${optionsHTML}
      </div>
      
      <div class="add-to-cart-detail">
        <button class="add-cart-btn" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
          <i class="fas fa-shopping-cart"></i> أضف إلى السلة
        </button>
      </div>
      
      ${product.details ? `
      <div class="product-details">
        <h3>تفاصيل المنتج</h3>
        <p>${product.details}</p>
      </div>
      ` : ''}
      
      <div class="product-benefits">
        <h3>الفوائد الصحية</h3>
        <ul>
          ${product.benefits && product.benefits.length > 0 ? 
            product.benefits.map(benefit => `<li>${benefit}</li>`).join('') 
            : '<li>لا توجد فوائد مضافة</li>'}
        </ul>
      </div>
    </div>
  `;
  
  // إضافة معالجات الأحداث للصور المصغرة
  document.querySelectorAll('.thumbnail').forEach(thumb => {
    thumb.addEventListener('click', function() {
      document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const imgSrc = this.querySelector('img').src;
      document.getElementById('main-product-image').src = imgSrc;
    });
  });
  
  // معالجات الأحداث للخيارات
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      this.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
  
  // إضافة معالج الحدث لزر إضافة إلى السلة
  const addToCartBtn = document.querySelector('.add-cart-btn');
  addToCartBtn.addEventListener('click', function() {
    // الحصول على الخيارات المحددة
    let selectedOptions = [];
    document.querySelectorAll('.option-group').forEach(group => {
      const selectedBtn = group.querySelector('.option-btn.selected');
      if (selectedBtn) {
        const optionName = group.querySelector('label').textContent.replace(':', '');
        selectedOptions.push(`${optionName}: ${selectedBtn.dataset.value}`);
      }
    });
    
    // إنشاء اسم المنتج مع الخيارات
    let productName = product.name;
    if (selectedOptions.length > 0) {
      productName += ` (${selectedOptions.join('، ')})`;
    }
    
    // إضافة المنتج إلى السلة
    addToCart(product.id, productName, product.price);
    
    showNotification(`تم إضافة ${productName} إلى السلة`);
  });
}

// زر العودة إلى المنتجات
document.getElementById('back-to-products').addEventListener('click', function(e) {
  e.preventDefault();
  showMainSections();
});

// تحميل المنتجات عند بدء الصفحة
document.addEventListener('DOMContentLoaded', function() {
  loadProductsFromStorage();
  
  // إضافة معالج الأحداث لحذف الخيارات الافتراضية
  document.querySelectorAll('.remove-option').forEach(btn => {
    btn.addEventListener('click', function() {
      const optionGroup = this.closest('.option-group');
      optionsContainer.removeChild(optionGroup);
    });
  });
});