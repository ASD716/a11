// main.js

// استيراد الدوال من ملف db.js
import {
    openDatabase,
    addProductToDB,
    getAllProductsFromDB,
    updateProductInDB,
    deleteProductFromDB,
    addCartItemToDB,
    getAllCartItemsFromDB,
    updateCartItemInDB,
    deleteCartItemFromDB,
    clearCartItemsFromDB
} from './db.js';

// إدارة سلة التسوق
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
const productsSection = document.getElementById('products');
const aboutSection = document.getElementById('about');
const contactSection = document.getElementById('contact');

// عناصر تفاصيل المنتج
const productDetailsOverlay = document.getElementById('product-details-overlay');
const productDetailsContainer = document.getElementById('product-details-container');
const productDetailsContent = document.getElementById('product-details-content');
const closeProductDetails = document.getElementById('close-product-details');

// عناصر تسجيل الدخول
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const changePasswordForm = document.getElementById('change-password-form');
const oldPasswordInput = document.getElementById('old-password');
const newPasswordInput = document.getElementById('new-password');
const confirmNewPasswordInput = document.getElementById('confirm-new-password');

// متغيرات عامة
let isAdminLoggedIn = false;
const ADMIN_PASSWORD_KEY = 'adminPassword'; // مفتاح تخزين كلمة المرور في Local Storage

// دالة لإظهار الإشعارات
function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;
    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000); // إخفاء الإشعار بعد 3 ثوانٍ
}

// دالة لإظهار الأقسام الرئيسية
function showMainSections() {
    heroSection.style.display = 'block';
    productsSection.style.display = 'block';
    aboutSection.style.display = 'block';
    contactSection.style.display = 'block';
    adminPanel.style.display = 'none';
    productDetailsOverlay.style.display = 'none';
    loginOverlay.style.display = 'none';
}

// دالة مساعدة لتحويل File إلى Base64 (مطلوبة لتخزين الصور في IndexedDB)
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// دوال مساعدة لإنشاء معرفات فريدة
function generateUniqueId() {
    return 'prod_' + Date.now() + Math.random().toString(36).substr(2, 9);
}

// =========================================================
// وظائف إدارة المنتجات
// =========================================================

// معاينة الصورة الرئيسية للمنتج
productImageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
            previewText.style.display = 'none';
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.style.display = 'none';
        previewText.style.display = 'block';
    }
});

// معاينة الصور الإضافية
productImagesInput.addEventListener('change', function() {
    imagesPreview.innerHTML = ''; // مسح المعاينات السابقة
    const files = Array.from(this.files);
    if (files.length > 0) {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('image-thumbnail');
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                imgContainer.appendChild(img);
                imagesPreview.appendChild(imgContainer);
            };
            reader.readAsDataURL(file);
        });
    }
});

// إضافة خيار جديد للمنتج في لوحة التحكم
addOptionBtn.addEventListener('click', function() {
    const optionGroup = document.createElement('div');
    optionGroup.classList.add('form-group', 'option-group');
    optionGroup.innerHTML = `
        <label>اسم الخيار (مثلاً: اللون):</label>
        <input type="text" class="option-name-input" placeholder="اسم الخيار" required>
        <label>قيم الخيار (مثلاً: أحمر, أزرق):</label>
        <input type="text" class="option-values-input" placeholder="القيم مفصولة بفاصلة" required>
        <button type="button" class="btn btn-danger remove-option"><i class="fas fa-times"></i></button>
    `;
    optionsContainer.appendChild(optionGroup);

    // إضافة معالج حدث لزر الإزالة الجديد
    optionGroup.querySelector('.remove-option').addEventListener('click', function() {
        optionsContainer.removeChild(optionGroup);
    });
});


// تعديل دالة إضافة المنتج لاستخدام IndexedDB
addProductForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const productId = generateUniqueId(); // توليد معرف فريد للمنتج الجديد
    const productName = document.getElementById('product-name').value;
    const productPrice = parseFloat(document.getElementById('product-price').value);
    const productDescription = document.getElementById('product-description').value;
    const productImage = document.getElementById('product-image').files[0];
    const productImages = Array.from(document.getElementById('product-images').files);

    let base64Image = '';
    const additionalImages = [];

    // تحويل الصور إلى Base64 للتخزين في IndexedDB (إذا لزم الأمر)
    if (productImage) {
        base64Image = await convertFileToBase64(productImage);
    }
    for (const file of productImages) {
        additionalImages.push(await convertFileToBase64(file));
    }

    // جمع الخيارات المضافة ديناميكياً
    const options = [];
    document.querySelectorAll('.option-group').forEach(group => {
        const optionNameInput = group.querySelector('.option-name-input');
        const optionValuesInput = group.querySelector('.option-values-input');
        if (optionNameInput && optionValuesInput && optionNameInput.value.trim() && optionValuesInput.value.trim()) {
            const optionName = optionNameInput.value.trim();
            const optionValues = optionValuesInput.value.trim().split(',').map(val => val.trim());
            options.push({ name: optionName, values: optionValues });
        }
    });

    const newProduct = {
        id: productId,
        name: productName,
        price: productPrice,
        description: productDescription,
        image: base64Image, // الصورة الرئيسية
        images: additionalImages, // الصور الإضافية
        options: options,
        addedDate: new Date().toISOString()
    };

    try {
        await addProductToDB(newProduct);
        showNotification('تم إضافة المنتج بنجاح!', 'success');
        addProductForm.reset();
        imagePreview.style.display = 'none';
        previewText.style.display = 'block';
        imagesPreview.innerHTML = ''; // مسح معاينات الصور الإضافية
        optionsContainer.innerHTML = ''; // مسح الخيارات المضافة
        renderProducts(); // إعادة عرض المنتجات من قاعدة البيانات
        renderAdminProducts(); // إعادة عرض المنتجات في لوحة التحكم
    } catch (error) {
        console.error('Failed to add product:', error);
        showNotification('فشل إضافة المنتج.', 'danger');
    }
});


// تعديل دالة تحميل المنتجات لاستخدام IndexedDB
async function loadProductsFromDB() {
    try {
        const products = await getAllProductsFromDB();
        return products;
    } catch (error) {
        console.error('Failed to load products from DB:', error);
        return []; // إرجاع مصفوفة فارغة في حالة الخطأ
    }
}


// تعديل دالة renderProducts لعرض المنتجات من IndexedDB
async function renderProducts() {
    productsContainer.innerHTML = ''; // مسح المنتجات الحالية

    const products = await loadProductsFromDB(); // جلب المنتجات من IndexedDB

    if (products.length === 0) {
        productsContainer.innerHTML = '<p class="empty-message">لا توجد منتجات لعرضها حاليًا.</p>';
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.innerHTML = `
            <img src="${product.image || 'https://via.placeholder.com/200'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <span class="price">${product.price.toFixed(2)} ر.س</span>
            <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}">
                <i class="fas fa-shopping-cart"></i> إضافة للسلة
            </button>
        `;
        productsContainer.appendChild(productCard);
    });

    // إضافة معالجات الأحداث لأزرار "إضافة للسلة" لفتح التفاصيل
    document.querySelectorAll('.product-card .add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.id;
            showProductDetails(productId);
        });
    });
}


// تعديل دالة renderAdminProducts لعرض المنتجات في لوحة التحكم
async function renderAdminProducts() {
    adminProductsList.innerHTML = ''; // مسح القائمة الحالية
    const products = await loadProductsFromDB(); // جلب المنتجات من IndexedDB

    if (products.length === 0) {
        adminProductsList.innerHTML = '<p>لا توجد منتجات في قاعدة البيانات.</p>';
        return;
    }

    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.classList.add('admin-product-item');
        productItem.innerHTML = `
            <span>${product.name} - ${product.price.toFixed(2)} ر.س</span>
            <div>
                <button class="btn btn-secondary edit-product" data-id="${product.id}"><i class="fas fa-edit"></i> تعديل</button>
                <button class="btn btn-danger delete-product" data-id="${product.id}"><i class="fas fa-trash-alt"></i> حذف</button>
            </div>
        `;
        adminProductsList.appendChild(productItem);
    });

    // إضافة معالجات الأحداث لأزرار التعديل والحذف
    document.querySelectorAll('.edit-product').forEach(button => {
        button.addEventListener('click', async function() {
            const productId = this.dataset.id;
            const productToEdit = (await loadProductsFromDB()).find(p => p.id === productId);
            if (productToEdit) {
                // منطق تعديل المنتج
                // يمكنك إنشاء دالة editProduct(productToEdit) هنا لفتح نموذج وتعبئته
                console.log('Editing product:', productToEdit);
                showNotification(`تعديل المنتج: ${productToEdit.name}`, 'info');
                // مثال بسيط لملء الفورم (يتطلب تعديل الفورم ليدعم التعديل)
                document.getElementById('product-name').value = productToEdit.name;
                document.getElementById('product-price').value = productToEdit.price;
                document.getElementById('product-description').value = productToEdit.description;
                
                // عرض الصورة الرئيسية
                if (productToEdit.image) {
                    previewImg.src = productToEdit.image;
                    imagePreview.style.display = 'block';
                    previewText.style.display = 'none';
                } else {
                    imagePreview.style.display = 'none';
                    previewText.style.display = 'block';
                }

                // عرض الصور الإضافية
                imagesPreview.innerHTML = '';
                productToEdit.images.forEach(imgBase64 => {
                    const imgContainer = document.createElement('div');
                    imgContainer.classList.add('image-thumbnail');
                    const img = document.createElement('img');
                    img.src = imgBase64;
                    imgContainer.appendChild(img);
                    imagesPreview.appendChild(imgContainer);
                });

                // عرض الخيارات
                optionsContainer.innerHTML = '';
                productToEdit.options.forEach(option => {
                    const optionGroup = document.createElement('div');
                    optionGroup.classList.add('form-group', 'option-group');
                    optionGroup.innerHTML = `
                        <label>اسم الخيار (مثلاً: اللون):</label>
                        <input type="text" class="option-name-input" value="${option.name}" placeholder="اسم الخيار" required>
                        <label>قيم الخيار (مثلاً: أحمر, أزرق):</label>
                        <input type="text" class="option-values-input" value="${option.values.join(', ')}" placeholder="القيم مفصولة بفاصلة" required>
                        <button type="button" class="btn btn-danger remove-option"><i class="fas fa-times"></i></button>
                    `;
                    optionsContainer.appendChild(optionGroup);
                    optionGroup.querySelector('.remove-option').addEventListener('click', function() {
                        optionsContainer.removeChild(optionGroup);
                    });
                });
                
                // تغيير زر الإضافة إلى تحديث وتعيين معرف المنتج للتحديث
                document.getElementById('add-product-form').dataset.editProductId = productId;
                document.getElementById('add-product-form').querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> تحديث المنتج';
            }
        });
    });

    document.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', async function() {
            const productId = this.dataset.id;
            if (confirm('هل أنت متأكد أنك تريد حذف هذا المنتج؟')) {
                try {
                    await deleteProductFromDB(productId);
                    showNotification('تم حذف المنتج بنجاح!', 'success');
                    renderProducts(); // تحديث عرض المنتجات في المتجر
                    renderAdminProducts(); // تحديث عرض المنتجات في لوحة التحكم
                } catch (error) {
                    console.error('Failed to delete product:', error);
                    showNotification('فشل حذف المنتج.', 'danger');
                }
            }
        });
    });
}

// =========================================================
// وظائف تفاصيل المنتج
// =========================================================

async function showProductDetails(productId) {
    const products = await loadProductsFromDB();
    const product = products.find(p => p.id === productId);

    if (!product) {
        showNotification('المنتج غير موجود.', 'danger');
        return;
    }

    productDetailsContent.innerHTML = `
        <div class="details-image-gallery">
            <img src="${product.image || 'https://via.placeholder.com/400x300'}" alt="${product.name}" class="main-detail-image">
            <div class="thumbnails">
                ${product.images.map(img => `<img src="${img}" alt="صورة مصغرة" class="thumbnail-img">`).join('')}
                ${product.image ? `<img src="${product.image}" alt="صورة مصغرة" class="thumbnail-img selected">` : ''}
            </div>
        </div>
        <div class="details-info">
            <h2>${product.name}</h2>
            <p class="detail-price">${product.price.toFixed(2)} ر.س</p>
            <p class="detail-description">${product.description}</p>
            <div class="detail-options" id="detail-options-container">
                </div>
            <button class="btn btn-primary add-to-cart-from-details" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
                <i class="fas fa-shopping-cart"></i> إضافة للسلة
            </button>
        </div>
    `;

    // عرض الخيارات الديناميكية
    const detailOptionsContainer = document.getElementById('detail-options-container');
    if (product.options && product.options.length > 0) {
        product.options.forEach(option => {
            const optionGroup = document.createElement('div');
            optionGroup.classList.add('option-group-details');
            optionGroup.innerHTML = `
                <label>${option.name}:</label>
                <div class="option-buttons">
                    ${option.values.map(value => `<button type="button" class="option-btn" data-value="${value}">${value}</button>`).join('')}
                </div>
            `;
            detailOptionsContainer.appendChild(optionGroup);
        });

        // إضافة معالج الأحداث لأزرار الخيارات
        document.querySelectorAll('.option-group-details .option-btn').forEach(button => {
            button.addEventListener('click', function() {
                // إزالة التحديد من الأزرار الأخرى في نفس المجموعة
                this.closest('.option-buttons').querySelectorAll('.option-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                // إضافة التحديد للزر الحالي
                this.classList.add('selected');
            });
        });
    }

    // تبديل الصور المصغرة
    document.querySelectorAll('.thumbnail-img').forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            document.querySelectorAll('.thumbnail-img').forEach(img => img.classList.remove('selected'));
            this.classList.add('selected');
            document.querySelector('.main-detail-image').src = this.src;
        });
    });

    // إضافة معالج حدث لزر "إضافة للسلة" داخل نافذة التفاصيل
    document.querySelector('.add-to-cart-from-details').addEventListener('click', function() {
        // الحصول على الخيارات المحددة
        let selectedOptions = [];
        document.querySelectorAll('.option-group-details').forEach(group => {
            const selectedBtn = group.querySelector('.option-btn.selected');
            if (selectedBtn) {
                const optionName = group.querySelector('label').textContent.replace(':', '');
                selectedOptions.push(`${optionName}: ${selectedBtn.dataset.value}`);
            }
        });
        
        // إنشاء اسم المنتج مع الخيارات
        let productNameWithOption = product.name;
        if (selectedOptions.length > 0) {
            productNameWithOption += ` (${selectedOptions.join('، ')})`;
        }
        
        // إضافة المنتج إلى السلة
        addToCart(product.id, productNameWithOption, product.price);
        closeProductDetails.click(); // إغلاق نافذة التفاصيل بعد الإضافة
    });

    productDetailsOverlay.style.display = 'flex';
}

closeProductDetails.addEventListener('click', function() {
    productDetailsOverlay.style.display = 'none';
});


// =========================================================
// وظائف سلة التسوق
// =========================================================

// فتح/إغلاق سلة التسوق
cartIcon.addEventListener('click', () => {
    cartContainer.classList.add('show-cart');
    cartOverlay.style.display = 'block';
});

closeCart.addEventListener('click', () => {
    cartContainer.classList.remove('show-cart');
    cartOverlay.style.display = 'none';
});

cartOverlay.addEventListener('click', () => {
    cartContainer.classList.remove('show-cart');
    cartOverlay.style.display = 'none';
});


// تعديل دالة addToCart لاستخدام IndexedDB
async function addToCart(productId, productName, productPrice) {
    const existingItem = (await getAllCartItemsFromDB()).find(item => item.productId === productId);

    if (existingItem) {
        // إذا كان المنتج موجوداً، قم بتحديث الكمية والسعر الإجمالي
        existingItem.quantity += 1;
        existingItem.totalPrice = existingItem.quantity * productPrice;
        try {
            await updateCartItemInDB(existingItem);
            showNotification(`تم تحديث كمية ${productName} في السلة.`, 'info');
        } catch (error) {
            console.error('Failed to update cart item:', error);
            showNotification('فشل تحديث كمية المنتج في السلة.', 'danger');
        }
    } else {
        // إذا لم يكن المنتج موجوداً، قم بإضافته كعنصر جديد
        const newItem = {
            productId: productId,
            name: productName,
            price: productPrice,
            quantity: 1,
            totalPrice: productPrice
        };
        try {
            await addCartItemToDB(newItem);
            showNotification(`تم إضافة ${productName} إلى السلة.`, 'success');
        } catch (error) {
            console.error('Failed to add cart item:', error);
            showNotification('فشل إضافة المنتج إلى السلة.', 'danger');
        }
    }
    updateCartDisplay();
}

// تعديل دالة updateCartDisplay لاستخدام IndexedDB
async function updateCartDisplay() {
    cartItems.innerHTML = ''; // مسح العناصر الحالية
    let total = 0;
    let count = 0;

    const items = await getAllCartItemsFromDB(); // جلب عناصر السلة من IndexedDB

    if (items.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>سلة التسوق فارغة</p>
            </div>
        `;
        cartCount.textContent = '0';
        cartTotal.textContent = '0 ر.س';
        return;
    }

    items.forEach(item => {
        const cartItemElement = document.createElement('div');
        cartItemElement.classList.add('cart-item');
        cartItemElement.innerHTML = `
            <span>${item.name} (x${item.quantity})</span>
            <span class="cart-item-price">${item.totalPrice.toFixed(2)} ر.س</span>
            <button class="remove-item-btn" data-id="${item.productId}">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        cartItems.appendChild(cartItemElement);

        total += item.totalPrice;
        count += item.quantity;
    });

    cartCount.textContent = count;
    cartTotal.textContent = `${total.toFixed(2)} ر.س`;

    // إضافة معالجات الأحداث لأزرار إزالة العنصر من السلة
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const productId = this.dataset.id;
            try {
                await deleteCartItemFromDB(productId);
                showNotification('تم إزالة العنصر من السلة.', 'info');
                updateCartDisplay(); // تحديث عرض السلة
            } catch (error) {
                console.error('Failed to remove item from cart:', error);
                showNotification('فشل إزالة العنصر من السلة.', 'danger');
            }
        });
    });
}

// تعديل زر إتمام الشراء لمسح السلة
checkoutBtn.addEventListener('click', async function() {
    // هنا يمكنك إضافة منطق إتمام عملية الشراء (مثلاً، إرسال البيانات إلى خادم)
    // بعد ذلك، قم بمسح سلة التسوق من IndexedDB
    try {
        await clearCartItemsFromDB();
        showNotification('تم إتمام عملية الشراء بنجاح! تم مسح سلة التسوق.', 'success');
        updateCartDisplay(); // تحديث عرض السلة بعد المسح
    } catch (error) {
        console.error('Failed to clear cart:', error);
        showNotification('فشل مسح سلة التسوق بعد الشراء.', 'danger');
    }
});


// =========================================================
// وظائف لوحة التحكم (تسجيل الدخول وتغيير كلمة المرور)
// =========================================================

// تحميل كلمة المرور المحفوظة (أو تعيين افتراضية)
function loadAdminPassword() {
    let password = localStorage.getItem(ADMIN_PASSWORD_KEY);
    if (!password) {
        password = 'admin'; // كلمة مرور افتراضية
        localStorage.setItem(ADMIN_PASSWORD_KEY, password);
    }
    return password;
}

let currentAdminPassword = loadAdminPassword();

// فتح لوحة التحكم عند النقر على أيقونة الإدارة
adminLink.addEventListener('click', function(e) {
    e.preventDefault();
    if (isAdminLoggedIn) {
        // إذا كان المستخدم مسجلاً دخوله بالفعل، اذهب مباشرة إلى لوحة التحكم
        heroSection.style.display = 'none';
        productsSection.style.display = 'none';
        aboutSection.style.display = 'none';
        contactSection.style.display = 'none';
        adminPanel.style.display = 'block';
        renderAdminProducts(); // تحديث قائمة المنتجات في لوحة التحكم
    } else {
        // وإلا، اظهر نموذج تسجيل الدخول
        loginOverlay.style.display = 'flex';
    }
});

// إغلاق نموذج تسجيل الدخول
loginOverlay.addEventListener('click', function(e) {
    if (e.target === loginOverlay) {
        loginOverlay.style.display = 'none';
    }
});

// معالجة نموذج تسجيل الدخول
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const enteredPassword = passwordInput.value;

    if (enteredPassword === currentAdminPassword) {
        isAdminLoggedIn = true;
        loginOverlay.style.display = 'none';
        showNotification('تم تسجيل الدخول بنجاح إلى لوحة التحكم!', 'success');
        
        // إخفاء الأقسام الرئيسية وإظهار لوحة التحكم
        heroSection.style.display = 'none';
        productsSection.style.display = 'none';
        aboutSection.style.display = 'none';
        contactSection.style.display = 'none';
        adminPanel.style.display = 'block';
        
        renderAdminProducts(); // تحديث قائمة المنتجات في لوحة التحكم
    } else {
        showNotification('كلمة المرور غير صحيحة.', 'danger');
    }
    loginForm.reset();
});

// معالجة نموذج تغيير كلمة المرور
changePasswordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const oldPassword = oldPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmNewPassword = confirmNewPasswordInput.value;

    if (oldPassword !== currentAdminPassword) {
        showNotification('كلمة المرور القديمة غير صحيحة.', 'danger');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showNotification('كلمة المرور الجديدة وتأكيدها غير متطابقين.', 'danger');
        return;
    }

    if (newPassword.length < 5) {
        showNotification('يجب أن تكون كلمة المرور الجديدة 5 أحرف على الأقل.', 'danger');
        return;
    }

    currentAdminPassword = newPassword;
    localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
    showNotification('تم تغيير كلمة المرور بنجاح!', 'success');
    changePasswordForm.reset();
});

// زر العودة إلى المتجر من لوحة التحكم
backToStoreBtn.addEventListener('click', function() {
    showMainSections();
});

// تحميل المنتجات عند بدء الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // استدعاء دالة لفتح قاعدة البيانات عند بدء التطبيق
    openDatabase().then(() => {
        console.log("IndexedDB is ready.");
        renderProducts(); // عرض المنتجات من IndexedDB
        // renderAdminProducts(); // لا نحتاج لاستدعائها هنا، سيتم استدعاؤها عند دخول لوحة التحكم
        updateCartDisplay(); // عرض عناصر السلة من IndexedDB
    }).catch(error => {
        console.error("Error initializing IndexedDB:", error);
    });
});