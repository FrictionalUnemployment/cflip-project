const WebSocket = require('ws')

const FLIPTIME = 60 * 1000;

class Coin {
    constructor() {
        this.timeLeft = FLIPTIME;
        this.betHeads = [];
        this.betTails = [];
        this.allBets = {}; 
        this.potsizeHeads = 0;
        this.potsizeTails = 0;
        
        // Web socket server, denna ska klienten koppla upp sig till
        this.wss = new WebSocket.Server({port: 5001});
        this.wss.on('connection', function connection(ws) {
            console.log('client connected to coin');
        })

    }

    reset() {
        this.betHeads = [];
        this.betTails = [];
        this.allBets = {};
        this.potsizeHeads = 0;
        this.potsizeTails = 0;
    }

    updateCoin() {
        let coinStatus = {timeleft: null, winner: null};
        coinStatus.timeleft = this.decreaseTime();
        let res = null;
        if (!coinStatus.timeleft) {
            // Finns ingen tid kvar, kommer att sätta en vinnare
            coinStatus.winner = this.getWinner();
            //this.logChanges(coinStatus.winner[0]);
            res = coinStatus.winner[0];
        }
        this.wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(coinStatus));
            }
        })
        return res;
    }

    logChanges(result, db) {
        // Denna funktionen blev skitful men den funkar   ...typ
        let totalPot = this.potsizeHeads + this.potsizeTails;
        let winners = (result === 'heads') ? this.betHeads : this.betTails;
        let losers = (result === 'heads') ? this.betTails : this.betHeads;
        let loserpot = (result === 'tails') ? this.potsizeHeads : this.potsizeTails;
        let datetime = + new Date();

        console.log("\n\nCoin has flipped!\nResult: " + result + "\nTime: " + datetime);

        db.query(`INSERT INTO flip (Result, Date_time, Pot_size) VALUES ("${result}", ${datetime}, ${totalPot});`);

        db.query(`SELECT FID from flip WHERE Date_time=${datetime};`)
            .then(ans => {
                let FID = ans[0].FID;
                console.log("Flip ID: " + FID);

                // Uppdaterar alla förlorare
                for (let i = 0; i < losers.length; i++) {
                    let currentUser = losers[i];
                    db.query(`SELECT UID from user WHERE Username="${currentUser}";`)
                        .then(ans => {
                            let losses;
                            if (winners.length < 1) {
                                // Inga vinnare, förlorar inga pengar
                                losses = 0;
                            } else {
                                losses = this.allBets[currentUser];
                            }

                            let UID = ans[0].UID;
                            db.query(`INSERT INTO loser (Losses, UID, FID) VALUES (${losses}, ${UID}, ${FID});`);
                            db.query(`UPDATE user SET Balance=Balance-${losses} WHERE UID=${UID};`);
                        })
                        .catch(err => {
                            console.log('Error getting user id ' + err);
                        });
                }

                // Uppdaterar alla vinnare
                for (let i = 0; i < winners.length; i++) {
                    let currentUser = winners[i];
                    db.query(`SELECT UID from user WHERE Username="${currentUser}";`)
                        .then(ans => {
                            let winnings = (this.allBets[currentUser] / (this.potsizeHeads + this.potsizeTails)) * loserpot;
                            let UID = ans[0].UID;
                            db.query(`INSERT INTO winner (Winnings, UID, FID) VALUES (${winnings}, ${UID}, ${FID});`);
                            db.query(`UPDATE user SET Balance=Balance+${winnings} WHERE UID=${UID};`);
                        })
                        .catch(err => {
                            console.log('Error getting user id ' + err);
                        });
                }
                //Kör reset efter 100ms. Pajade hela skiten annars och tog mig
                //evigheter att lösa problemet. Finns förmodligen bättre sätt att
                //göra detta
                setTimeout(function() {this.reset; }, 100);
            })
            .catch (err => {
                console.log('Error getting flip id ' + err);
                this.reset();
        });
    }

    decreaseTime() {
        if (this.timeLeft > 100) {
            this.timeLeft = this.timeLeft - 100;
            return this.timeLeft;
        }else {
            this.timeLeft = FLIPTIME;
            return null;
        }
    }

    getWinner() {
        let flip_result = this.randomChoice(['heads', 'tails']);
        let winners = (flip_result === 'heads') ? this.betHeads : this.betTails;
        let copy = new Array(winners.length);
        for (let i = 0; i < winners.length; i++) {
            copy[i] = winners[i];
        }
        let ret = [flip_result, copy];
        //this.betHeads = [];
        //this.betTails = [];
        return ret;
    }

    betOnHeads(user, amount) {
        this.betHeads.push(user);
        this.allBets[user] = amount
        this.potsizeHeads += amount;
    }

    betOnTails(user, amount) {
        this.betTails.push(user);
        this.allBets[user] = amount;
        this.potsizeTails += amount;
    }

    randomChoice(choices) {
        let i = Math.floor(Math.random() * choices.length);
        return choices[i];
    }

}

module.exports = Coin;