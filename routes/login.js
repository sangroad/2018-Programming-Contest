const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const passport = require('../config/passport');
const mysql = require('mysql');
const config = require('../config/dbConfig');
const connection = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
    database: config.database
});

let noError = false;    // 맞는 ID나 password가 없음
let dupError = false;   // 가입시 같은 ID 존재
let join = false;       // 가입완료 상태

router.get('/', (req, res) => {
    res.render('login', { join: join, noError: noError });
    join = false;
    noError = false;
});

router.get('/join', (req, res) => {
    res.render('login_join', { error: dupError });
    dupError = false;
});

router.post('/do',  passport.authenticate('local', { failureRedirect: '/login' }),
    (req, res, next) => {
        console.log('/do req: ', req.body);
        console.log('/do req user: ', req.user);
        console.log('/do session: ', req.session);
        res.redirect('/');
});

router.post('/join/do', (req, res) => {

    let { ID, password } = req.body;

    let hash = crypto.createHash('sha512').update(String(password)).digest('hex');
    console.log('ID: ', req.body.ID);
    console.log('hash: ', hash);

    connection.query('INSERT INTO `user`(`ID`, `password`) VALUES (?, ?)', [ID, hash], (err, result) => {
        if (err) {
            console.error(err);
            dupError = true;
            res.redirect('/login/join');

            return err;
        }

        console.log(result);
        join = true;
        res.redirect('/login');
    });

});

module.exports = router;