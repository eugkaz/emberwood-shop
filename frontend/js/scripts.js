document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api';

    const updateHeader = () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        const headerActions = document.querySelector('.header-actions');

        if (token && user) {
            const userInitial = user.name ? user.name.charAt(0).toUpperCase() : '?';
            headerActions.innerHTML = `
                <a href="/profile" class="action-btn user-initial" aria-label="Профіль">${userInitial}</a>
                <a href="/cart" class="action-btn" aria-label="Кошик"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg><span class="cart-count">0</span></a>
                <button id="logout-btn" class="btn">Вийти</button>
            `;
            const userInitialBtn = headerActions.querySelector('.user-initial');
            if (userInitialBtn) {
                userInitialBtn.style.backgroundColor = 'var(--accent-color)';
                userInitialBtn.style.color = 'var(--surface-color)';
                userInitialBtn.style.fontWeight = 'bold';
                userInitialBtn.style.fontSize = '1.2rem';
            }

            document.getElementById('logout-btn').addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            });
        }
    };

    const getCart = () => JSON.parse(localStorage.getItem('monoshop_cart')) || [];
    const saveCart = (cart) => localStorage.setItem('monoshop_cart', JSON.stringify(cart));
    const addToCart = (product) => {
        const cart = getCart();
        if (!cart.find(item => item.id === product.id)) {
            cart.push(product);
            saveCart(cart);
        } else {
            console.log(`Товар "${product.name}" вже у кошику.`);
        }
    };

    const updateCartCounter = () => {
        const cartCounter = document.querySelector('.cart-count');
        if (!cartCounter) return;
        const cart = getCart();
        cartCounter.textContent = cart.length;
        cartCounter.style.display = cart.length > 0 ? 'flex' : 'none';
    };
    const disableButton = (button) => {
        if (!button) return;
        button.textContent = 'У кошику ✓';
        button.disabled = true;
        button.style.cursor = 'not-allowed';
    };

    const createProductCardHTML = (product) => {
        const priceFormatted = parseFloat(product.price).toLocaleString('uk-UA', { minimumFractionDigits: 2 });
        return `
            <article class="product-card" data-product-id="${product.id}">
                <a href="/product/${product.id}" class="product-link">
                    <img src="${product.image_url}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">${priceFormatted} грн.</p>
                    </div>
                </a>
                <button class="btn btn-primary add-to-cart-btn">У кошик</button>
            </article>`;
    };
    const loadAndRenderProducts = async (apiUrl) => {
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) return;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const products = await response.json();
            productGrid.innerHTML = '';
            products.forEach(product => productGrid.insertAdjacentHTML('beforeend', createProductCardHTML(product)));
            updateButtonStates();
        } catch (error) {
            console.error("Не вдалося завантажити товари:", error);
            productGrid.innerHTML = '<p style="text-align: center;">Помилка завантаження товарів. Будь ласка, спробуйте пізніше.</p>';
        }
    };
    const updateButtonStates = () => {
        const cart = getCart();
        document.querySelectorAll('.product-card').forEach(card => {
            const productId = card.dataset.productId;
            if (cart.find(item => item.id === productId)) {
                disableButton(card.querySelector('.add-to-cart-btn'));
            }
        });
    };

    document.body.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart-btn')) {
            const button = event.target;
            const productCard = button.closest('.product-card') || button.closest('.product-detail-info');
            const productId = productCard.dataset.productId || button.dataset.productId;

            // Щоб уникнути помилок, перевіряємо, чи ми на сторінці товару чи в каталозі
            const name = productCard.querySelector('h1, .product-name').textContent;
            const price = productCard.querySelector('.product-detail-price, .product-price').textContent;
            const image = document.querySelector('.product-detail-image img, .product-image')?.src;

            const product = { id: productId, name, price, image };

            addToCart(product);
            updateCartCounter();
            disableButton(button);
        }
    });

    updateHeader();
    updateCartCounter();
    if (document.querySelector('.hero')) {
        loadAndRenderProducts(`${API_BASE_URL}/products/popular`);
    } else if (document.querySelector('.catalog-layout')) {
        loadAndRenderProducts(`${API_BASE_URL}/products`);
    }
});

// ======================================== 
// КАСТОМНИЙ КУРСОР
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorFollower = document.querySelector('.cursor-follower');

    if (!cursorDot || !cursorFollower || window.innerWidth <= 768) return;

    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    const setTransform = (el, x, y) => {
        el.style.transform = `translate(${x}px, ${y}px)`;
    };

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        setTransform(cursorDot, mouseX, mouseY);

        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;
        setTransform(cursorFollower, followerX, followerY);

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    const addHoverEffects = (selector, className) => {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add(className));
            el.addEventListener('mouseleave', () => document.body.classList.remove(className));
        });
    };

    addHoverEffects('a, button, .btn, .product-card, .action-btn', 'cursor-hover');
    addHoverEffects('input[type="text"], input[type="email"], textarea', 'cursor-text');

    document.addEventListener('mouseleave', () => {
        cursorDot.style.opacity = '0';
        cursorFollower.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
        cursorDot.style.opacity = '1';
        cursorFollower.style.opacity = '1';
    });

    document.body.style.cursor = 'none';
});

