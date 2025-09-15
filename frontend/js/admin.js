document.addEventListener('DOMContentLoaded', () => {
    // 1. Перевірка авторизації
    if (sessionStorage.getItem('isAdminLoggedIn') !== 'true') {
        window.location.href = '/login';
        return;
    }

    const API_BASE_URL = '/api';

    // Елементи DOM
    const productsTableBody = document.getElementById('products-table-body');
    const ordersTableBody = document.getElementById('orders-table-body');
    const productForm = document.getElementById('product-form');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // --- ФУНКЦІЇ ЗАВАНТАЖЕННЯ ДАНИХ ---
    const fetchProducts = async () => {
        const response = await fetch(`${API_BASE_URL}/products`);
        return await response.json();
    };
    const fetchOrders = async () => {
        const response = await fetch(`${API_BASE_URL}/orders`);
        return await response.json();
    };

    // --- ФУНКЦІЇ ВІДОБРАЖЕННЯ ---
    const renderProducts = (products) => {
        productsTableBody.innerHTML = '';
        products.forEach(p => {
            const priceFormatted = parseFloat(p.price).toLocaleString('uk-UA');
            const row = `
                <tr data-product-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image_url}" data-popular="${p.is_popular}">
                    <td>${p.id}</td>
                    <td>${p.name}</td>
                    <td>${priceFormatted} грн.</td>
                    <td>${p.is_popular ? 'Так' : 'Ні'}</td>
                    <td class="action-buttons">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </td>
                </tr>`;
            productsTableBody.insertAdjacentHTML('beforeend', row);
        });
    };
    const renderOrders = (orders) => {
        ordersTableBody.innerHTML = '';
        orders.forEach(o => {
            const totalPriceFormatted = parseFloat(o.total_price).toLocaleString('uk-UA');
            const row = `
                <tr>
                    <td>${o.id}</td>
                    <td>${o.customer_name}</td>
                    <td>${o.customer_email}</td>
                    <td>${totalPriceFormatted} грн.</td>
                    <td>${o.status}</td>
                </tr>`;
            ordersTableBody.insertAdjacentHTML('beforeend', row);
        });
    };

    // --- ЛОГІКА ФОРМИ ---
    const clearForm = () => {
        productForm.reset();
        document.getElementById('product-id').value = '';
    };

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const productData = {
            name: document.getElementById('product-name').value,
            price: document.getElementById('product-price').value,
            image_url: document.getElementById('product-image').value,
            is_popular: document.getElementById('product-popular').checked,
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_BASE_URL}/products/${id}` : `${API_BASE_URL}/products`;

        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData) });
            if (!response.ok) throw new Error('Помилка збереження');
            clearForm();
            renderProducts(await fetchProducts());
        } catch (error) {
            console.error(error);
            alert('Не вдалося зберегти товар');
        }
    });

    clearFormBtn.addEventListener('click', clearForm);

    // --- ЛОГІКА КНОПОК РЕДАГУВАННЯ/ВИДАЛЕННЯ ---
    productsTableBody.addEventListener('click', async (e) => {
        const row = e.target.closest('tr');
        if (!row) return;
        const productId = row.dataset.productId;

        if (e.target.classList.contains('edit-btn')) {
            document.getElementById('product-id').value = productId;
            document.getElementById('product-name').value = row.dataset.name;
            document.getElementById('product-price').value = row.dataset.price;
            document.getElementById('product-image').value = row.dataset.image;
            document.getElementById('product-popular').checked = row.dataset.popular === 'true';
            window.scrollTo(0, 0);
        }

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Ви впевнені, що хочете видалити цей товар?')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/products/${productId}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Помилка видалення');
                    row.remove();
                } catch (error) {
                    console.error(error);
                    alert('Не вдалося видалити товар');
                }
            }
        }
    });

    // --- ВИХІД ---
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('isAdminLoggedIn');
        window.location.href = '/login';
    });

    // --- ІНІЦІАЛІЗАЦІЯ ---
    const init = async () => {
        try {
            const [products, orders] = await Promise.all([fetchProducts(), fetchOrders()]);
            renderProducts(products);
            renderOrders(orders);
        } catch (error) {
            console.error("Не вдалося завантажити дані для адмін-панелі:", error);
        }
    };

    init();
});