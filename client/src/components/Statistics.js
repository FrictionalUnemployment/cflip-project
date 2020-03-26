import React from 'react';
import ReactTable from 'react-table-6'
import './../styles/table.css'



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
            expanded: {},
            errorMessageWins: '',
            Loading: false,
            errorMessageLosses: ''
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

                if (body.errors[0].msg === "Invalid value") {
                    return this.setState({ errorMessageWins: body.errors[0].msg });
                }
            }
            if (userInfo.Wins[0] !== null) {
                this.state.winsInfo.push(body);
            }

        }
    }
    async getLosses() {
        const userInfo = this.state.userInfo;
        console.log(userInfo)
        for (var i = 0; i < userInfo.Losses.length; i++) {

            const response = await fetch('/stats/flip/' + userInfo.Losses[i]);

            const body = await response.json();
            if (response.status !== 200) {
                if (body.errors[0].msg === "Invalid value") {
                    return this.setState({ errorMessageLosses: body.errors[0].msg });
                }
            }
            if (userInfo.Losses[0] !== null) {
                this.state.loseInfo.push(body);
            }

        }
    }

    handleUserQuery = user => {

        if (this.state.errorMessageWins !== "" || this.state.errorMessageLosses !== "") {
            this.setState({ errorMessageWins: '', Loading: false, errorMessageLosses: ''});
        } else if (this.state.Loading === false) {
            this.setState({ Loading: true });
            this.getUser(user)
                .then(() => this.getWID()).then(() => this.getLosses()).then(() => this.showUserStats());
        }
    }

    showUserStats() {

        const userInfo = this.state.userInfo;
        const userWID = this.state.winsInfo;
        const loseInfo = this.state.loseInfo;
        if (this.state.errorMessageLosses === "") {

            for (var i = 0; i < userInfo.Losses.length; i++) {
                let unixTime = new Date(loseInfo[i].time).toISOString();
                let winKeys = Object.keys(loseInfo[i].winners);
                let loseKeys = Object.keys(loseInfo[i].losers);

                if (winKeys.length > 1) {
                    winKeys = Object.keys(loseInfo[i].winners) + ",";
                }

                if (loseKeys.length > 1) {
                    loseKeys = Object.keys(loseInfo[i].losers) + ",";
                }
                unixTime = unixTime.replace("T", " ")
                unixTime = unixTime.replace("Z", "")

                let obj = {
                    "FlipTime": unixTime,
                    "Results": loseInfo[i].results,
                    "Winners": winKeys,
                    "Losers": loseKeys,
                    "winTrue": "Lost " + loseInfo[i].losers[userInfo.Username]

                };
                this.state.userArray.push(obj);
            }
        }
        if (this.state.errorMessageWins === "") {
            for (let i = 0; i < userInfo.Wins.length; i++) {
                let unixTime = new Date(userWID[i].time).toISOString();
                let winKeys = Object.keys(userWID[i].winners);
                let loseKeys = Object.keys(userWID[i].losers);

                if (winKeys.length > 1) {
                    winKeys = Object.keys(userWID[i].winners).join(",");
                }

                if (loseKeys.length > 1) {
                    loseKeys = Object.keys(userWID[i].losers).join(",");
                }
                unixTime = unixTime.replace("T", " ")
                unixTime = unixTime.replace("Z", "")

                let obj = {
                    "FlipTime": unixTime,
                    "Results": userWID[i].results,
                    "Winners": winKeys,
                    "Losers": loseKeys,
                    "winTrue": "Won " + userWID[i].winners[userInfo.Username]

                };
                this.state.userArray.push(obj);
            }

            this.setState({
                showStats: true, Loading: false, errorMessageWins: '', errorMessageLosses: ''
            });
        }

    }


    closeStatistics() {

        this.setState({
            showStats: false, userInfo: '', winsInfo: [], loseInfo: [], userArray: [], array: []
        });
        this.props.closeStats();
    }




    render() {

        const info = this.state.info;
        for (let i = 0; i < info.length; i++) {
            let obj = {
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
                        width: 350

                    },
                    {
                        Header: "Results",
                        accessor: "winTrue",
                        width: 200,
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
            <div>
                <div style={{ display: "flex", justifyContent: "center", color: "white" }}>

                    <div style={{ color: "red" }}>
                        {this.state.errorMessageWins !== "" || this.state.errorMessageLosses !== "" ?
                            "Statistics for user: " + this.state.errorMessage
                            : null
                        }
                    </div>

                    {this.state.userInfo.Username !== undefined && this.state.errorMessageWins == ""
                    || this.state.userInfo.Username !== undefined && this.state.errorMessageLosses == ""  ?
                        "Statistics for user: " + this.state.userInfo.Username
                        : null
                    }


                </div>


                <div className="App-game">




                    {!this.state.showStats ?
                        <ReactTable data={this.state.array} columns={columnsDefault} filterable={["USERID"]}
                            showPageSizeOptions={false} defaultPageSize={10}

                        />
                        : null
                    }



                    {this.state.showStats ?


                        <ReactTable data={this.state.userArray} columns={columnsWinUser}
                            showPageSizeOptions={false}
                            defaultPageSize={12}
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
            </div>
        );

    }

}
export default Statistics;

