document.addEventListener('DOMContentLoaded', () => {
    const cartItemsList = document.querySelector('.cart-items-list');
    const cartEmptyMessage = document.querySelector('.cart-empty');
    const cartContainer = document.querySelector('.cart-container');
    const summaryPriceElem = document.querySelector('.summary-price');
    const totalPriceElem = document.querySelector('.total-price');
    const checkoutForm = document.getElementById('checkout-form');
    const API_BASE_URL = '/api';

    const getCart = () => JSON.parse(localStorage.getItem('monoshop_cart')) || [];

    const updateCartCounter = () => {
        const cartCounter = document.querySelector('.cart-count');
        if (!cartCounter) return;
        const cart = getCart();
        cartCounter.textContent = cart.length;
        cartCounter.style.display = cart.length > 0 ? 'flex' : 'none';
    };

    const saveCart = (cart) => {
        localStorage.setItem('monoshop_cart', JSON.stringify(cart));
        updateCartCounter();
        renderCart();
    };

    const renderCart = () => {
        const cart = getCart();
        if (cart.length === 0) {
            if (cartEmptyMessage) cartEmptyMessage.style.display = 'block';
            if (cartContainer) cartContainer.style.display = 'none';
            return;
        }

        if (cartEmptyMessage) cartEmptyMessage.style.display = 'none';
        if (cartContainer) cartContainer.style.display = 'grid';
        if (!cartItemsList) return;

        cartItemsList.innerHTML = '';
        let totalPrice = 0;
        cart.forEach(item => {
            const itemPrice = parseFloat(item.price.replace(/[^\d,.]/g, '').replace(',', '.'));
            totalPrice += itemPrice;
            const cartItemHTML = `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-info"><h3>${item.name}</h3><p>${item.price}</p></div>
                    <button class="remove-btn" aria-label="Видалити товар">×</button>
                </div>`;
            cartItemsList.insertAdjacentHTML('beforeend', cartItemHTML);
        });
        const formattedTotalPrice = totalPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2 });
        summaryPriceElem.textContent = `${formattedTotalPrice} грн.`;
        totalPriceElem.textContent = `${formattedTotalPrice} грн.`;
    };

    if (cartItemsList) {
        cartItemsList.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-btn')) {
                const itemId = event.target.closest('.cart-item').dataset.id;
                let cart = getCart();
                cart = cart.filter(item => item.id !== itemId);
                saveCart(cart);
            }
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cart = getCart();
            if (cart.length === 0) { return alert('Ваш кошик порожній!'); }
            const totalPrice = cart.reduce((sum, item) => sum + parseFloat(item.price.replace(/[^\d,.]/g, '').replace(',', '.')), 0);
            const orderData = {
                customer_name: document.getElementById('customer-name').value,
                customer_email: document.getElementById('customer-email').value,
                products: cart,
                total_price: totalPrice
            };
            try {
                const response = await fetch(`${API_BASE_URL}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
                if (!response.ok) throw new Error('Помилка при оформленні замовлення');
                alert('Дякуємо за ваше замовлення! Ми скоро з вами зв\'яжемося.');
                saveCart([]);
                window.location.href = '/';
            } catch (error) {
                console.error(error);
                alert('Не вдалося оформити замовлення.');
            }
        });
    }

    renderCart();
});