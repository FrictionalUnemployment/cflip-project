import React, { Component, useImperativeHandle } from 'react';

import './App.css';
import Header from './components/Header.js';
import TopList from './components/TopList.js'
import Game from './components/Game.js'
import 'whatwg-fetch'

class App extends Component {

    render() {
        return (
            <div className="Site">
                <Header />
                <Game />
                <TopList />
            </div>

        );
    }
}

export default App;