const Coin = require('./Coin');
const express = require('express');
const mariadb = require('mariadb');
const crypto = require('crypto');
const bodyParser = require('body-parser');

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
        console.log(`Connected to database. Connection id is ${conn.threadId}`);
        db = conn;
    })
    .catch(err => {
        console.log(`Error connecting to database: ${err}`);
    });



// Skapar Coin object
const coin = new Coin();
intervalID = setInterval(updateCoin, 100);

let flipsSinceStart = 0;
function updateCoin() {
    let flipped = coin.updateCoin();
    if (flipped) {
	    flipsSinceStart++;
        console.log("\n\nCoin has flipped!\nFlips since server start: " + flipsSinceStart + "\nResult: " + flipped);
        if (coin.potsizeTails + coin.potsizeHeads > 0) {
            coin.logChanges(flipped, db);
        } else {
            console.log("No bets placed on this flip.")
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
    const user = String(req.body.username);

    const hash = crypto.createHash('sha256')
                    .update(req.body.password)
                    .digest('hex');
    
    console.log(`Registering user: ${user}\nHash: ${hash}`);
    db.query(`INSERT INTO user (Username, Password, Balance) VALUES ("${user}", "${hash}", 50);`)
                .then(ans => {
                    res.send({express: user});
                    console.log(`Registered ${user}`);
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

    console.log(`Logging in ${user}`);
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
    
    console.log(`Placing bet for ${user}, for ${amount}, on ${bet}`);
    if (!coin.hasExistingBet(user)) {
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
    } else {
        res.send({express: `${user} has already bet on this flip.`});
        console.log(`${user} has existing bet on this flip. Cancelling bet.`)
    }
})

