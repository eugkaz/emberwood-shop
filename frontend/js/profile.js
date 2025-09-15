document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const profileContainer = document.getElementById('profile-container');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    const renderProfile = (user, orders) => {
        let ordersHTML = '<p>У вас ще немає замовлень.</p>';
        if (orders.length > 0) {
            const orderRows = orders.map(order => {
                const orderDate = new Date(order.created_at).toLocaleDateString('uk-UA');
                const totalPrice = parseFloat(order.total_price).toLocaleString('uk-UA', { minimumFractionDigits: 2 });
                return `
                    <tr>
                        <td>#${order.id}</td>
                        <td>${orderDate}</td>
                        <td>${order.status}</td>
                        <td>${totalPrice} грн.</td>
                    </tr>`;
            }).join('');
            ordersHTML = `
                <div class="order-table-wrapper">
                    <table class="order-table">
                        <thead>
                            <tr><th>Номер</th><th>Дата</th><th>Статус</th><th>Сума</th></tr>
                        </thead>
                        <tbody>${orderRows}</tbody>
                    </table>
                </div>
            `;
        }

        const profileHTML = `
            <div class="profile-layout">
                <div class="profile-info text-content-block">
                    <h3>Вітаємо, ${user.name}!</h3>
                    <p><strong>Email:</strong> ${user.email}</p>
                </div>
                <div class="order-history text-content-block">
                    <h3>Історія ваших замовлень</h3>
                    ${ordersHTML}
                </div>
            </div>
        `;
        profileContainer.innerHTML = profileHTML;
    };

    const fetchUserData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [userRes, ordersRes] = await Promise.all([
                fetch('/api/users/me', { headers }),
                fetch('/api/orders/my', { headers })
            ]);

            if (!userRes.ok || !ordersRes.ok) throw new Error('Не вдалося завантажити дані. Будь ласка, увійдіть знову.');

            const user = await userRes.json();
            const orders = await ordersRes.json();

            renderProfile(user, orders);
        } catch (error) {
            console.error(error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            profileContainer.innerHTML = `<p>${error.message} <a href="/login">Спробувати увійти</a></p>`;
        }
    };

    fetchUserData();
});