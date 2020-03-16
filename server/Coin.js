const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');

const FLIPTIME = 30 * 1000;

class Coin {
    constructor() {
        this.timeLeft = FLIPTIME;
        this.bets = [];
        this.animationChar = '|';

        // Web socket server, denna ska klienten koppla upp sig till
        const privatekey = fs.readFileSync('ssl/privkey.pem');
        const cert = fs.readFileSync('ssl/fullchain.pem');
        const credentials = {key: privatekey, cert: cert};
        let httpsServer = https.createServer(credentials);
        this.wss = new WebSocket.Server({ httpsServer });
        this.wss.on('connection', function connection(ws) {
            console.log('\rclient connected to coin');
        });
        httpsServer.listen(5001);
    }

    hasExistingBet(user) {
        for (let i = 0; i < this.bets.length; i++) {
            if (this.bets[i].user === user) {
                return true;
            }
        }
        return false;
    }

    placeBet(user, amount, bet) {
        let thisbet = { user: user, amount: amount, bet: bet };
        this.bets.push(thisbet);
    }

    updateCoin() {
        let coinStatus = { timeleft: null, winner: null };
        coinStatus.timeleft = this.decreaseTime();
        let res = null;
        if (!coinStatus.timeleft) {
            coinStatus.winner = this.getWinner();
            res = coinStatus.winner[0];
        }
        this.wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(coinStatus));
            }
        })
        return res;
    }

    decreaseTime() {
        if (this.timeLeft > 100) {
            this.timeLeft = this.timeLeft - 100;
            return this.timeLeft;
        } else {
            this.timeLeft = FLIPTIME;
            return null;
        }
    }

    getWinner() {
        let flip_result = this.randomChoice(['heads', 'tails']);
        let winners = []
        for (let i = 0; i < this.bets.length; i++) {
            if (this.bets[i].bet === flip_result) {
                winners.push(this.bets[i].user);
            }
        }
        return [flip_result, winners];
    }

    randomChoice(choices) {
        let i = Math.floor(Math.random() * choices.length);
        return choices[i];
    }

    updateTimer() {
        let seconds = Math.floor(this.timeLeft / 1000).toString();
        while (seconds.length < 2) {
            seconds = '0' + seconds;
        }
        let coolAnimation = ['/', '-', '\\', '|'];
        let index = coolAnimation.indexOf(this.animationChar);
        if (index !== 3) index++;
        else index = 0;
        this.animationChar = coolAnimation[index];
        let string = this.animationChar + this.animationChar;
        process.stdout.write(`\r${string} ${seconds}s ${string}`);
    }

    logChanges(result, db) {
        let bets = this.bets.slice();
        let totalpot = 0;
        let winnerpot = 0;
        let winners = []
        let losers = []
        for (let i = 0; i < bets.length; i++) {
            totalpot += bets[i].amount;
            if (bets[i].bet === result) {
                winnerpot += bets[i].amount;
                winners.push(bets[i].user);
            } else {
                losers.push(bets[i].user);
            }
        }
        let loserpot = totalpot - winnerpot;
        let datetime = + new Date();
        db.query(`INSERT INTO flip (Result, Date_time, Pot_size)
             VALUES ('${result}', ${datetime}, ${totalpot});`)
            .then(ans => {
                const FID = ans.insertId;
                console.log(`Flip ID: ${FID}`);
                console.log(`Pot size: ${totalpot}`);
                process.stdout.write('Winners: ');
                console.dir(winners)
                process.stdout.write('\nLosers: ');
                console.dir(losers);

                for (let i = 0; i < bets.length; i++) {
                    let user = bets[i].user;
                    if (bets[i].bet === result) {
                        // Winners
                        let winnings = Math.floor((bets[i].amount / winnerpot) * loserpot);
                        db.query(`SELECT UID from user WHERE Username='${user}';`)
                            .then(ans => {
                                let UID = ans[0].UID;
                                this.logWinner(winnings, UID, FID, db);
                            })
                    } else {
                        // Losers
                        let losses = bets[i].amount;
                        if (winnerpot === 0) {
                            // Inga vinnare, förlorar inga pengar
                            losses = 0;
                        }
                        db.query(`SELECT UID from user WHERE Username='${user}';`)
                            .then(ans => {
                                let UID = ans[0].UID;
                                this.logLoser(losses, UID, FID, db);
                            })
                    }
                }
                this.bets = [];
            })
            .catch(err => {
                console.log('Error inserting flip' + err);
                this.bets = [];
            })
    }

    logWinner(winnings, UID, FID, db) {
        db.query(`INSERT INTO winner (Winnings, UID, FID)
                  VALUES (${winnings}, ${UID}, ${FID});`)
            .then(ans => {
                db.query(`UPDATE user
                          SET Balance=Balance+${winnings}
                          WHERE UID=${UID};`);
            });
    }

    logLoser(losses, UID, FID, db) {
        db.query(`INSERT INTO loser (Losses, UID, FID)
                  VALUES (${losses}, ${UID}, ${FID});`)
            .then(ans => {
                db.query(`UPDATE user
                          SET Balance=Balance-${losses}
                          WHERE UID=${UID};`);
            });
    }
}

module.exports = Coin;