class Coin {
    constructor() {
        this.timeLeft = 60 * 1000;
        this.results = ['heads', 'tails'];
        this.betHeads = [];
        this.betTails = [];
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
        let flip_result = this.randomChoice(this.results);
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