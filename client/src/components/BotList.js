import React from 'react'

function BotItem(props) {
    return (
    <li className="botitem">{props.value}</li>
    );
}

class BotList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isFetching: false,
            topFive: [],
        };
    }

    componentDidMount() {
        this.fetchUsers();
        this.timer = setInterval(() => this.fetchUsers(), 30000);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
        this.timer = null;
    }

    fetchUsers = async () => {
        this.setState({isFetching: true});
        const response = await fetch('/stats/toplist/top/5');
        const body = await response.json();
        for (let i =0; i < body.length; i++) {
            console.log(body[i]);
        }
        if (response.status !== 200) {
            throw Error(body.message);
        }

        let a = [];
        for (let i=0;i < body.length; i++) {
            a[i] = body[i].Username + " - " + body[i].Balance;
        }
        this.setState({isFetching: false, topFive: a});
    }

    renderItem(itm) {
        return <BotItem value={this.state.topFive[itm]} />;
    }

    render() {
        return (
            <div className="botlist">
                <ol>
                    {this.renderItem(0)}
                    {this.renderItem(1)}
                    {this.renderItem(2)}
                    {this.renderItem(3)}
                    {this.renderItem(4)}
                </ol>       
            </div>
        );
    }
}

export default BotList;