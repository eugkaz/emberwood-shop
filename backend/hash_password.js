const bcrypt = require('bcryptjs');
const password = 'banan'; // Придумайте свой надежный пароль
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);
console.log(hash);