// db.js

const DB_NAME = 'BeeCenterDB'; // اسم قاعدة البيانات
const DB_VERSION = 1; // إصدار قاعدة البيانات
let database; // متغير لتخزين كائن قاعدة البيانات

/**
 * يفتح أو ينشئ قاعدة بيانات IndexedDB.
 * @returns {Promise<IDBDatabase>} Promise يحل بكائن قاعدة البيانات عند النجاح.
 */
function openDatabase() {
    return new Promise((resolve, reject) => {
        // طلب لفتح قاعدة البيانات
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // عند ترقية قاعدة البيانات (على سبيل المثال، تغيير رقم الإصدار)
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('Database upgrade needed. Creating object stores...');

            // إنشاء مخزن كائنات للمنتجات إذا لم يكن موجودًا
            // 'id' هو مفتاح الكائن الفريد
            if (!db.objectStoreNames.contains('products')) {
                const productStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: false });
                // إنشاء فهرس للبحث بالاسم (اختياري)
                productStore.createIndex('name', 'name', { unique: false });
                console.log('Object store "products" created.');
            }

            // إنشاء مخزن كائنات لسلة التسوق
            if (!db.objectStoreNames.contains('cartItems')) {
                const cartStore = db.createObjectStore('cartItems', { keyPath: 'productId', autoIncrement: false });
                console.log('Object store "cartItems" created.');
            }
        };

        // عند النجاح في فتح قاعدة البيانات
        request.onsuccess = (event) => {
            database = event.target.result; // تعيين كائن قاعدة البيانات المتغير العام
            console.log('Database opened successfully.');
            resolve(database);
        };

        // عند حدوث خطأ
        request.onerror = (event) => {
            console.error('Database error:', event.target.errorCode);
            reject('Failed to open database.');
        };
    });
}

/**
 * يضيف منتجًا جديدًا إلى مخزن 'products'.
 * @param {object} product - كائن المنتج المراد إضافته.
 * @returns {Promise<void>} Promise يحل عند إضافة المنتج بنجاح.
 */
function addProductToDB(product) {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject('Database not initialized.');
            return;
        }
        const transaction = database.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');
        const request = store.add(product);

        request.onsuccess = () => {
            console.log('Product added successfully:', product);
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error adding product:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * يسترجع جميع المنتجات من مخزن 'products'.
 * @returns {Promise<Array<object>>} Promise يحل بمصفوفة من كائنات المنتجات.
 */
function getAllProductsFromDB() {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject('Database not initialized.');
            return;
        }
        const transaction = database.transaction(['products'], 'readonly');
        const store = transaction.objectStore('products');
        const request = store.getAll(); // الحصول على جميع الكائنات

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('Error getting all products:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * يحدث منتجًا موجودًا في مخزن 'products'.
 * @param {object} product - كائن المنتج المراد تحديثه (يجب أن يحتوي على معرف id).
 * @returns {Promise<void>} Promise يحل عند تحديث المنتج بنجاح.
 */
function updateProductInDB(product) {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject('Database not initialized.');
            return;
        }
        const transaction = database.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');
        const request = store.put(product); // يستخدم put للتحديث أو الإضافة إذا لم يكن موجودًا

        request.onsuccess = () => {
            console.log('Product updated successfully:', product);
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error updating product:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * يحذف منتجًا من مخزن 'products' بواسطة المعرف.
 * @param {string} productId - معرف المنتج المراد حذفه.
 * @returns {Promise<void>} Promise يحل عند حذف المنتج بنجاح.
 */
function deleteProductFromDB(productId) {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject('Database not initialized.');
            return;
        }
        const transaction = database.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');
        const request = store.delete(productId);

        request.onsuccess = () => {
            console.log('Product deleted successfully:', productId);
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error deleting product:', event.target.error);
            reject(event.target.error);
        };
    });
}

// دوال للتعامل مع سلة التسوق (cartItems)

/**
 * يضيف عنصرًا إلى سلة التسوق في مخزن 'cartItems'.
 * @param {object} item - كائن العنصر المراد إضافته إلى السلة.
 * يجب أن يحتوي على productId كـ keyPath.
 * @returns {Promise<void>} Promise يحل عند إضافة العنصر بنجاح.
 */
function addCartItemToDB(item) {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject('Database not initialized.');
            return;
        }
        const transaction = database.transaction(['cartItems'], 'readwrite');
        const store = transaction.objectStore('cartItems');
        const request = store.add(item);

        request.onsuccess = () => {
            console.log('Cart item added successfully:', item);
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error adding cart item:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * يسترجع جميع عناصر سلة التسوق من مخزن 'cartItems'.
 * @returns {Promise<Array<object>>} Promise يحل بمصفوفة من كائنات عناصر سلة التسوق.
 */
function getAllCartItemsFromDB() {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject('Database not initialized.');
            return;
        }
        const transaction = database.transaction(['cartItems'], 'readonly');
        const store = transaction.objectStore('cartItems');
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('Error getting all cart items:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * يحدث عنصرًا في سلة التسوق في مخزن 'cartItems'.
 * @param {object} item - كائن العنصر المراد تحديثه (يجب أن يحتوي على productId).
 * @returns {Promise<void>} Promise يحل عند تحديث العنصر بنجاح.
 */
function updateCartItemInDB(item) {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject('Database not initialized.');
            return;
        }
        const transaction = database.transaction(['cartItems'], 'readwrite');
        const store = transaction.objectStore('cartItems');
        const request = store.put(item);

        request.onsuccess = () => {
            console.log('Cart item updated successfully:', item);
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error updating cart item:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * يحذف عنصرًا من سلة التسوق في مخزن 'cartItems' بواسطة المعرف.
 * @param {string} productId - معرف المنتج المراد حذفه من السلة.
 * @returns {Promise<void>} Promise يحل عند حذف العنصر بنجاح.
 */
function deleteCartItemFromDB(productId) {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject('Database not initialized.');
            return;
        }
        const transaction = database.transaction(['cartItems'], 'readwrite');
        const store = transaction.objectStore('cartItems');
        const request = store.delete(productId);

        request.onsuccess = () => {
            console.log('Cart item deleted successfully:', productId);
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error deleting cart item:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * يمسح جميع عناصر سلة التسوق من مخزن 'cartItems'.
 * @returns {Promise<void>} Promise يحل عند مسح سلة التسوق بنجاح.
 */
function clearCartItemsFromDB() {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject('Database not initialized.');
            return;
        }
        const transaction = database.transaction(['cartItems'], 'readwrite');
        const store = transaction.objectStore('cartItems');
        const request = store.clear();

        request.onsuccess = () => {
            console.log('Cart cleared successfully.');
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error clearing cart:', event.target.error);
            reject(event.target.error);
        };
    });
}


// تصدير جميع الدوال لتكون متاحة من ملفات أخرى
export {
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
};