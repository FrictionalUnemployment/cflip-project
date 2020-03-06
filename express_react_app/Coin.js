const WebSocket = require('ws')

class Coin {
    constructor() {
        this.timeLeft = 60 * 1000;
        this.betHeads = [];
        this.betTails = [];
        
        // Web socket server, denna ska klienten koppla upp sig till
        this.wss = new WebSocket.Server({port: 5001});
        this.wss.on('connection', function connection(ws) {
            console.log('client connected to coin');
        })

        // Uppdaterar sig själv
        this.intervalID = setInterval(this.updateCoin.bind(this), 100);
    }

    updateCoin() {
        let coinStatus = {timeleft: null, winner: null};
        coinStatus.timeleft = this.decreaseTime();
        if (!coinStatus.timeleft) {
            // Finns ingen tid kvar, kommer att sätta en vinnare
            coinStatus.winner = this.getWinner();
            console.log(coinStatus.winner[0]);
        }
        this.wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(coinStatus));
            }
        })

    }

    decreaseTime() {
        if (this.timeLeft > 100) {
            this.timeLeft = this.timeLeft - 100;
            return this.timeLeft;
        }else {
            this.timeLeft = 60 * 1000;
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
        this.betHeads = [];
        this.betTails = [];
        return ret;
    }

    betOnHeads(user) {
        this.betHeads.push(user);
    }

    betOnTails(user) {
        this.betHeads.push(user);
    }

    randomChoice(choices) {
        let i = Math.floor(Math.random() * choices.length);
        return choices[i];
    }

}

module.exports = Coin;