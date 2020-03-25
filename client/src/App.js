import React, { Component } from 'react';

import './styles/App.css';
import Header from './components/Header.js';
import Footer from './components/Footer.js'
import Game from './components/Game.js'

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            balance: 0
        }
    }

    setBalance = value => {
        this.setState({balance: value});
    }

    getBalance = () => {
        return this.state.balance;
    }

    render() {
        return (
            <div className="Site">
                <Header getBalance={this.getBalance} setBalance={this.setBalance}/>
                <Game getBalance={this.getBalance} />
                <Footer />
            </div>

        );
    }
}

export default App;