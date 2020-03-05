class Coin {
    constructor() {
        this.timeLeft = 60 * 1000;
        this.results = ['heads', 'tails'];
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
        return this.randomChoice(this.results);
    }

    randomChoice(choices) {
        let i = Math.floor(Math.random() * choices.length);
        return choices[i];
    }
}

module.exports = Coin;