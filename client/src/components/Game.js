import React from 'react'
import logo from '../logo512.png';
const WebSocket = require('isomorphic-ws');

class BetChoice extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.inputRef = React.createRef();
    }

    handleClick() {
        this.props.onClick(this.props.suit, this.inputRef.current.value);
        this.inputRef.current.value = "";
    }

    render() {
        return (
            <div className="betchoice">
                <input ref={this.inputRef} type="number"></input>
                <button className="s" onClick={this.handleClick}>Bet {this.props.suit}!</button>
            </div>
        )
    }
    
}

class CurrentBet extends React.Component {
    render() {
        const bet = this.props.suit && this.props.amount != null ? "You bet " + this.props.amount + " on " + this.props.suit + "." : null;
        return (
            <p id="currentbettext">{bet}</p>
        );
    }
}

class BetWinner extends React.Component {

    render() {
        const winner = this.props.lastWinner ? "Winner is " + this.props.lastWinner : null;
        return (
            <p id="wintext">{winner}</p>
        );
    }
}

class BetTimer extends React.Component {

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
    _isMounted = false;
    constructor(props) {
        super(props);
        this.state = {
            coinStatus: 0,
            lastWinner: false,
            suit: null,
            amount: null
        }
        const ws = new WebSocket('wss://cflip.app:5001'); // Kopplad mot coinen
        // När medelanden kommer körs funktionen updateCoinStatus
        this.coinStatus = this.coinStatus.bind(this);
        ws.onmessage = this.coinStatus;
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    coinStatus(data) {
        
        // Här är data.data JSON strängen
        if (this._isMounted) {
            const parsed = JSON.parse(data.data);
            this.setState({coinStatus: parsed.timeleft/1000.0});
            if (parsed.winner != null) {
                this.setState({lastWinner: parsed.winner[0], suit: null, amount: null});
                setTimeout(() => {
                    this.setState({lastWinner: false, suit: null});
                }, 5000);
            }
        }
    }

    placeBet = async (suit, amount) => {
        // Här sätts vad, vem och hur mycket
        //const data = {bet: suit, username: name, amount: amount};
        this.setState({suit: suit, amount: amount});

        const response = await fetch(`/coin/bet/${suit}/${amount}`, {
            method: 'POST',
            //body: JSON.stringify(data),
            headers: {'Accept':'application/json', 'Content-Type': 'application/json'}
        });

        const body = await response.json();
        if (response.status === 400) {
            alert("Database read/write error!");
        }
        else if (response.status === 401) {
            alert("You are not logged in!");
        }
        else if (response.status === 403) {
            //throw Error(body.message);
            alert("Already put a bet on this flip!");
        }
        else if (response.status === 422) {
            alert("Illegal value for bet!");
        }
        return body.express;
    }

    clearWinner = () => {
        
    }
    // <img src={logo} className="App-logo" alt="logo" />  // Snurrande coinen.
    render() {
        return (
            <div className="App-game">
                <BetChoice suit="heads" onClick={this.placeBet} />
                <div className="gameboard">
                    <CurrentBet {...this.state} />
                    <BetTimer {...this.state} />
                    <BetWinner {...this.state} />
                </div>
                <BetChoice suit="tails" onClick={this.placeBet} />
            </div>
        );
    }
}

export default Game;