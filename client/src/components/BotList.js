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
        const response = await fetch('/stats/toplist/bottom/5');
        const body = await response.json();
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
        var listItems = this.state.topFive.map(function(item) {
            return <BotItem key={item} value={item} />;
        });
        return (
            <div className="botlist">
                Bottom 5:
                <ol>
                    {listItems}
                </ol>       
            </div>
        );
    }
}

export default BotList;