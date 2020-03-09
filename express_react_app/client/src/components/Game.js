import React from 'react'
import logo from '../logo512.png';

class BetChoice extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            amount: 10
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
        console.log(body);
        return body.express;
    }

    render() {
        return (
            <div className="App-game">
                <div>
                    <BetChoice suit="Heads" onClick={this.placeBet} />
                    <img src={logo} className="App-logo" alt="logo" />
                    <BetChoice suit="Tails" onClick={this.placeBet} />
                </div>
            </div>
        );
    }
}

export default Game;