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

class BetTimer extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        if (this.props.coinStatus <= 5) {
            return (
                <label id="urgenttimer">{this.props.coinStatus}</label>
            );
        } else {
            return (
                <label id="normaltimer">{this.props.coinStatus}</label>
            );
        }
    }
}

class Game extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            coinStatus: 0
        }
        const ws = new WebSocket('wss://cflip.app:5001'); // Kopplad mot coinen
        // När medelanden kommer körs funktionen updateCoinStatus
        this.coinStatus = this.coinStatus.bind(this);
        ws.onmessage = this.coinStatus;
    }

    coinStatus(data) {
        
        // Här är data.data JSON strängen
        this.setState({coinStatus: JSON.parse(data.data).timeleft/1000.0});
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
        if (response.status == 400) {
            alert("Database read/write error!");
        }
        else if (response.status == 401) {
            alert("You are not logged in!");
        }
        else if (response.status == 403) {
            //throw Error(body.message);
            alert("Already put a bet on this flip!");
        }
        else if (response.status == 422) {
            alert("Illegal value for bet!");
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
                    <BetTimer {...this.state} />
                </div>
                <BetChoice suit="tails" onClick={this.placeBet} />
            </div>
        );
    }
}

export default Game;