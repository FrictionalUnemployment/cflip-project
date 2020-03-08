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
            topFive: ["Hejsan", "Bester", "BENLPS", "HEMSKT", "BAJS"]
        };
    }

    renderItem(itm) {
        return <TopItem value={this.state.topFive[itm]} />;
    }

    render() {
        return (
            <div className="toplist">
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

export default TopList;