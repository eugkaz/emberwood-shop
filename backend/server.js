// 1. ІМПОРТ ЗАЛЕЖНОСТЕЙ
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// 2. НАЛАШТУВАННЯ ПІДКЛЮЧЕННЯ ДО БАЗИ ДАНИХ
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// 3. ІНІЦІАЛІЗАЦІЯ EXPRESS-ЗАСТОСУНКУ
const app = express();
const PORT = process.env.PORT || 3000;

// 4. MIDDLEWARE (ПРОМІЖНЕ ПЗ)
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware для перевірки JWT токена (автентифікація)
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Немає токена, авторизація відхилена' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret');
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ message: 'Токен недійсний' });
    }
};

// Middleware для перевірки прав адміністратора (авторизація)
const adminAuth = (req, res, next) => {
    if (req.user && req.user.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Доступ заборонено. Потрібні права адміністратора.' });
    }
};

// 5. МАРШРУТИ ДЛЯ ВІДДАЧІ HTML-СТОРІНОК
const pages = ['/', '/catalog', '/about', '/contact', '/profile', '/cart', '/login', '/register', '/admin'];
pages.forEach(pageUrl => {
    const fileName = (pageUrl === '/') ? 'index' : pageUrl.substring(1);
    app.get(pageUrl, (req, res) => {
        res.sendFile(path.join(__dirname, `../frontend/templates/${fileName}.html`));
    });
});
app.get('/product/:id', (req, res) => res.sendFile(path.join(__dirname, '../frontend/templates/product-detail.html')));

// 6. МАРШРУТИ API
// --- Маршрути Аутентифікації ---
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const newUserResult = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
            [name, email, password_hash]
        );
        res.status(201).json(newUserResult.rows[0]);
    } catch (err) {
        console.error("Помилка реєстрації:", err);
        res.status(500).json({ message: 'Помилка сервера або такий email вже існує' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) { return res.status(401).json({ message: 'Невірний email або пароль' }); }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) { return res.status(401).json({ message: 'Невірний email або пароль' }); }
        const payload = { user: { id: user.id, role: user.role } };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_default_secret', { expiresIn: '7d' });
        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error("Помилка входу:", err);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// --- Маршрути для Користувачів (захищені) ---
app.get('/api/users/me', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.user.id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: 'Помилка сервера' }); }
});

// --- Маршрути для Товарів ---
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ message: 'Помилка сервера при отриманні товарів' }); }
});
app.get('/api/products/popular', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE is_popular = true ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ message: 'Помилка сервера при отриманні популярних товарів' }); }
});
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Товар не знайдено' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: 'Помилка сервера' }); }
});
app.post('/api/products', auth, adminAuth, async (req, res) => {
    const { name, price, image_url, is_popular } = req.body;
    try {
        const result = await pool.query('INSERT INTO products (name, price, image_url, is_popular) VALUES ($1, $2, $3, $4) RETURNING *', [name, price, image_url, is_popular]);
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: 'Помилка сервера при створенні товару' }); }
});
app.put('/api/products/:id', auth, adminAuth, async (req, res) => {
    const { id } = req.params;
    const { name, price, image_url, is_popular } = req.body;
    try {
        const result = await pool.query('UPDATE products SET name = $1, price = $2, image_url = $3, is_popular = $4 WHERE id = $5 RETURNING *', [name, price, image_url, is_popular, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: 'Помилка сервера при оновленні товару' }); }
});
app.delete('/api/products/:id', auth, adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ message: 'Товар успішно видалено' });
    } catch (err) { res.status(500).json({ message: 'Помилка сервера при видаленні товару' }); }
});

// --- Маршрути для Замовлень ---
app.get('/api/orders', auth, adminAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ message: 'Помилка сервера при отриманні замовлень' }); }
});
app.post('/api/orders', async (req, res) => {
    const { customer_name, customer_email, products, total_price } = req.body;
    try {
        const result = await pool.query('INSERT INTO orders (customer_name, customer_email, products, total_price) VALUES ($1, $2, $3, $4) RETURNING *', [customer_name, customer_email, JSON.stringify(products), total_price]);
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: 'Помилка сервера при створенні замовлення' }); }
});
app.get('/api/orders/my', auth, async (req, res) => {
    try {
        const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.user.id]);
        if (userResult.rows.length === 0) return res.status(404).json({ message: 'Користувача не знайдено' });
        const userEmail = userResult.rows[0].email;
        const ordersResult = await pool.query('SELECT * FROM orders WHERE customer_email = $1 ORDER BY created_at DESC', [userEmail]);
        res.json(ordersResult.rows);
    } catch (err) { res.status(500).json({ message: 'Помилка сервера' }); }
});

// 7. ЗАПУСК СЕРВЕРА
app.listen(PORT, () => {
    console.log(`✅ Сервер запущено! Сайт доступний за адресою http://localhost:${PORT}`);
});