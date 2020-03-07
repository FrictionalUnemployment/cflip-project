const Coin = require('./Coin');
const express = require('express');
const mariadb = require('mariadb');
const crypto = require('crypto');
var bodyParser = require('body-parser');

// Connectar mot våran databas
let db;
if (process.env.local) {
    // TODO
    mariadb.createConnection({
        socketPath: '/var/lib/mysql/mysql.sock',
        user: 'coinflip',
        password: 'amirphilip9896',
        database: 'coinflip'
    })
    .then(conn => {
        console.log("Connected to local database. Connection id is " + conn.threadId);
        db = conn;
    })
    .catch(err => {
        console.log('error connecting to local database: ' + err);
    });
} else {
    mariadb.createConnection({
        user:'coinflip',
        password: 'amirphilip9896',
        host: '193.10.236.94',
        database: 'coinflip'
        })
        .then(conn => {
            console.log("Connected to database. Connection id is " + conn.threadId);
            db = conn;
        })
        .catch(err => {
            console.log('error connecting to database: ' + err);
    });
}

// Skapar Coin object
var coin = new Coin();
intervalID = setInterval(updateCoin, 100);

function updateCoin() {
    let flipped = coin.updateCoin();
    if (flipped) {
        console.log("\n\nCoin has flipped!\nResult: " + flipped);
        if (coin.potsizeTails + coin.potsizeHeads > 0) {
            coin.logChanges(flipped, db);
        }
    }
}


// Startar webservern och lyssnar
const app = express();
app.use(bodyParser.urlencoded({ extended: false}))
app.use(bodyParser.json())
const port = process.env.PORT || 5000; // Om port inte sätts när man startar så är den 5000
app.listen(port, () => console.log('Listening on port ' + port));




// ==========================================================
// Här finns alla API som går att nå från frontend

// Lägg till användare
app.post('/register_user', (req, res) => {
    const pwd = String(req.body.password);
    const user = String(req.body.username);

    const hash = crypto.createHash('sha256')
                    .update(pwd)
                    .digest('hex');
    db.query(`INSERT INTO user (Username, Password, Balance) VALUES ("${user}", "${hash}", 50);`)
                .then(ans => {
                    res.send({express: user});
                })
                .catch(err => {
                    res.send({express: null});
                    console.log('error registering user:' + err);
                })
})

// Logga in användare
app.post('/login', (req, res) => {
    const pwd = String(req.body.password);
    const user = String(req.body.username);

    const hash = crypto.createHash('sha256')
                    .update(pwd)
                    .digest('hex');
    db.query(`SELECT Password FROM user WHERE Username="${user}";`)
                .then(ans => {
                    let stored_hash = ans[0].Password;
                    if (stored_hash === hash) {
                        res.send({express: user});
                        console.log('logged in ' + user);
                    } else {
                        res.send({express: 'false'});
                        console.log('incorrect password: ' + user);
                    }
                })
                .catch(err => {
                    res.send({express: null})
                    console.log('error logging in: ' + err);
                })
})

app.post('/place_bet', (req, res) => {
    const bet = String(req.body.bet); // 'heads' eller 'tails'
    const user = String(req.body.username);
    const amount = req.body.amount;
    
    db.query(`SELECT Balance FROM user WHERE Username="${user}"`)
        .then(ans => {
            if (amount > ans[0].Balance) amount = ans[0].Balance;

            if (bet === 'heads') {
                coin.betOnHeads(user, amount);
            } else if (bet === 'tails') {
                coin.betOnTails(user, amount);
            }
            res.send({express: `Bet placed by ${user} on ${bet} for ${amount}.`});
            console.log(`Bet placed by ${user} on ${bet} for ${amount}.`);
        })
})

