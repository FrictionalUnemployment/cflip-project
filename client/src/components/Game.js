import React from 'react'
import logo from '../logo512.png';
const WebSocket = require('isomorphic-ws');

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
            <div className="betchoice">
                <button className="s" onClick={this.handleClick}>Bet {this.props.suit}!</button>
            </div>
        )
    }
}

class Game extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            coinStatus: 0
        }
        const ws = new WebSocket('ws://193.10.236.94:5001'); // Kopplad mot coinen
        // När medelanden kommer körs funktionen updateCoinStatus
        this.coinStatus = this.coinStatus.bind(this);
        ws.onmessage = this.coinStatus;
    }

    coinStatus(data) {
        
        // Här är data.data JSON strängen
        this.setState({coinStatus: JSON.parse(data.data).timeleft});
        //alert(data.data);
    }

    placeBet = async (suit, amount) => {
        // Här sätts vad, vem och hur mycket
        //const data = {bet: suit, username: name, amount: amount};

        const response = await fetch(`/coin/bet/${suit}/${amount}`, {
            method: 'POST',
            //body: JSON.stringify(data),
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
                <BetChoice suit="heads" onClick={this.placeBet} />
                <div className="gameboard">
                    <img src={logo} className="App-logo" alt="logo" />
                    <label>{this.state.coinStatus}</label>
                </div>
                <BetChoice suit="tails" onClick={this.placeBet} />
            </div>
        );
    }
}

export default Game;