import React from 'react';
import './style.css';
import ReactTable from 'react-table-6'
import 'react-table-6/react-table.css'


class Statistics extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            info: '',
            filterUsername: '',
            array: [],
            userInfo: '',
            winsInfo: [],
            loseInfo: [],
            showStats: false,
            userArray: [],
            expanded: {}
        };
       
    }


    async componentDidMount() {
        const response = await fetch('/stats/toplist/top/10000')
        const body = await response.json();

        if (response.status !== 200) {
            throw Error(body.message);
        }

        this.setState({
            info: body

        });

    }

    async getUser(user) {

        const response = await fetch('/stats/user/' + user);
        const body = await response.json();

        if (response.status !== 200) {
            throw Error(body.message);
        }

        this.setState({
            userInfo: body
        });
    }

    async getWID() {
        const userInfo = this.state.userInfo;

        for (var i = 0; i < userInfo.Wins.length; i++) {

            const response = await fetch('/stats/flip/' + userInfo.Wins[i]);

            const body = await response.json();
            if (response.status !== 200) {
                throw Error(body.message);
            }

            this.state.winsInfo.push(body)

        }
    }
    async getLosses() {
        const userInfo = this.state.userInfo;
        console.log(userInfo)
        for (var i = 0; i < userInfo.Losses.length; i++) {

            const response = await fetch('/stats/flip/' + userInfo.Losses[i]);

            const body = await response.json();
            if (response.status !== 200) {
                throw Error(body.message);
            }

            this.state.loseInfo.push(body)

        }
    }

    handleUserQuery = user => {

        this.getUser(user)
            .then(() => this.getWID()).then(() => this.getLosses()).then(() => this.showUserStats());
    }

    showUserStats() {

        const userInfo = this.state.userInfo;
        const userWID = this.state.winsInfo;
        const loseInfo = this.state.loseInfo;
        console.log(userInfo)
        for (var i = 0; i < userInfo.Losses.length; i++) {
            let unixTime = new Date(loseInfo[i].time).toLocaleTimeString("en-US")
            let unixDate = new Date(loseInfo[i].time).toLocaleDateString("en-US")
            let winKeys = Object.keys(loseInfo[i].winners);
            let loseKeys = Object.keys(loseInfo[i].losers);

            if (winKeys.length > 1) {
                winKeys = Object.keys(loseInfo[i].winners) + ",";
            }

            if (loseKeys.length > 1) {
                loseKeys = Object.keys(loseInfo[i].losers) + ",";
            }


            let obj = {
                "FlipTime": unixTime + " " + unixDate,
                "Results": loseInfo[i].results,
                "Winners": winKeys,
                "Losers": loseKeys,
                "winTrue": "Lost " + loseInfo[i].losers[userInfo.Username]

            };
            this.state.userArray.push(obj);
        }

        for (let i = 0; i < userInfo.Wins.length; i++) {
            let unixTime = new Date(userWID[i].time).toLocaleTimeString("en-US")
            let unixDate = new Date(userWID[i].time).toLocaleDateString("en-US")
            let winKeys = Object.keys(userWID[i].winners);
            let loseKeys = Object.keys(userWID[i].losers);

            if (winKeys.length > 1) {
                winKeys = Object.keys(userWID[i].winners) + ",";
            }

            if (loseKeys.length > 1) {
                loseKeys = Object.keys(userWID[i].losers) + ",";
            }


            let obj = {
                "FlipTime": unixTime + " " + unixDate,
                "Results": userWID[i].results,
                "Winners": winKeys,
                "Losers": loseKeys,
                "winTrue": "Won " + userWID[i].winners[userInfo.Username]

            };
            this.state.userArray.push(obj);
        }

        this.setState({
            showStats: true
        });
    }


    closeStatistics = event => {
       
        this.setState({
            showStats: false, userInfo: '', winsInfo: [], loseInfo: [], userArray: [], array: []
        });
        this.props.closeStats(event)
    }
    



    render() {

        const info = this.state.info;
        for (var i = 0; i < info.length; i++) {
            var obj = {
                "nr": i + 1,
                "Username": info[i].Username,
                "balanceId": info[i].Balance,
                "winsId": info[i].Wins,
                "lossId": info[i].Losses
            };
            this.state.array.push(obj);
        }
        const columnsDefault = [
            {
                Header: "ID",
                accessor: "nr",
                filterable: false

            },
            {
                Header: "User",
                accessor: "Username",
                filterable: true,

                Cell: props => {
                    return (
                        <button onClick={() => {
                            this.handleUserQuery(props.original.Username);
                        }}>{props.original.Username}
                        </button>
                    )
                }
                
            },
            {
                Header: "Balance",
                accessor: "balanceId",
                filterable: false

            },
            {
                Header: "Wins",
                accessor: "winsId",
                filterable: false

            },
            {
                Header: "Losses",
                accessor: "lossId",
                filterable: false
            },


        ]
        const columnsWinUser = [
            {
                Header: "Flip Info",
                columns: [
                    {
                        Header: "Time",
                        accessor: "FlipTime",
                        width: 300

                    },
                    {
                        Header: "Results",
                        accessor: "winTrue",
                        expand: true
                    }
                ]
            },

        ];

        const subWinInfo = [

            {
                Header: "Win Results",
                accessor: "Results"
            },

            {
                Header: "Winners",
                accessor: "Winners"
            },
            {
                Header: "Losers",
                accessor: "Losers"
            }

        ]







        return (
            <div className='popup'>
                <button onClick={this.closeStatistics}>X</button>
                {!this.state.showStats ?
                    <ReactTable data={this.state.array} columns={columnsDefault} filterable={["USERID"]}
                        showPageSizeOptions={false} defaultPageSize={10}

                    />
                    : null
                }

                {this.state.userInfo.Username !== undefined ?
                    "Statistics for user: " + this.state.userInfo.Username
                    : null
                }

                {this.state.showStats ?


                    <ReactTable data={this.state.userArray} columns={columnsWinUser}
                        showPageSizeOptions={false}
                        expanded={this.state.expanded}
                        onExpandedChange={(expanded, index, event) => {
                            this.setState({ expanded });
                        }}
                        SubComponent={row => {

                            const temp = this.state.userArray[row.index]
                            return (
                                <div style={{ padding: "20px" }}>
                                    <ReactTable
                                        data={[temp]}
                                        columns={subWinInfo}
                                        showPagination={false}
                                        defaultPageSize={1}
                                    />
                                </div>
                            );
                        }}
                    />
                    : null
                }



            </div>


        );



    }

}
export default Statistics;

