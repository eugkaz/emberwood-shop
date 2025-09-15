document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api';
    const productDetailContainer = document.getElementById('product-detail-container');
    const pathParts = window.location.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];

    const renderProduct = (product) => {
        const priceFormatted = parseFloat(product.price).toLocaleString('uk-UA', { minimumFractionDigits: 2 });
        document.title = `${product.name} - Monoshop`;

        const productHTML = `
            <div class="product-detail-layout">
                <div class="product-detail-image">
                    <img src="${product.image_url}" alt="${product.name}">
                </div>
                <div class="product-detail-info">
                    <h1>${product.name}</h1>
                    <p class="product-detail-price">${priceFormatted} грн.</p>
                    <p class="product-detail-description">
                        Це чудовий товар, виготовлений з найкращих матеріалів. Він ідеально підійде для будь-якого випадку та стане незамінною частиною вашого гардеробу. Ми гарантуємо високу якість та довговічність.
                    </p>
                    <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">У кошик</button>
                </div>
            </div>
        `;
        productDetailContainer.innerHTML = productHTML;
    };

    const fetchProduct = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Товар не знайдено');
            }
            const product = await response.json();
            renderProduct(product);
        } catch (error) {
            console.error(error);
            productDetailContainer.innerHTML = `<p style="text-align: center; color: red; font-size: 1.2rem;">${error.message}</p>`;
        }
    };

    if (productId) {
        fetchProduct();
    }
});