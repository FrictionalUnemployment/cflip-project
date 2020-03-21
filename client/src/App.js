import React, { Component } from 'react';

import './App.css';
import Header from './components/Header.js';
import Footer from './components/Footer.js'
import Game from './components/Game.js'
import Statistics from './components/Statistics';

class App extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="Site">
                <Header setGame={this.setGame} setStats={this.setStats} />
                <Game />
                <Footer />
            </div>

        );
    }
}

export default App;