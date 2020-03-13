const mariadb = require('mariadb');
const handleReq = require('./routers/request-helper');
const Coin = require('./Coin');

let databaseInfo = {
    user: 'coinflip',
    password: 'amirphilip9896',
    database: 'coinflip',
    host: '193.10.236.94',
    connectionLimit: 50
};
if (process.env.local) {
    console.log("Attempting to connect to local database.");
    databaseInfo.socketPath = '/var/lib/mysql/mysql.sock';
} else {
    console.log("Attempting to connect to remote database");
}
const db = mariadb.createPool(databaseInfo);
db.getConnection()
    .then(conn => {
        console.log("Connected to database!");
        conn.release();
    })
    .catch(err => {
        console.log("Not connected to database: " + err);
    });

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

handleReq.init(db);

// Lägger till databasen och coinen till request
let middleware = function (req, res, next) {
    req.db = db;
    req.coin = coin;
    next();
} 
module.exports = middleware;