const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const aws = require('aws-sdk');
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

require('dotenv').config();

aws.config.update({
    region: process.env.REGION,
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY
});

let noError = false;    // 맞는 ID나 password가 없음
let dupError = false;   // 가입시 같은 ID 존재
let join = false;       // 가입완료 상태

let s3 = new aws.S3();

// router.use((req, res, next) => {
//     let original = res.render;
//
//     res.render = (view, options, callback) => {
//         options = { message: req.session.message, ...options };
//         original.call(res, view, options, callback);
//     };
//
//     next();
// });

router.get('/', (req, res) => {
    res.render('login', { join: join, noError: noError });
    join = false;
    noError = false;
});

router.get('/join', (req, res) => {
    res.render('login_join', { error: dupError });
    dupError = false;
});

router.post('/do', passport.authenticate('local', { failureRedirect: '/login' }),
    (req, res, next) => {
        console.log('/do req: ', req.body);
        console.log('/do req user: ', req.user);
        console.log('/do session: ', req.session);
        res.redirect('/');
    }
);

router.post('/join/do', (req, res, next) => {
    let { ID, password } = req.body;

    let hash = crypto.createHash('sha512').update(String(password)).digest('hex');

    connection.query('INSERT INTO `user`(`ID`, `password`) VALUES (?, ?)', [ID, hash], (err, result) => {
        if (err) {
            console.error(err);
            // req.session.message = '이미 존재하는 ID입니다';
            dupError = true;
            res.redirect('/login/join');

            return err;
        }

        console.log('result: ', result);
        join = true;
        next();
    });

}, (req, res) => {
    let { ID } = req.body;
    s3.putObject({ Bucket: process.env.BUCKET_NAME, Key: ID + '/' }, (err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        console.log('data: ', data);
    });

    res.redirect('/login');
});

module.exports = router;