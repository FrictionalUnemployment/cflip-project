import React from 'react'
import logo from '../logo512.png';

class BetChoice extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            amount: 0
        }
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.props.onClick(this.props.suit, this.state.amount);
    }

    render() {
        return (
            <button className="s" onClick={this.handleClick}>Bet {this.props.suit}!</button>
        )
    }
}

class Game extends React.Component {

    placeBet = async (suit, amount) => {
        // Här sätts vad, vem och hur mycket
        const data = {bet: suit, username: "test_user", amount: amount};

        const response = await fetch('/place_bet', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {'Accept':'application/json', 'Content-Type': 'application/json'}
        });

        const body = await response.json();
        if (response.status !== 200) {
            throw Error(body.message);
        }
        return body.express;
    }

    handleClick(suit, amount) {
        let res = this.placeBet(suit, amount);
        console.log(res);

    }

    render() {
        return (
            <div className="App-game">
                <div>
                    <BetChoice suit="Heads" onClick={this.handleClick} />
                    <img src={logo} className="App-logo" alt="logo" />
                    <BetChoice suit="Tails" onClick={this.handleClick} />
                </div>
            </div>
        );
    }
}

export default Game;