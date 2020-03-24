import React from 'react'
const WebSocket = require('isomorphic-ws');

class BetChoice extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.inputRef = React.createRef();
    }

    handleClick() {
        if (this.inputRef.current.value !== "") {
            this.props.onClick(this.props.suit, this.inputRef.current.value);
            this.inputRef.current.value = "";
        }
    }

    render() {
        return (
            <div className="betchoice">
                <input className="i" ref={this.inputRef} type="number" min="1"></input>
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

class Table extends React.Component {
    render() {
        if (this.props.data) {
            return (
                <table>
                    {this.props.data.map(row => <TableRow row={row} />)}
                </table>
            );
        } else {
            return(null);
        }
    }
}

class TableRow extends React.Component {
    render() {
        if (this.props.row) {
            return (
                <tr>
                    <td key={this.props.row.user}>{this.props.row.user}</td>
                    <td key={this.props.row.amount}>{this.props.row.amount}</td>
                </tr>
            );
        } else {
            return (null);
        }
    }
}

class BetTimer extends React.Component {

    render() {
        if (this.props.coinStatus <= 5) {
            return (
                <label id="urgenttimer" className="BetTimer">{this.props.coinStatus}</label>
            );
        } else {
            return (
                <label id="normaltimer" className="BetTimer">{this.props.coinStatus}</label>
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
            amount: null,
            center: null,
            betHeads: null,
            betTails: null,
            betError: false,
            errorMsg: ""
        }
        const ws = new WebSocket('wss://cflip.app:5001'); // Kopplad mot coinen
        // När medelanden kommer körs funktionen updateCoinStatus
        this.coinStatus = this.coinStatus.bind(this);
        ws.onmessage = this.coinStatus;
    }

    componentDidMount() {
        this._isMounted = true;
        this.setState({
            center: <img alt="CFLIP" src='./../cflip-logo.png' id="App-logo" className="image" />
        })
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    coinStatus(data) {

        // Här är data.data JSON strängen
        if (this._isMounted) {
            const parsed = JSON.parse(data.data);
            this.setState({ coinStatus: (parsed.timeleft / 1000.0).toFixed(1) });
            if (parsed.winner != null) {
                if (parsed.winner[0] === 'heads') {
                    this.setState({ center: <img alt="HEADS" src="./../heads-cflip.png" className="image" /> });
                } else {
                    this.setState({ center: <img alt="TAILS" src="./../tails-cflip.png" className="image" /> });
                }
                setTimeout(() => {
                    this.setState({ center: <img alt="CFLIP" src='./../cflip-logo.png' id="App-logo" className="image" /> });
                }, 2000);
            }

            if (parsed.bet.length > 0) {
                this.setState({
                    betHeads: parsed.bet.filter(user => user.bet === 'heads'),
                    betTails: parsed.bet.filter(user => user.bet === 'tails')
                });
            } else {
                this.setState({ betHeads: null, betTails: null });
            }
        }
    }

    setErrorMsg = msg => {
        this.setState({betError: true, errorMsg: msg});
        setTimeout(() => {this.setState({betError: false, errorMsg: ""})}, 3000);
    }

    placeBet = async (suit, amount) => {
        // Här sätts vad, vem och hur mycket
        if (amount < 0) {
            this.setErrorMsg("You can't bet a negative amount!");
            return;
        }

        const response = await fetch(`/coin/bet/${suit}/${amount}`, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });

        const body = await response.json();
        if (response.status === 400) {
            alert("Database read/write error!");
        }
        else if (response.status === 401) {
            this.setErrorMsg("You are not logged in!");
        }
        else if (response.status === 403) {
            //throw Error(body.message);
            this.setErrorMsg("You already put a bet on this flip!");
        }
        else if (response.status === 422) {
            alert("Illegal value for bet!");
        } else {
            this.setState({ suit: suit, amount: amount });
        }
        return body.express;
    }
    
    render() {
        let betErrorMsg = this.state.betError ? <p id="beterror">{this.state.errorMsg}</p> : null;
        return (
            <div className="App-game">
                <div className="users-bets" id="users-heads">
                    <Table data={this.state.betHeads} />
                </div>
                <BetChoice suit="heads" onClick={this.placeBet} />
                <div className="gameboard">
                    {betErrorMsg}
                    <CurrentBet {...this.state} />

                    {this.state.center}
                    <BetTimer {...this.state} />
                </div>
                <div className="users-bets" id="users-tails">
                    <Table data={this.state.betTails} />
                </div>
                <BetChoice suit="tails" onClick={this.placeBet} />
            </div>
        );
    }
}

export default Game;