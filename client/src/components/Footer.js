import React, { Component, useImperativeHandle } from 'react';
import BotList from './BotList.js';
import TopList from './TopList.js';

class Footer extends Component {

    render() {
        return (
            <div className="footer">
                <TopList />
                <BotList />
            </div>

        );
    }
}

export default Footer;