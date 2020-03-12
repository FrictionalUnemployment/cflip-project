const WebSocket = require('ws')

const FLIPTIME = 30 * 1000;

class Coin {
    constructor() {
        this.timeLeft = FLIPTIME;
        this.betHeads = [];
        this.betTails = [];
        this.allBets = {}; 
        this.potsizeHeads = 0;
        this.potsizeTails = 0;
        this.animationChar = '|';
        
        // Web socket server, denna ska klienten koppla upp sig till
        this.wss = new WebSocket.Server({port: 5001});
        this.wss.on('connection', function connection(ws) {
            console.log('\nclient connected to coin');
        });

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
            res = coinStatus.winner[0];
        }
        this.wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(coinStatus));
            }
        })
        return res;
    }
     
    updateTimer() {
        let seconds = Math.floor(this.timeLeft/1000).toString();
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
        // Denna funktionen blev skitful men den funkar   ...typ
        let totalPot = this.potsizeHeads + this.potsizeTails;
        let winners = (result === 'heads') ? this.betHeads : this.betTails;
        let losers = (result === 'heads') ? this.betTails : this.betHeads;
        let loserpot = (result === 'tails') ? this.potsizeHeads : this.potsizeTails;
        let datetime = + new Date();

        console.log(`Time: ${datetime}`)

        db.query('INSERT INTO flip (Result, Date_time, Pot_size) ' + 
                 `VALUES ("${result}", ${datetime}, ${totalPot});`);

        db.query(`SELECT FID from flip WHERE Date_time=${datetime};`)
            .then(ans => {
                let FID = ans[0].FID;
                console.log(`Flip ID: ${FID}`);
                console.log(`Pot size: ${totalPot}`);
                process.stdout.write('Winners: ');
                console.dir(winners)
                process.stdout.write('\nLosers: ');
                console.dir(losers);
                console.log();

                this.logUsers(losers, db, false, winners.length, loserpot, FID);
                this.logUsers(winners, db, true, losers.length, loserpot, FID);

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

    logUsers(userlist, db, winner, opponents, loserpot, FID) {
        for (let i = 0; i < userlist.length; i++) {
            let currentUser = userlist[i];
            db.query(`SELECT UID from user WHERE Username="${currentUser}";`)
                .then(ans => {
                    let amountBet = this.allBets[currentUser];
                    let balanceChange;
                    let losses;
                    if (!winner) {
                        if (opponents < 1) {
                            balanceChange = 0;
                            losses = 0
                        } else {
                            balanceChange = amountBet * -1;
                            losses = amountBet;
                        }
                    } else {
                        let totalpot = this.potsizeHeads + this.potsizeTails;
                        balanceChange = Math.floor((amountBet / (totalpot-loserpot)) * loserpot);
                        losses = balanceChange;
                    }

                    let UID = ans[0].UID;
                    let winner_loser = winner ? 'winner' : 'loser';
                    let Winnings_Losses = winner ? 'Winnings' : 'Losses';

                    db.query(`INSERT INTO ${winner_loser} (${Winnings_Losses}, UID, FID) VALUES (${losses}, ${UID}, ${FID});`);
                    db.query(`UPDATE user SET Balance=Balance+${balanceChange} WHERE UID=${UID};`);
                })
                .catch(err => {
                    console.log('Error getting user id ' + err);
                });
        }
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
        let ret = [flip_result, winners];
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

    hasExistingBet(user) {
        if (this.allBets[user]) return true;
        return false;
    }
    randomChoice(choices) {
        let i = Math.floor(Math.random() * choices.length);
        return choices[i];
    }

}

module.exports = Coin;