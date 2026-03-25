const firebaseConfig = {
    apiKey: "AIzaSyDKRNpFCvTxV0da-rp9OJB0hO1lbs8vnZw",
    authDomain: "elasemaeltbia.firebaseapp.com",
    projectId: "elasemaeltbia",
    // ⚠️ مهم: لجعل المنتجات تظهر للجميع يجب تفعيل Realtime Database ووضع الدومين الخاص بها هنا
    databaseURL: "https://elasemaeltbia-default-rtdb.firebaseio.com",
    storageBucket: "elasemaeltbia.firebasestorage.app",
    messagingSenderId: "342333643282",
    appId: "1:342333643282:web:1bfe62f00e81ce601816cb"
};

let db = null;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
    }
} catch (e) {
    console.warn("Firebase init failed:", e);
}

// --- Initial Data --- //
const defaultCategories = [
    { id: '1', name: 'مستلزمات طبية', image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' },
    { id: '2', name: 'مستحضرات تجميل', image: 'cosmetics.png?v=2' },
    { id: '3', name: 'مستلزمات سلامة الغذاء', image: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' }
];

const defaultProducts = [
    {
        id: 'p1',
        name: 'جهاز قياس ضغط الدم الديجيتال',
        price: 850,
        oldPrice: 1000,
        categoryId: '1',
        image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        description: 'جهاز قياس ضغط الدم عالي الدقة مع شاشة ديجيتال كبيرة وقراءة سريعة.',
        inStock: true,
        isOffer: true
    },
    {
        id: 'p2',
        name: 'كمامة طبية 3 طبقات (علبة 50 قطعة)',
        price: 50,
        oldPrice: null,
        categoryId: '1',
        image: 'https://images.unsplash.com/photo-1586942540191-ddb6fdfaa963?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        description: 'كمامة طبية معتمدة ثلاث طبقات للحماية الكاملة.',
        inStock: true,
        isOffer: false
    },
    {
        id: 'p3',
        name: 'سيروم فيتامين سي للوجه',
        price: 350,
        oldPrice: 420,
        categoryId: '2',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        description: 'سيروم لتفتيح البشرة ومحاربة التجاعيد، غني بفيتامين سي النقي.',
        inStock: true,
        isOffer: true
    },
    {
        id: 'p4',
        name: 'كريم مرطب طبي يومي',
        price: 180,
        oldPrice: null,
        categoryId: '2',
        image: 'https://images.unsplash.com/photo-1617897903246-719242758050?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        description: 'كريم مرطب عميق للبشرة الجافة والحساسة.',
        inStock: true,
        isOffer: false
    },
    {
        id: 'p5',
        name: 'قفازات لاتكس (علبة 100 قطعة)',
        price: 120,
        oldPrice: null,
        categoryId: '3',
        image: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        description: 'قفازات عالية الجودة للتعامل الآمن والمقاوم للقطع.',
        inStock: true,
        isOffer: false
    },
    {
        id: 'p6',
        name: 'مقياس حرارة بالأشعة تحت الحمراء',
        price: 550,
        oldPrice: 650,
        categoryId: '1',
        image: 'https://images.unsplash.com/photo-1603554472390-e5bf3a713837?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        description: 'ترمومتر ديجيتال عن بعد لقياس الحرارة بسرعة فائقة.',
        inStock: false,
        isOffer: true
    }
];

// --- Application State --- //
function getSafeStorage(key, fallback) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : fallback;
    } catch (e) {
        return fallback;
    }
}

let state = {
    categories: [],
    subCategories: [],
    products: [],
    cart: getSafeStorage('mc_cart', []),
    currentView: 'home',
    currentParam: null,
    activeProduct: null,
    isAdminAuth: sessionStorage.getItem('mc_admin_auth') === 'true',
    adminKeys: '', // For secret code
    currentSort: 'newest'
};

// --- initialization --- //
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading state while fetching from Firebase
    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.innerHTML = `<div class="container" style="text-align:center; padding: 100px 0;"><h2>جاري تحميل البيانات...</h2></div>`;
    }

    try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
        await Promise.race([fetchInitialData(), timeoutPromise]);
    } catch (e) {
        console.warn("Firebase fetch failed or timed out, falling back to local data:", e.message);
        state.categories = getSafeStorage('mc_categories', [...defaultCategories]);
        state.subCategories = getSafeStorage('mc_subcategories', []);
        state.products = getSafeStorage('mc_products', [...defaultProducts]);
    }

    patchCategoriesWithImages();
    initNavigation();
    initCart();
    initSearch();
    initAdmin();
    setupAdminListeners();
    renderFooterCategories();

    // Handle initial route from URL
    handleUrlRoute();
});

window.addEventListener('popstate', (e) => {
    handleUrlRoute();
});

function handleUrlRoute() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') || 'home';
    const id = params.get('id') || null;
    state.currentView = view;
    state.currentParam = id;
    renderView(view, id);

    // Update active state in nav
    document.querySelectorAll('.nav-list a').forEach(nav => nav.classList.remove('active'));
    let selector = `.nav-list a[data-view="${view}"]`;
    if (id && view === 'category') selector += `[data-cat-id="${id}"]`;
    const targetNav = document.querySelector(selector);
    if (targetNav) {
        targetNav.classList.add('active');
    } else if (view === 'home') {
        const homeNav = document.querySelector('.nav-list a[data-view="home"]');
        if (homeNav) homeNav.classList.add('active');
    }
}

async function fetchInitialData() {
    try {
        if (!db) throw new Error("Firebase DB not initialized");
        const snapshot = await db.ref('medical_capital').get();
        if (snapshot.exists()) {
            const data = snapshot.val();

            // Format Categories
            if (data.categories) {
                state.categories = Object.keys(data.categories).map(key => ({
                    id: key,
                    ...data.categories[key]
                }));
            } else {
                state.categories = [...defaultCategories];
                await seedDatabase('categories', state.categories);
            }

            // Format Subcategories
            if (data.subCategories) {
                state.subCategories = Object.keys(data.subCategories).map(key => ({
                    id: key,
                    ...data.subCategories[key]
                }));
            } else {
                state.subCategories = [];
            }

            // Format Products
            if (data.products) {
                state.products = Object.keys(data.products).map(key => ({
                    id: key,
                    ...data.products[key]
                }));
            } else {
                state.products = [...defaultProducts];
                await seedDatabase('products', state.products);
            }
        } else {
            // First time initialization
            state.categories = [...defaultCategories];
            state.subCategories = [];
            state.products = [...defaultProducts];
            await seedDatabase('categories', state.categories);
            await seedDatabase('products', state.products);
        }
    } catch (error) {
        console.error("Firebase read failed: " + error.message);
        throw error;
    }
}

async function seedDatabase(path, arrayData) {
    if (!db) return;
    const updateObj = {};
    arrayData.forEach(item => {
        updateObj[`medical_capital/${path}/${item.id}`] = item;
    });
    await db.ref().update(updateObj);
}

function patchCategoriesWithImages() {
    let needsUpdate = false;
    state.categories.forEach(cat => {
        if (cat.id === '2') {
            if (!cat.image || !cat.image.includes('cosmetics.png')) {
                cat.image = 'cosmetics.png?v=2';
                syncToFirebase('update', 'categories/2', { image: cat.image });
                needsUpdate = true;
            }
        } else if (!cat.image) {
            const defaultCat = defaultCategories.find(dc => dc.id === cat.id);
            if (defaultCat) {
                cat.image = defaultCat.image;
                needsUpdate = true;
            }
        }
    });
    if (needsUpdate) saveData();
}

function saveData() {
    // Always save locally to ensure site logic never breaks
    localStorage.setItem('mc_categories', JSON.stringify(state.categories));
    localStorage.setItem('mc_subcategories', JSON.stringify(state.subCategories));
    localStorage.setItem('mc_products', JSON.stringify(state.products));
    localStorage.setItem('mc_cart', JSON.stringify(state.cart));
}

async function syncToFirebase(action, pathStr, data = null) {
    try {
        if (!db) return;
        const dbRef = db.ref(`medical_capital/${pathStr}`);
        if (action === 'set') await dbRef.set(data);
        if (action === 'update') await dbRef.update(data);
        if (action === 'remove') await dbRef.remove();
    } catch (e) {
        console.warn('Firebase Sync Ignored:', e.message);
    }
}

// --- Navigation & Routing --- //
const appContent = document.getElementById('app-content');

const views = {
    home: () => {
        let sectionsHTML = '';
        state.categories.forEach(cat => {
            const catProducts = state.products.filter(p => p.categoryId === cat.id);
            if (catProducts.length > 0) {
                sectionsHTML += `
                    <section class="products-section container">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 class="section-title" style="margin-bottom: 0;">${cat.name}</h2>
                            <div style="display:flex; gap: 10px; align-items:center;">
                                <div class="scroll-arrows">
                                    <button class="scroll-arrow right-arrow" onclick="scrollSection('${cat.id}', -1)" title="السابق"><i class="fas fa-chevron-right"></i></button>
                                    <button class="scroll-arrow left-arrow" onclick="scrollSection('${cat.id}', 1)" title="التالي"><i class="fas fa-chevron-left"></i></button>
                                </div>
                                <a href="#" class="btn btn-outline" data-view="category" data-cat-id="${cat.id}" style="font-size: 14px; padding: 5px 15px;">عرض الكل</a>
                            </div>
                        </div>
                        <div class="horizontal-scroll-wrapper" id="scroll-wrapper-${cat.id}">
                            ${renderProductsGrid(sortProductsList(catProducts))}
                        </div>
                    </section>
                `;
            }
        });


        return `
            <section class="hero">
                <div class="hero-content">
                    <h1 class="hero-title">العاصمة الطبية</h1>
                    <p class="hero-subtitle">شريكك الموثوق في المستلزمات الطبية ومستحضرات التجميل والسلامة الغذائية</p>
                    <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                        <button class="btn btn-secondary" style="font-size: 18px; padding: 15px 30px;" data-view="category" data-cat-id="1">تسوق المستلزمات الطبية</button>
                        <button class="btn btn-accent" style="font-size: 18px; padding: 15px 30px;" data-view="offers">شاهد أحدث العروض</button>
                    </div>
                </div>
            </section>
            ${sectionsHTML || '<div class="container" style="text-align:center; padding: 50px 0;"><p>لا توجد منتجات حالياً.</p></div>'}
        `;
    },
    category: (catId) => {
        const cat = state.categories.find(c => c.id === catId);
        const catProducts = state.products.filter(p => p.categoryId === catId);
        const catImage = cat && cat.image ? cat.image : 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

        const subCats = state.subCategories.filter(sc => sc.categoryId === catId);
        let sectionsHTML = '';

        subCats.forEach(sc => {
            const scProducts = catProducts.filter(p => p.subCategoryId === sc.id);
            sectionsHTML += `
                <div style="margin-bottom: 40px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 class="section-title" style="margin-bottom: 0; font-size: 24px;">${sc.name}</h3>
                        ${state.isAdminAuth ? `<div style="display:inline-flex; gap: 5px; margin-right:15px;"><button style="background:none; border:none; cursor:pointer;" onclick="editSubCategory('${sc.id}')"><i class="fas fa-edit" style="color:var(--secondary-color)"></i></button><button style="background:none; border:none; cursor:pointer;" onclick="deleteSubCategory('${sc.id}')"><i class="fas fa-trash" style="color:red"></i></button></div>` : ''}
                        <div style="display:flex; gap: 10px; align-items:center; margin-right: auto;">
                            <div class="scroll-arrows">
                                <button class="scroll-arrow right-arrow" onclick="scrollSection('sc-${sc.id}', -1)" title="السابق"><i class="fas fa-chevron-right"></i></button>
                                <button class="scroll-arrow left-arrow" onclick="scrollSection('sc-${sc.id}', 1)" title="التالي"><i class="fas fa-chevron-left"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="horizontal-scroll-wrapper" id="scroll-wrapper-sc-${sc.id}">
                        ${scProducts.length > 0 ? renderProductsGrid(sortProductsList(scProducts)) : '<p style="text-align:center; font-size:16px; width:100%; color:#777; padding:20px 0;">لا توجد منتجات في هذا التصنيف الداخلي حالياً.</p>'}
                    </div>
                </div>
            `;
        });

        const otherProducts = catProducts.filter(p => !p.subCategoryId);
        if (otherProducts.length > 0) {
            sectionsHTML += `
                <div style="margin-bottom: 40px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 class="section-title" style="margin-bottom: 0; font-size: 24px;">${subCats.length > 0 ? 'منتجات العرض العام' : 'جميع المنتجات'}</h3>
                        <div style="display:flex; gap: 10px; align-items:center;">
                            <div class="scroll-arrows">
                                <button class="scroll-arrow right-arrow" onclick="scrollSection('other-${catId}', -1)" title="السابق"><i class="fas fa-chevron-right"></i></button>
                                <button class="scroll-arrow left-arrow" onclick="scrollSection('other-${catId}', 1)" title="التالي"><i class="fas fa-chevron-left"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="horizontal-scroll-wrapper" id="scroll-wrapper-other-${catId}">
                        ${renderProductsGrid(sortProductsList(otherProducts))}
                    </div>
                </div>
            `;
        }

        return `
            <div class="category-header" style="background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${catImage}') center/cover; padding: 60px 0;">
                <div class="container text-center">
                    <h1 style="color: white; font-size: 40px; margin: 0;">${cat ? cat.name : 'القسم'}</h1>
                </div>
            </div>
            <section class="products-section container" style="padding-top: 30px;">
                <div class="sorting-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                    ${state.isAdminAuth ? `
                        <div style="display:flex; gap:10px;">
                            <button class="btn btn-primary" onclick="openProductModalWithCat('${catId}')"><i class="fas fa-plus"></i> منتج جديد</button>
                            <button class="btn btn-secondary" onclick="openSubCategoryModal('${catId}')"><i class="fas fa-layer-group"></i> تصنيف داخلي جديد</button>
                        </div>
                    ` : '<div></div>'}
                    <div class="sort-control" style="display: flex; align-items: center; gap: 10px;">
                        <label for="sortCats" style="font-weight: bold; color: var(--text-dark);">ترتيب حسب:</label>
                        <select id="sortCats" onchange="changeSort(this.value, 'category', '${catId}')" style="padding: 8px; border-radius: 4px; border: 1px solid #ccc; font-family: inherit;">
                            <option value="newest" ${state.currentSort === 'newest' ? 'selected' : ''}>الأحدث</option>
                            <option value="oldest" ${state.currentSort === 'oldest' ? 'selected' : ''}>الأقدم</option>
                            <option value="alpha" ${state.currentSort === 'alpha' ? 'selected' : ''}>أبجدياً (أ-ي)</option>
                        </select>
                    </div>
                </div>
                ${(catProducts.length > 0 || subCats.length > 0) ? sectionsHTML : `<p style="text-align:center; font-size:18px;">لا توجد منتجات في هذا القسم حاليا.</p>`}
            </section>
        `;
    },
    offers: () => {
        const offerProducts = state.products.filter(p => p.isOffer);
        return `
            <div class="page-header">
                <div class="container">
                    <h1>أحدث العروض</h1>
                </div>
            </div>
            <section class="products-section container" style="padding-top: 30px;">
                <div class="sorting-row" style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 20px;">
                    <div class="sort-control" style="display: flex; align-items: center; gap: 10px;">
                        <label for="sortOffs" style="font-weight: bold; color: var(--text-dark);">ترتيب حسب:</label>
                        <select id="sortOffs" onchange="changeSort(this.value, 'offers')" style="padding: 8px; border-radius: 4px; border: 1px solid #ccc; font-family: inherit;">
                            <option value="newest" ${state.currentSort === 'newest' ? 'selected' : ''}>الأحدث</option>
                            <option value="oldest" ${state.currentSort === 'oldest' ? 'selected' : ''}>الأقدم</option>
                            <option value="alpha" ${state.currentSort === 'alpha' ? 'selected' : ''}>أبجدياً (أ-ي)</option>
                        </select>
                    </div>
                </div>
                ${offerProducts.length > 0 ?
                `<div class="product-grid">${renderProductsGrid(sortProductsList(offerProducts))}</div>` :
                `<p style="text-align:center; font-size:18px;">لا توجد عروض حالياً.</p>`
            }
            </section>
        `;
    },
    product: (prodId) => {
        const product = state.products.find(p => p.id === prodId);
        if (!product) return `<div class="container"><p>المنتج غير موجود</p></div>`;
        const cat = state.categories.find(c => c.id === product.categoryId);

        return `
            <div class="product-details">
                <div class="product-details-img">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-details-info">
                    <span class="product-category">${cat ? cat.name : ''}</span>
                    <h1 class="product-details-title">${product.name}</h1>
                    <div class="product-status ${product.inStock ? 'status-instock' : 'status-outstock'}">
                        <i class="fas ${product.inStock ? 'fa-check-circle' : 'fa-times-circle'}"></i> 
                        ${product.inStock ? 'متوفر بالمخزون' : 'غير متوفر حالياً'}
                    </div>
                    <div class="product-details-price">
                        ${product.onDemand ? 'حسب الطلب' : `${product.price} جنيه ${product.oldPrice ? `<span class="old-price">${product.oldPrice} جنيه</span>` : ''}`}
                    </div>
                    <p class="product-details-desc">${product.description || 'لا يوجد وصف متاح.'}</p>
                    
                    ${product.inStock ? `
                        <div class="quantity-control">
                            <button class="quantity-btn" onclick="updateQtyInput(1)">+</button>
                            <input type="number" id="detailQty" class="quantity-input" value="1" min="1">
                            <button class="quantity-btn" onclick="updateQtyInput(-1)">-</button>
                        </div>
                        <button class="btn btn-primary btn-block" onclick="addToCart('${product.id}', parseInt(document.getElementById('detailQty').value))" style="font-size: 18px; padding: 15px;">
                            <i class="fas fa-cart-plus"></i> أضف إلى العربة
                        </button>
                    ` : `
                        <button class="btn btn-secondary btn-block" disabled style="opacity:0.6;">غير متوفر حاليا</button>
                    `}
                </div>
            </div>
        `;
    },
    about: () => `
        <div class="page-header">
            <div class="container">
                <h1>من نحن</h1>
            </div>
        </div>
        <div class="content-section">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: var(--primary-color); font-size: 32px; font-weight: 800;">العاصمة <span style="color: var(--secondary-color);">الطبية</span></h2>
            </div>
            <p><strong>العاصمة الطبية</strong> شركة متخصصة في توريد المستلزمات الطبية ومستحضرات التجميل والمستلزمات الرياضية ومستلزمات سلامة الغذاء، بالإضافة إلى تجهيز العيادات وتوفير لوازم الصيدليات.</p>
            <p>نعمل على تقديم حلول متكاملة تلبي احتياجات القطاع الطبي والقطاعات المرتبطة به، مع الالتزام بتوفير منتجات عالية الجودة مطابقة لأعلى معايير السلامة والكفاءة.</p>
            <p>نسعى دائمًا لبناء شراكات طويلة الأمد مع عملائنا من خلال خدمة احترافية، وأسعار تنافسية، وسرعة في تلبية الطلبات، إيمانًا منا بأن الثقة والجودة هما أساس النجاح والاستمرارية.</p>
        </div>
    `,
    contact: () => `
        <div class="page-header">
            <div class="container">
                <h1>اتصل بنا</h1>
            </div>
        </div>
        <div class="content-section">
            <div class="contact-wrap">
                <div class="contact-info-block">
                    <h2>معلومات التواصل</h2>
                    <p style="margin-bottom: 30px; color: var(--text-light);">يسعدنا تواصلكم معنا في أي وقت للرد على استفساراتكم وتلبية طلباتكم.</p>
                    
                    <div class="contact-info-item">
                        <div class="contact-info-icon"><i class="fas fa-map-marker-alt"></i></div>
                        <div class="contact-info-text">
                            <h3>العنوان</h3>
                            <p>أكتوبر - الحصري - المحور المركزي - متفرع من بزار الجامعة ومول الهدير - برج 4</p>
                        </div>
                    </div>
                    
                    <div class="contact-info-item">
                        <div class="contact-info-icon"><i class="fas fa-phone"></i></div>
                        <div class="contact-info-text">
                            <h3>أرقام الهاتف</h3>
                            <p>01018683910</p>
                            <p>01022431542</p>
                        </div>
                    </div>
                    
                    <div class="contact-info-item">
                        <div class="contact-info-icon"><i class="fab fa-facebook-f"></i></div>
                        <div class="contact-info-text">
                            <h3>صفحتنا على فيسبوك</h3>
                            <p><a href="https://www.facebook.com/share/183DpsGvVx/" target="_blank" style="color: var(--primary-color);">العاصمة الطبية</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    policy: () => `
        <div class="page-header">
            <div class="container">
                <h1>سياسة البيع</h1>
            </div>
        </div>
        <div class="content-section" style="line-height: 1.8;">
            <p style="text-align: center; font-size: 1.1em; font-weight: bold; margin-bottom: 30px;">
                نضع ثقتكم وراحتكم في مقدمة أولوياتنا، ونسعى دائمًا لتقديم منتجات آمنة وتجربة شراء مميزة تليق بكم.
            </p>
            
            <h2 style="color: var(--primary-color); margin-bottom: 15px;">سياسة البيع</h2>
            <ul>
                <li style="margin-bottom: 15px;"><strong>-</strong> نحرص على توفير منتجات أصلية بجودة موثوقة ومعتمدة.</li>
                <li style="margin-bottom: 15px;"><strong>-</strong> نلتزم بتوضيح كافة تفاصيل المنتجات بشفافية ودقة.</li>
                <li style="margin-bottom: 15px;"><strong>-</strong> يتم تنفيذ الطلبات في أسرع وقت ممكن وفقًا لتوفر المنتجات وموقع العميل.</li>
            </ul>

            <h2 style="color: var(--primary-color); margin-bottom: 15px;">الاستبدال والاسترجاع</h2>
            <p>حرصًا على رضاكم، يمكنكم طلب الاستبدال أو الاسترجاع خلال 7 أيام من تاريخ الاستلام في الحالات التالية:</p>
            <ul>
                <li style="margin-bottom: 10px;"><strong>-</strong> وجود عيب صناعي بالمنتج.</li>
                <li style="margin-bottom: 10px;"><strong>-</strong> استلام منتج غير مطابق للطلب.</li>
                <li style="margin-bottom: 10px;"><strong>-</strong> تعرض المنتج للتلف أثناء الشحن.</li>
            </ul>
            <p style="margin-top: 15px; font-weight: bold;">الشروط:</p>
            <ul>
                <li style="margin-bottom: 10px;"><strong>-</strong> أن يكون المنتج بحالته الأصلية وغير مستخدم.</li>
                <li style="margin-bottom: 10px;"><strong>-</strong> إرفاق الفاتورة أو ما يثبت عملية الشراء.</li>
            </ul>

            <h2 style="color: var(--primary-color); margin-bottom: 15px; margin-top: 25px;">المنتجات غير القابلة للاسترجاع</h2>
            <p>حفاظًا على سلامتكم:</p>
            <ul>
                <li style="margin-bottom: 10px;"><strong>-</strong> لا يمكن استرجاع المنتجات الطبية ذات الاستخدام الشخصي بعد فتحها.</li>
                <li style="margin-bottom: 10px;"><strong>-</strong> لا يمكن استرجاع مستحضرات التجميل بعد فتح العبوة أو استخدامها.</li>
            </ul>

            <h2 style="color: var(--primary-color); margin-bottom: 15px; margin-top: 25px;">الشحن</h2>
            <ul>
                <li style="margin-bottom: 10px;"><strong>-</strong> تتحمل الشركة تكلفة الشحن في حال وجود خطأ أو عيب بالمنتج.</li>
                <li style="margin-bottom: 10px;"><strong>-</strong> يتحمل العميل تكلفة الشحن في غير ذلك من الحالات.</li>
            </ul>

            <p style="text-align: center; font-size: 1.1em; font-weight: bold; margin-top: 30px; color: var(--secondary-color);">
                ثقتكم محل تقديرنا الدائم، ونسعد بخدمتكم بكل اهتمام وحرص.
            </p>
        </div>
    `,
    admin: () => {
        if (!state.isAdminAuth) {
            return `
                <div class="container" style="padding: 100px 0; text-align: center;">
                    <h2>غير مصرح لك بدخول هذه الصفحة</h2>
                    <button class="btn btn-primary" onclick="window.location.hash=''; renderView('home');">العودة للرئيسية</button>
                </div>
            `;
        }
        return `
            <div class="admin-container">
                <div class="admin-sidebar">
                    <h2>لوحة التحكم</h2>
                    <ul class="admin-menu">
                        <li class="active" onclick="switchAdminPanel('products', event)"><i class="fas fa-box"></i> إدارة المنتجات</li>
                        <li onclick="switchAdminPanel('categories', event)"><i class="fas fa-tags"></i> إدارة الأقسام</li>
                        <li onclick="logoutAdmin()"><i class="fas fa-sign-out-alt"></i> تسجيل خروج</li>
                    </ul>
                </div>
                <div class="admin-content">
                    <!-- Products Panel -->
                    <div id="panel-products" class="admin-panel active">
                        <div class="admin-header">
                            <h3>المنتجات (${state.products.length})</h3>
                            <button class="btn btn-primary" onclick="openProductModal()"><i class="fas fa-plus"></i> إضافة منتج</button>
                        </div>
                        <div style="overflow-x: auto;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>الصورة</th>
                                        <th>الاسم</th>
                                        <th>السعر</th>
                                        <th>القسم</th>
                                        <th>الحالة</th>
                                        <th>عرض</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${state.products.map(p => {
            const cat = state.categories.find(c => c.id === p.categoryId);
            const subCat = p.subCategoryId ? state.subCategories.find(s => s.id === p.subCategoryId) : null;
            const catText = cat ? cat.name + (subCat ? ` <strong style="color:var(--primary-color);">(${subCat.name})</strong>` : '') : '-';
            return `
                                        <tr>
                                            <td><img src="${p.image}" alt=""></td>
                                            <td>${p.name}</td>
                                            <td>${p.onDemand ? 'حسب الطلب' : `${p.price} ج`}</td>
                                            <td>${catText}</td>
                                            <td>${p.inStock ? '<span style="color:green;">متوفر</span>' : '<span style="color:red;">غير متوفر</span>'}</td>
                                            <td>${p.isOffer ? '<span style="color:orange;">نعم</span>' : 'لا'}</td>
                                            <td class="action-btns">
                                                <button class="btn btn-secondary" onclick="editProduct('${p.id}')">تعديل</button>
                                                <button class="btn" style="background-color: #e74c3c; color: white;" onclick="deleteProduct('${p.id}')">حذف</button>
                                            </td>
                                        </tr>`;
        }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Categories Panel -->
                    <div id="panel-categories" class="admin-panel">
                        <div class="admin-header">
                            <h3>الأقسام والتصنيفات الداخلية (${state.categories.length})</h3>
                            <form id="addCategoryForm" style="display: flex; gap: 10px;">
                                <input type="text" id="newCategoryName" placeholder="اسم القسم الجديد" required style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                <button type="submit" class="btn btn-primary">إضافة</button>
                            </form>
                        </div>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>الصورة</th>
                                    <th>القسم الرئيسي</th>
                                    <th style="width: 40%;">التصنيفات الداخلية (اضغط للإدارة)</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${state.categories.map(c => `
                                    <tr>
                                        <td><img src="${c.image || ''}" alt="" style="width:50px; height:50px; object-fit:cover; border-radius:4px;"></td>
                                        <td style="font-weight: bold;">${c.name}</td>
                                        <td>
                                            ${state.subCategories.filter(sc => sc.categoryId === c.id).map(sc => `
                                                <div style="display:flex; justify-content:space-between; align-items:center; background:#f0f0f0; padding:5px 10px; margin-bottom:5px; border-radius:4px;">
                                                    <span style="font-size: 14px;">${sc.name}</span>
                                                    <div>
                                                        <button class="btn" style="padding:2px 5px; font-size:12px; background:none; border:none; cursor:pointer;" onclick="editSubCategory('${sc.id}')"><i class="fas fa-edit" style="color:var(--secondary-color)"></i></button>
                                                        <button class="btn" style="padding:2px 5px; font-size:12px; color:red; background:none; border:none; cursor:pointer;" onclick="deleteSubCategory('${sc.id}')"><i class="fas fa-trash"></i></button>
                                                    </div>
                                                </div>
                                            `).join('')}
                                            <button class="btn btn-outline" style="padding:5px; font-size:12px; width:100%; margin-top:5px;" onclick="openSubCategoryModal('${c.id}')"><i class="fas fa-plus"></i> إضافة تصنيف داخلي جديد</button>
                                        </td>
                                        <td class="action-btns">
                                            <button class="btn btn-secondary" onclick="editCategory('${c.id}')">تعديل</button>
                                            <button class="btn" style="background-color: #e74c3c; color: white;" onclick="deleteCategory('${c.id}')">حذف</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
};

window.openProductModalWithCat = function (catId) {
    openProductModal();
    if (document.getElementById('adminProdCat')) {
        document.getElementById('adminProdCat').value = catId;
    }
}

window.changeSort = function (sortVal, view, param = null) {
    state.currentSort = sortVal;
    renderView(view, param);
}

function sortProductsList(list) {
    let sorted = [...list];
    if (state.currentSort === 'newest') sorted.reverse(); // Newest is at the end of the original list
    else if (state.currentSort === 'alpha') sorted.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    return sorted;
}

window.deleteProductFromGrid = function (id, catId) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        state.products = state.products.filter(p => p.id !== id);
        state.cart = state.cart.filter(item => item.product.id !== id);
        saveData();
        updateCartUI();
        if (state.currentView === 'category') {
            renderView('category', catId);
        } else {
            renderView(state.currentView);
        }
        syncToFirebase('remove', `products/${id}`);
    }
}

function renderProductsGrid(productsList) {
    return productsList.map(p => {
        const cat = state.categories.find(c => c.id === p.categoryId);
        return `
            <div class="product-card">
                ${p.isOffer ? `<span class="product-badge">عرض</span>` : ''}
                <div class="product-img" onclick="navigateTo('product', '${p.id}')">
                    <img src="${p.image}" alt="${p.name}">
                </div>
                <div class="product-info">
                    <span class="product-category">${cat ? cat.name : ''}</span>
                    <h3 class="product-title" onclick="navigateTo('product', '${p.id}')">${p.name}</h3>
                    <div class="product-price">
                        ${p.onDemand ? 'حسب الطلب' : `${p.price} ج ${p.oldPrice ? `<span class="old-price">${p.oldPrice} ج</span>` : ''}`}
                    </div>
                    <div class="product-action">
                        <button class="btn btn-primary btn-block" onclick="addToCart('${p.id}', 1)" ${!p.inStock ? 'disabled style="opacity:0.6"' : ''}>
                            <i class="fas fa-cart-plus"></i> ${p.inStock ? 'إضافة للعربة' : 'غير متوفر'}
                        </button>
                    </div>
                    
                    ${state.isAdminAuth ? `
                        <div style="display:flex; gap:10px; margin-top:15px; border-top: 1px solid #eee; padding-top: 10px;">
                            <button class="btn btn-secondary" style="flex:1; padding:5px; font-size:14px;" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i> تعديل</button>
                            <button class="btn" style="flex:1; padding:5px; font-size:14px; background-color: #e74c3c; color: white;" onclick="deleteProductFromGrid('${p.id}', '${p.categoryId}')"><i class="fas fa-trash"></i> مسح</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function initNavigation() {
    document.body.addEventListener('click', (e) => {
        const el = e.target.closest('[data-view]');
        if (el) {
            e.preventDefault();
            const view = el.getAttribute('data-view');
            const catId = el.getAttribute('data-cat-id');
            const prodId = el.getAttribute('data-prod-id');
            navigateTo(view, catId || prodId);
        }
    });

    // Mobile menu
    const mainNav = document.getElementById('mainNav');
    const overlay = document.getElementById('mobileMenuOverlay');
    const closeBtn = document.getElementById('closeMobileMenuBtn');

    function closeMenu() {
        mainNav.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        mainNav.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);
}

function navigateTo(view, param = null) {
    if (state.currentView === view && state.currentParam === param) return;

    // Use history API to allow back button
    let url = '?view=' + view;
    if (param) url += '&id=' + param;
    history.pushState({ view, param }, '', url);

    handleUrlRoute();

    document.getElementById('mainNav').classList.remove('active');
    if (document.getElementById('mobileMenuOverlay')) {
        document.getElementById('mobileMenuOverlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    window.scrollTo(0, 0);

    // Update footer auth UI
    if (state.isAdminAuth) {
        document.getElementById('showAdminLoginBtn').style.display = 'none';
        document.getElementById('logoutAdminBtnFoot').style.display = 'inline-block';
    } else {
        document.getElementById('showAdminLoginBtn').style.display = 'inline-block';
        document.getElementById('logoutAdminBtnFoot').style.display = 'none';
    }
}

function renderView(view, param = null) {
    if (views[view]) {
        appContent.innerHTML = views[view](param);
    } else {
        appContent.innerHTML = `<div class="container" style="padding: 100px 0; text-align:center;"><h2>الصفحة غير موجودة</h2></div>`;
    }
}

// Global helper for detail page
window.updateQtyInput = function (change) {
    const input = document.getElementById('detailQty');
    if (input) {
        let val = parseInt(input.value) + change;
        if (val < 1) val = 1;
        input.value = val;
    }
}

function renderFooterCategories() {
    const fc = document.getElementById('footer-categories');
    fc.innerHTML = state.categories.slice(0, 5).map(c => `
        <li><a href="#" data-view="category" data-cat-id="${c.id}">${c.name}</a></li>
    `).join('');
    // Event delegation from initNavigation handles these links now
}

// --- Cart System --- //
function initCart() {
    updateCartUI();

    document.getElementById('openCartBtn').addEventListener('click', () => {
        document.getElementById('cartModal').classList.add('active');
    });

    document.getElementById('closeCartModal').addEventListener('click', () => {
        document.getElementById('cartModal').classList.remove('active');
    });

    document.getElementById('checkoutForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitOrder();
    });
}

window.addToCart = function (productId, qty = 1) {
    const product = state.products.find(p => p.id === productId);
    if (!product || !product.inStock) return;

    const existingItem = state.cart.find(item => item.product.id === productId);
    if (existingItem) {
        existingItem.qty += qty;
    } else {
        state.cart.push({ product, qty });
    }

    saveData();
    updateCartUI();

    // Simple visual feedback
    const badge = document.getElementById('cartBadge');
    badge.style.transform = 'scale(1.5)';
    setTimeout(() => badge.style.transform = 'scale(1)', 200);
}

window.removeFromCart = function (index) {
    state.cart.splice(index, 1);
    saveData();
    updateCartUI();
}

function updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const itemsContainer = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const checkoutForm = document.getElementById('checkoutForm');

    // Update Badge
    const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
    badge.innerText = totalItems;

    if (state.cart.length === 0) {
        itemsContainer.innerHTML = '<p style="text-align:center; padding: 20px;">عربة التسوق فارغة</p>';
        totalEl.innerText = '0';
        checkoutForm.style.display = 'none';
        return;
    }

    checkoutForm.style.display = 'block';
    let total = 0;

    itemsContainer.innerHTML = state.cart.map((item, index) => {
        const itemTotal = item.product.price * item.qty;
        if (!item.product.onDemand) total += itemTotal;
        return `
            <div class="cart-item">
                <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.product.name}</div>
                    <div style="font-size: 13px; color: var(--text-dark); display:flex; align-items:center; gap: 10px; margin-top: 5px;">
                        الكمية: 
                        <div class="quantity-control form-control" style="margin-bottom:0; display:inline-flex; border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color);">
                            <button type="button" onclick="updateCartItemQty(${index}, 1)" style="width:30px;height:30px;font-size:16px; background:var(--bg-light); border:none; cursor:pointer;">+</button>
                            <span style="width: 30px; text-align: center; border-left: 1px solid var(--border-color); border-right: 1px solid var(--border-color); line-height: 30px; background: white;">${item.qty}</span>
                            <button type="button" onclick="updateCartItemQty(${index}, -1)" style="width:30px;height:30px;font-size:16px; background:var(--bg-light); border:none; cursor:pointer;">-</button>
                        </div>
                    </div>
                    <div class="cart-item-price" style="margin-top:5px;">${item.product.onDemand ? 'حسب الطلب' : itemTotal + ' ج'}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="remove-item" onclick="removeFromCart(${index})" title="حذف من العربة"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');

    totalEl.innerText = total;
}

window.updateCartItemQty = function (index, change) {
    const item = state.cart[index];
    if (item) {
        item.qty += change;
        if (item.qty < 1) item.qty = 1;
        saveData();
        updateCartUI();
    }
}

function submitOrder() {
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const notesEl = document.getElementById('orderNotes');
    const notes = notesEl ? notesEl.value.trim() : '';

    if (state.cart.length === 0) return;

    let total = 0;

    // Professional WhatsApp format
    let message = `*تفاصيل طلب جديد - العاصمة الطبية*\n\n`;

    state.cart.forEach((item, index) => {
        const itemTotal = item.product.price * item.qty;
        if (!item.product.onDemand) total += itemTotal;
        message += `*${index + 1}. ${item.product.name}*\n`;
        message += `الكمية: ${item.qty} | السعر: ${item.product.onDemand ? 'حسب الطلب' : itemTotal + ' جنيه'}\n\n`;
    });

    message += `*إجمالي الطلب:* ${total} جنيه\n\n`;
    message += `*بيانات العميل:*\n`;
    message += `الاسم: ${name}\n`;
    message += `رقم الهاتف: ${phone}\n`;

    if (notes) {
        message += `\n*ملاحظات الطلب:*\n${notes}\n`;
    }

    message += `\nشكرًا لإختيارك شركة العاصمة الطبية.\nتم استلام الأوردر بنجاح، ونعمل الآن على تجهيزه في أسرع وقت، وسنقوم بالتواصل معك.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappNum = "01018683910"; // Default number
    const whatsappUrl = `https://wa.me/2${whatsappNum}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    // Clear cart after order
    state.cart = [];
    saveData();
    updateCartUI();
    document.getElementById('cartModal').classList.remove('active');
}

// --- Search System --- //
function initSearch() {
    const input = document.getElementById('searchInput');
    const resultsArea = document.getElementById('searchResults');

    input.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length < 2) {
            resultsArea.classList.remove('active');
            return;
        }

        const results = state.products.filter(p => p.name.toLowerCase().includes(query));

        if (results.length > 0) {
            resultsArea.innerHTML = results.map(p => `
                <div class="search-item" onclick="document.getElementById('searchResults').classList.remove('active'); document.getElementById('searchInput').value=''; navigateTo('product', '${p.id}')">
                    <img src="${p.image}" alt="">
                    <span>${p.name}</span>
                </div>
            `).join('');
            resultsArea.classList.add('active');
        } else {
            resultsArea.innerHTML = '<div style="padding:10px;text-align:center;">لا توجد نتائج</div>';
            resultsArea.classList.add('active');
        }
    });

    // Hide search when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar')) {
            resultsArea.classList.remove('active');
        }
    });
}

// --- Admin System --- //
function initAdmin() {
    let clickCount = 0;
    let clickTimer;

    // Fallback for mobile: clicking the footer logo 5 times within 2 seconds
    const footerLogo = document.querySelector('.footer-logo');
    if (footerLogo) {
        footerLogo.addEventListener('click', () => {
            clickCount++;
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickCount = 0; }, 2000);

            if (clickCount >= 5) {
                const code = prompt("أدخل الرمز السري:");
                if (code === '1357') {
                    state.isAdminAuth = true;
                    sessionStorage.setItem('mc_admin_auth', 'true');
                    navigateTo('admin');
                } else if (code) {
                    alert('رمز الدخول غير صحيح');
                }
                clickCount = 0;
            }
        });
    }

    // Hidden admin trigger: typing "1357" anywhere
    window.addEventListener('keydown', (e) => {
        if (e.key >= '0' && e.key <= '9') {
            state.adminKeys += e.key;
            if (state.adminKeys.length > 4) {
                state.adminKeys = state.adminKeys.substring(1);
            }
            if (state.adminKeys === '1357') {
                if (state.isAdminAuth) {
                    navigateTo('admin');
                } else {
                    document.getElementById('adminLoginModal').classList.add('active');
                    document.getElementById('adminCode').value = '';
                }
                state.adminKeys = ''; // reset
            }
        } else {
            state.adminKeys = ''; // reset on any other key
        }
    });

    document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const codeInput = document.getElementById('adminCode');
        if (codeInput.value === '1357') {
            document.getElementById('adminLoginModal').classList.remove('active');
            state.isAdminAuth = true;
            sessionStorage.setItem('mc_admin_auth', 'true');
            // Navigate to admin initially, but allow them to stay on current page if triggered from specific view
            navigateTo('admin');
            codeInput.value = ''; // clear
        } else {
            alert('رمز الدخول غير صحيح');
            codeInput.value = '';
        }
    });

    // Footer explicit buttons
    document.getElementById('showAdminLoginBtn').addEventListener('click', () => {
        document.getElementById('adminLoginModal').classList.add('active');
        document.getElementById('adminCode').value = '';
    });

    document.getElementById('logoutAdminBtnFoot').addEventListener('click', () => {
        logoutAdmin();
    });
}

window.logoutAdmin = function () {
    state.isAdminAuth = false;
    sessionStorage.removeItem('mc_admin_auth');
    navigateTo('home');
}

window.switchAdminPanel = function (panel, event) {
    document.querySelectorAll('.admin-panel').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.admin-menu li').forEach(el => el.classList.remove('active'));

    document.getElementById(`panel-${panel}`).classList.add('active');

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        const panels = ['products', 'categories'];
        const index = panels.indexOf(panel);
        if (index >= 0) {
            const menuItems = document.querySelectorAll('.admin-menu li');
            if (menuItems[index]) menuItems[index].classList.add('active');
        }
    }
}

function setupAdminListeners() {
    // Listen for manual image URL input
    const imgDataInput = document.getElementById('adminProdImgData');
    if (imgDataInput) {
        imgDataInput.addEventListener('input', (e) => {
            const preview = document.getElementById('imgPreview');
            preview.src = e.target.value;
            preview.style.display = e.target.value ? 'block' : 'none';
        });
    }

    // Local File Image Upload
    const imageInput = document.getElementById('imageInput');
    const urlInput = document.getElementById("adminProdImgData");
    const preview = document.getElementById("imgPreview");

    if (imageInput) {
        imageInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const base64String = event.target.result;
                    if (preview && urlInput) {
                        preview.src = base64String;
                        preview.style.display = "block";
                        urlInput.value = base64String;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const prodForm = document.getElementById('productForm');
    if (prodForm) {
        prodForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = prodForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'جاري الحفظ...';
            submitBtn.disabled = true;

            const id = document.getElementById('adminProdId').value || 'p_' + Date.now();
            const isOnDemand = document.getElementById('adminProdOnDemand') ? document.getElementById('adminProdOnDemand').checked : false;
            const product = {
                id: id,
                name: document.getElementById('adminProdName').value,
                onDemand: isOnDemand,
                price: isOnDemand ? 0 : (parseFloat(document.getElementById('adminProdPrice').value) || 0),
                oldPrice: (!isOnDemand && document.getElementById('adminProdOldPrice').value) ? parseFloat(document.getElementById('adminProdOldPrice').value) : null,
                categoryId: document.getElementById('adminProdCat').value,
                subCategoryId: document.getElementById('adminProdSubCat').value || null,
                image: document.getElementById('adminProdImgData').value,
                description: document.getElementById('adminProdDesc').value,
                inStock: document.getElementById('adminProdStock').checked,
                isOffer: document.getElementById('adminProdOffer').checked
            };

            // Update local state optimistic
            const existingIdx = state.products.findIndex(p => p.id === id);
            if (existingIdx >= 0) {
                state.products[existingIdx] = product;
            } else {
                state.products.push(product);
            }

            saveData();
            document.getElementById('productModal').classList.remove('active');
            renderView(state.currentView, state.currentParam);

            // Sync to Firebase silently
            syncToFirebase('set', `products/${id}`, product);

            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        });
    }

    const catForm = document.getElementById('addCategoryForm');
    if (catForm) {
        catForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = catForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = '...';
            submitBtn.disabled = true;

            const name = document.getElementById('newCategoryName').value;
            const newCat = {
                id: 'c_' + Date.now(),
                name: name
            };

            state.categories.push(newCat);
            saveData();
            renderFooterCategories();
            renderView('admin');

            if (state.currentView === 'admin') {
                setTimeout(() => {
                    const el = document.querySelectorAll('.admin-menu li')[1];
                    if (el) el.click();
                }, 0);
            }

            // Sync to Firebase silently
            syncToFirebase('set', `categories/${newCat.id}`, newCat);

            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        });
    }

    const subCatForm = document.getElementById('subCategoryForm');
    if (subCatForm) {
        subCatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = subCatForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = '...';
            submitBtn.disabled = true;

            const name = document.getElementById('adminSubCatName').value;
            const parentId = document.getElementById('adminSubCatParentId').value;
            const newSubCat = {
                id: 'sc_' + Date.now(),
                categoryId: parentId,
                name: name
            };

            state.subCategories.push(newSubCat);
            saveData();
            document.getElementById('subCategoryModal').classList.remove('active');

            if (state.currentView === 'admin') {
                renderView('admin');
                setTimeout(() => {
                    const el = document.querySelectorAll('.admin-menu li')[1];
                    if (el) el.click();
                }, 0);
            } else {
                renderView(state.currentView, state.currentParam);
            }

            syncToFirebase('set', `subCategories/${newSubCat.id}`, newSubCat);
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        });
    }
}

window.openProductModal = function () {
    document.getElementById('productForm').reset();
    document.getElementById('adminProdId').value = '';
    document.getElementById('adminProdImgData').value = '';
    document.getElementById('imgPreview').style.display = 'none';

    if (document.getElementById('adminProdOnDemand')) {
        document.getElementById('adminProdOnDemand').checked = false;
        document.getElementById('priceContainer').style.display = 'flex';
    }

    // Populate categories
    const catSelect = document.getElementById('adminProdCat');
    if (catSelect) {
        catSelect.innerHTML = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        if (state.categories.length > 0) {
            populateSubCategoriesOptions(state.categories[0].id);
        }
    }

    document.getElementById('productModalTitle').innerText = 'إضافة منتج';
    document.getElementById('productModal').classList.add('active');
}

window.editProduct = function (id) {
    const p = state.products.find(x => x.id === id);
    if (!p) return;

    document.getElementById('adminProdId').value = p.id;
    document.getElementById('adminProdName').value = p.name;
    if (document.getElementById('adminProdOnDemand')) {
        document.getElementById('adminProdOnDemand').checked = p.onDemand || false;
        document.getElementById('priceContainer').style.display = p.onDemand ? 'none' : 'flex';
    }
    document.getElementById('adminProdPrice').value = p.onDemand ? '' : p.price;
    document.getElementById('adminProdOldPrice').value = p.oldPrice || '';

    // Populate categories before setting value
    const catSelect = document.getElementById('adminProdCat');
    if (catSelect) {
        catSelect.innerHTML = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    document.getElementById('adminProdCat').value = p.categoryId;
    populateSubCategoriesOptions(p.categoryId, p.subCategoryId);
    document.getElementById('adminProdImgData').value = p.image;

    // update preview
    const preview = document.getElementById('imgPreview');
    preview.src = p.image;
    preview.style.display = 'block';

    document.getElementById('adminProdDesc').value = p.description || '';
    document.getElementById('adminProdStock').checked = p.inStock;
    document.getElementById('adminProdOffer').checked = p.isOffer;

    document.getElementById('productModalTitle').innerText = 'تعديل منتج';
    document.getElementById('productModal').classList.add('active');
}

window.deleteProduct = function (id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        state.products = state.products.filter(p => p.id !== id);
        // Also remove from cart if present
        state.cart = state.cart.filter(item => item.product.id !== id);
        saveData();
        updateCartUI();
        if (state.currentView === 'admin') {
            renderView('admin');
        } else {
            renderView(state.currentView, state.currentParam);
        }
        syncToFirebase('remove', `products/${id}`);
    }
}

window.editCategory = function (id) {
    const c = state.categories.find(x => x.id === id);
    if (!c) return;

    const newName = prompt('اسم القسم الجديد:', c.name);
    if (newName === null) return;

    const newImage = prompt('رابط صورة القسم (اختياري):', c.image || '');

    if (newName.trim() !== '') {
        c.name = newName.trim();
        if (newImage !== null) {
            c.image = newImage.trim();
        }

        saveData();
        renderFooterCategories();

        if (state.currentView === 'admin') {
            renderView('admin');
            setTimeout(() => {
                const el = document.querySelectorAll('.admin-menu li')[1];
                if (el) el.click();
            }, 0);
        } else {
            renderView(state.currentView, state.currentParam);
        }

        syncToFirebase('set', `categories/${id}`, c);
    }
}

window.deleteCategory = function (id) {
    // Check if products exist in this category
    const hasProducts = state.products.some(p => p.categoryId === id);
    if (hasProducts) {
        alert('لا يمكن حذف قسم يحتوي على منتجات. يرجى نقل أو حذف المنتجات أولاً.');
        return;
    }

    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
        state.categories = state.categories.filter(c => c.id !== id);
        saveData();
        renderFooterCategories();
        renderView('admin');
        setTimeout(() => {
            const el = document.querySelectorAll('.admin-menu li')[1];
            if (el) el.click();
        }, 0);

        syncToFirebase('remove', `categories/${id}`);
    }
}

window.openSubCategoryModal = function (catId) {
    document.getElementById('subCategoryForm').reset();
    document.getElementById('adminSubCatParentId').value = catId;
    document.getElementById('subCategoryModal').classList.add('active');
}

window.editSubCategory = function (scId) {
    const sc = state.subCategories.find(s => s.id === scId);
    if (!sc) return;
    const newName = prompt('اسم التصنيف الداخلي الجديد:', sc.name);
    if (newName && newName.trim() !== '') {
        sc.name = newName.trim();
        saveData();
        if (state.currentView === 'admin') {
            renderView('admin');
            setTimeout(() => {
                const el = document.querySelectorAll('.admin-menu li')[1];
                if (el) el.click();
            }, 0);
        } else {
            renderView(state.currentView, state.currentParam);
        }
        syncToFirebase('set', `subCategories/${sc.id}`, sc);
    }
}

window.deleteSubCategory = function (scId) {
    const hasProducts = state.products.some(p => p.subCategoryId === scId);
    if (hasProducts) {
        alert('لا يمكن حذف قسم يحتوي على منتجات. يرجى نقل أو حذف المنتجات أولاً.');
        return;
    }
    if (confirm('هل أنت متأكد من حذف هذا التصنيف الداخلي؟')) {
        state.subCategories = state.subCategories.filter(s => s.id !== scId);
        saveData();
        if (state.currentView === 'admin') {
            renderView('admin');
            setTimeout(() => {
                const el = document.querySelectorAll('.admin-menu li')[1];
                if (el) el.click();
            }, 0);
        } else {
            renderView(state.currentView, state.currentParam);
        }
        syncToFirebase('remove', `subCategories/${scId}`);
    }
}

window.populateSubCategoriesOptions = function (catId, selectedSubId = null) {
    const subCatSelect = document.getElementById('adminProdSubCat');
    if (!subCatSelect) return;

    const subCats = state.subCategories.filter(s => s.categoryId === catId);
    let html = '<option value="">بدون تصنيف داخلي</option>';
    html += subCats.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    subCatSelect.innerHTML = html;

    if (selectedSubId) {
        subCatSelect.value = selectedSubId;
    }
}

window.scrollSection = function (id, direction) {
    const wrapper = document.getElementById('scroll-wrapper-' + id);
    if (wrapper) {
        const scrollAmount = 310; // width of card + gap
        // HTML has dir="rtl" on the html element
        const isRtl = document.documentElement.dir === 'rtl' || getComputedStyle(wrapper).direction === 'rtl';
        const scrollLeftVal = isRtl ? -scrollAmount : scrollAmount;
        wrapper.scrollBy({ left: direction * scrollLeftVal, behavior: 'smooth' });
    }
};

// Expose internal functions to the global window object to make HTML inline onclick attributes work with type="module"
window.navigateTo = navigateTo;
if (typeof addToCart !== 'undefined') window.addToCart = addToCart;
if (typeof removeFromCart !== 'undefined') window.removeFromCart = removeFromCart;
if (typeof updateCartQuantity !== 'undefined') window.updateCartQuantity = updateCartQuantity;
