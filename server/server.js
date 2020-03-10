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
        console.log(`Connected to database. Connection id is ${conn.threadId}\n`);
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

// Startar webservern och lyssnar
const app = express();
app.use(bodyParser.urlencoded({ extended: false}))
app.use(bodyParser.json())
const port = 5000;
app.listen(port, () => console.log('Express is listening on port ' + port));




// ==========================================================
// Här finns alla API som går att nå från frontend

// Lägg till användare
app.post('/register_user', (req, res) => {
    const user = String(req.body.username);

    const hash = crypto.createHash('sha256')
                    .update(req.body.password)
                    .digest('hex');
    
    console.log(`\nRegistering user: ${user}\nHash: ${hash}`);
    db.query('INSERT INTO user (Username, Password, Balance) ' + 
             `VALUES ("${user}", "${hash}", 50);`)
                .then(ans => {
                    res.send(user);
                    console.log(`Registered ${user}`);
                })
                .catch(err => {
                    res.send(null);
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

    console.log(`\nLogging in ${user}`);
    db.query(`SELECT Password FROM user WHERE Username="${user}";`)
                .then(ans => {
                    let stored_hash = ans[0].Password;
                    if (stored_hash === hash) {
                        res.send(user);
                        console.log('logged in ' + user);
                    } else {
                        res.send(JSON.stringify(null));
                        console.log('incorrect password: ' + user);
                    }
                })
                .catch(err => {
                    res.send(JSON.stringify(null))
                    console.log('error logging in: ' + err);
                })
})

// Satsa på heads eller tails
app.post('/place_bet', (req, res) => {
    const bet = String(req.body.bet); // 'heads' eller 'tails'
    const user = String(req.body.username);
    let amount = req.body.amount;
    
    console.log(`\nPlacing bet for ${user}, for ${amount}, on ${bet}`);
    if (!coin.hasExistingBet(user)) {
        db.query(`SELECT Balance FROM user WHERE Username="${user}"`)
            .then(ans => {
                if (amount > ans[0].Balance) amount = ans[0].Balance;

                if (bet === 'heads') {
                    coin.betOnHeads(user, amount);
                } else if (bet === 'tails') {
                    coin.betOnTails(user, amount);
                }
                res.send(`Bet placed by ${user} on ${bet} for ${amount}.`);
                console.log(`Bet placed by ${user} on ${bet} for ${amount}.`);
            })
            .catch(err => {
                console.log('Erro getting user balance: ' + err);
                res.send('Error getting user balance, unable to place bet.');
            });
    } else {
        res.send(`${user} has already bet on this flip.`);
        console.log(`${user} has existing bet on this flip. Cancelling bet.`);
    }
})

// top eller bottom lista
app.get('/stats/toplist/:top/:limit', (req, res) => {
    console.log(`Getting ${req.params.top} ${req.params.limit}`);

    let order = (req.params.top === 'bottom') ? 'ASC' : 'DESC';
    db.query(`SELECT
                Username,
                Balance,
                (SELECT COUNT(*) FROM winner WHERE winner.UID=user.UID) as Wins,
                (SELECT COUNT(*) FROM loser WHERE loser.UID=user.UID) as Losses
             FROM user
             ORDER BY Balance ${order} 
             LIMIT ${req.params.limit}`)
         .then(ans => {
             res.send(JSON.stringify(ans));
         })
         .catch(err => {
             console.log("Error getting top list");
             res.send('Error getting top list');
         });

})

// Hämtar statistik om en användare
app.get('/stats/user/:user', (req, res) => {
    console.log(`Getting user stats for ${req.params.user}`);
    db.query(`SELECT
                user.Username,
                user.Balance,
                (SELECT GROUP_CONCAT(DISTINCT FID) FROM winner WHERE winner.UID=user.UID) as Wins,
                (SELECT GROUP_CONCAT(DISTINCT FID) FROM loser WHERE loser.UID=user.UID) as Losses
             FROM user
             WHERE Username='${req.params.user}'`)
        .then(ans => {
            ans[0].Wins = JSON.parse('[' + ans[0].Wins + ']');
            ans[0].Losses = JSON.parse('[' + ans[0].Losses + ']');
            res.send(JSON.stringify(ans[0]));
        })
        .catch(err => {
            console.log('Error getting user stats ' + err);
            res.send('Error getting user stats');
        })
})

// Hämtar statistic om en flip
app.get('/stats/flip/:FID', (req, res) => {
    let FID = req.params.FID;

    // Om du lyckas få ihop alla 3 queries här i en är du en gud
    // Jag försökte i en hel dag innan jag gav upp
    
    // Query för att hämta alla vinnare och hur mycket dom har satsat
    db.query(`SELECT DISTINCT
    CONCAT('{', '"', user.Username, '"', ':', winner.Winnings, '}')
    FROM user
        JOIN winner
        ON user.UID=winner.UID
    WHERE FID=${FID}`)
        .then(ans => {
            let winners = [];
            for (let i = 0; i < ans.length; i++) {
                for (let prop in ans[i]) {
                    winners.push(JSON.parse(ans[i][prop]));
                }
            }
            // Query för att hämta alla förlorare och hur mycket dom har satsat
            db.query(`SELECT DISTINCT
            CONCAT('{', '"', user.Username, '"', ':', loser.losses, '}')
            FROM user
                JOIN loser
                ON user.UID=loser.UID
            WHERE FID=${FID}`)
                .then(ans => {
                    let losers = [];
                    for (let i = 0; i < ans.length; i++) {
                        for (let prop in ans[i]) {
                            losers.push(JSON.parse(ans[i][prop]));
                        }
                    }
                    // Query för att hämta resultat och tid för flippen
                    db.query(`SELECT Result, Date_time FROM flip WHERE FID=${FID}`)
                        .then(ans => {
                            let flip = {results: null, time: null, winners: winners, losers: losers};
                            flip.results = ans[0].Result;
                            flip.time = ans[0].Date_time;
                            res.send(JSON.stringify(flip));
                        })
                        .catch(err => {
                            console.log('Error getting flip: ' + err);
                            res.send(null);
                        })

                })
                .catch(err => {
                    console.log('Error getting flip losers: ' + err);
                    res.send(null);
                })
        })
        .catch(err => {
            console.log('Error getting flip winners: ' + err);
            res.send(null);
        })

})