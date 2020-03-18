import React from 'react'

function TopItem(props) {
    return (
        <li className="topitem">{props.value}</li>
    );
}

class TopList extends React.Component {
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
        if (response.status !== 200) {
            throw Error(body.message);
        }

        let a = [];
        for (let i=0;i < body.length; i++) {
            a[i] = body[i].Username + " - " + body[i].Balance;
        }
        this.setState({isFetching: false, topFive: a});
    }

    render() {
        var listItems = this.state.topFive.map(function(item) {
            return <TopItem key={item} value={item} />;
        });
        return (
            <div className="toplist">
                <ol>
                    {listItems}
                </ol>       
            </div>
        );
    }
}

export default TopList;