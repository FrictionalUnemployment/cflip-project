const Coin = require('./Coin');
const express = require('express');
const mariadb = require('mariadb');
const crypto = require('crypto');
var bodyParser = require('body-parser');

// Connectar mot våran databas
let db;
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

// Skapar Coin object
var coin = new Coin();
intervalID = setInterval(updateCoin, 100);

function updateCoin() {
    let flipped = coin.updateCoin();
    if (flipped) {
        coin.logChanges(flipped, db);
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
                        console.log('logged in');
                    } else {
                        res.send({express: 'false'});
                        console.log('not loggin in');
                    }
                })
                .catch(err => {
                    console.log('error logging in: ' + err);
                })
})

app.get('/place_bet', (req, res) => {
    const bet = String(req.body.bet);
    const user = String(req.body.username);
    const amount = req.body.amount;

    if (bet === 'heads') {
        coin.betHeads(user, amount)
    }
})

