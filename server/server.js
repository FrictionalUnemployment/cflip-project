const Coin = require('./Coin');
const express = require('express');
const mariadb = require('mariadb');
const session = require('express-session');
const handleReq = require('./requests/requestHelper');
const stats = require('./requests/stats');
const user = require('./requests/user');
const captcha = require('./requests/captcha');
const bet = require('./requests/coin');

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
    host: '193.10.236.94',
    connectionLimit: 50
};
if (process.env.local) {
    console.log("Attempting to connecect to local database.")
    databaseInfo.socketPath = '/var/lib/mysql/mysql.sock';
} else {
    console.log("Attempting to connect to remote database.")
}
const db = mariadb.createPool(databaseInfo);
db.getConnection()
    .then(conn => {
        console.log("Connected to database!");
        conn.release();
    })
    .catch(err => {
        console.log("Not connected to database: " + err);
    })
module.exports = db;


// Startar webservern och lyssnar
const app = express();
app.use(session({ secret: 'coinflipper', cookie: {} }));

handleReq.init(db);
stats.init(db);
user.init(db);
bet.init(db, coin);

app.use('/stats', stats);
app.use('/user', user);
app.use('/captcha', captcha);
app.use('/coin', bet);

const port = 5000;
app.listen(port, () => console.log('Express is listening on port ' + port));