document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const API_BASE_URL = '/api';

    // Если пользователь уже авторизован, сразу перенаправляем его
    if (localStorage.getItem('token')) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role === 'admin') {
            window.location.href = '/admin';
        } else {
            window.location.href = '/profile';
        }
    }

    loginForm.addEventListener('submit', async (event) => {
        // ==> ОСНОВНЕ ВИРІШЕННЯ ПРОБЛЕМИ <==
        // Цей рядок зупиняє стандартну поведінку браузера (перезавантаження сторінки)
        event.preventDefault();

        errorMessage.textContent = '';
        submitButton.disabled = true; // Блокуємо кнопку, щоб уникнути повторних кліків
        submitButton.textContent = 'Вхід...';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Помилка входу');
            }

            // Зберігаємо токен та дані користувача
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Перенаправляємо в залежності від ролі
            if (data.user.role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/profile';
            }
        } catch (error) {
            errorMessage.textContent = error.message;
            submitButton.disabled = false; // Розблоковуємо кнопку у випадку помилки
            submitButton.textContent = 'Увійти';
        }
    });
});