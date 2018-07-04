const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mysql = require('mysql');
const crypto = require('crypto');
const config = require('./dbConfig');
const connection = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
    database: config.database
});

const queryString = 'SELECT * FROM `user` WHERE `ID` = ? and `password` = ?';

// 사용자 정보를 session에 저장한다
passport.serializeUser((user, done) => {
    console.log('serializeUser user: ',user);
    done(null, user);
});

// 인증 후 페이지 접근시 마다 사용자 정보를 session에서 읽어온다
passport.deserializeUser((user, done) => {
    connection.query(queryString, [user.ID, user.password], (err, rows) => {
        if (err) {
            cosole.error(err);
            return done(err);
        }

        let result = rows[0];

        if (result === undefined) {
            console.error('there is no such user');
            return done('there is no such user');
        }

        console.log('deserializeUser result: ', result);
        console.log('deserializeUser user: ', user);
        done(null, user);
    });
});

passport.use(new LocalStrategy({
    usernameField: 'ID',
    passwordField: 'password',
    passReqToCallback: true
}, (req, id, password, done) => {

    let hash = crypto.createHash('sha512').update(String(password)).digest('hex');

    connection.query(queryString, [id, hash], (err, rows) => {
        let user = rows[0];
        console.log('passport.use user: ', user);

        if (err) {
            console.error(err);
            return done(err);
        }
        if (user === undefined) {
            return done(null, false, { message: 'Incorrect information'});
        }

        return done(null, user);
    })
}));

module.exports = passport;