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
        let totalPot = this.potsizeHeads + this.potsizeTails;
        let winners = (result === 'heads') ? this.betHeads : this.betTails;
        let losers = (result === 'heads') ? this.betTails : this.betHeads;
        let loserpot = (result === 'tails') ? this.potsizeHeads : this.potsizeTails;
        let datetime = + new Date();

        console.log(result);
        console.log("logging changes: " + datetime);

        db.query(`INSERT INTO flip (Result, Date_time, Pot_size) VALUES ("${result}", ${datetime}, ${totalPot});`);
        let FID = db.query(`SELECT FID from flip WHERE Date_time=${datetime};`);

        for (let i = 0; i < losers.length; i++) {
            let currentUser = loser[i];
            let UID = db.query(`SELECT UID from user WHERE Username="${currentUser};`);
            db.query(`INSERT INTO loser (Losses, UID, FID) VALUES (${this.allBets.currentUser}, ${UID}, ${FID});`);
            db.query(`UPDATE user SET Balance=Balance-${this.allBets.currentUser} WHERE UID=${UID};`);
        }

        for (let i = 0; i < winners.length; i++) {
            let currentUser = winner[i];
            let UID = db.query(`SELECT UID from user WHERE Username="${currentUser};`);
            let winnings = (this.allBets.currentUser / (this.potsizeHeads + this.potsizeTails)) * loserpot;
            db.query(`INSERT INTO winner (Winnings, UID, FID) VALUES (${winnings}, ${UID}, ${FID});`);
            db.query(`UPDATE user SET Balance=Balance+${winnings} WHERE UID=${UID};`);
        }

        this.reset();

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
            ret[i] = winners[i];
        }
        let ret = [flip_result, copy];
        //this.betHeads = [];
        //this.betTails = [];
        return ret;
    }

    betOnHeads(user, amount) {
        this.betHeads.push(user);
        this.allBets.user = amount;
        this.potsizeHeads += amount;
    }

    betOnTails(user, amount) {
        this.betHeads.push(user);
        this.allBets.user = amount;
        this.potsizeTails += amount;
    }

    randomChoice(choices) {
        let i = Math.floor(Math.random() * choices.length);
        return choices[i];
    }

}

module.exports = Coin;