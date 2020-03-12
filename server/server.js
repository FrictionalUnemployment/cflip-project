const Coin = require('./Coin');
const handleReq = require('./request-handler');
const express = require('express');
const mariadb = require('mariadb');
const bodyParser = require('body-parser');
const { check } = require('express-validator');
const session = require('express-session');

// Skapar Coin object
const coin = new Coin();
intervalID = setInterval(updateCoin, 100);

let flipsSinceStart = 0;
function updateCoin() {
    let flipped = coin.updateCoin();
    if (flipped) {
        process.stdout.write('\rCoin has flipped!\n')
        console.log(`Flips since server start: ${++flipsSinceStart}`);
        console.log(`Results: ${flipped}`);
        if (coin.potsizeTails + coin.potsizeHeads > 0) {
            coin.logChanges(flipped, db);
        } else {
            console.log("No bets placed on this flip.\n")
        }
    } else {
        coin.updateTimer();
    }
}


// Connectar mot våran databas
let databaseInfo = {
    user: 'coinflip',
    password: 'amirphilip9896',
    database: 'coinflip',
    host: '193.10.236.94'
};
if (process.env.local) {
    console.log("Attempting to connecect to local database.")
    databaseInfo.socketPath = '/var/lib/mysql/mysql.sock';
} else {
    console.log("Attempting to connect to remote database.")
}
let db;
mariadb.createConnection(databaseInfo)
    .then(conn => {
        console.log(`Connected to database. Connection id is ${conn.threadId}\n`);
        db = conn;
        handleReq.init(db, coin)
    })
    .catch(err => {
        console.log(`Error connecting to database: ${err}`);
    });


// Startar webservern och lyssnar
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: 'coinflipper', cookie: {} }));
const port = 5000;
app.listen(port, () => console.log('Express is listening on port ' + port));


// ==========================================================
// Här finns alla API som går att nå från frontend

// Skickar svg av captcha
app.get('/captcha', handleReq.captchaImage);

// Skicka captcha svar från användaren
app.post('/captcha', handleReq.captchaParse);

// Registrera användare
app.post('/register_user', [
    check('username').custom(handleReq.checkNewUser)
], handleReq.registerUser);

// Logga in användare
app.post('/login', [
    check('username').custom(handleReq.checkUser)
], handleReq.login);

// Hämta lista av alla användarnamn
app.get('/Userlist', handleReq.userList);

// Satsa på heads eller tails
app.post('/place_bet/:bet/:amount', [
    check('bet').isIn(['heads', 'tails']),
    check('amount').isInt()
], handleReq.placeBet);

// top eller bottom lista
app.get('/stats/toplist/:top/:limit', [
    check('top').isIn(['top', 'bottom']),
    check('limit').isInt()
], handleReq.userStatsList);

// Hämtar statistik om en användare
app.get('/stats/user/:user', [
    check('user').custom(handleReq.checkUser)
], handleReq.userStat);

// Hämtar statistic om en flip
app.get('/stats/flip/:FID', [
    check('FID').isInt()
], handleReq.flipStat);