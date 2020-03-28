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
            errorMessageLosses: '',
            displayStats: false
        };

    }

    //Funktionerna som körs först.
    async componentDidMount() {
        this.getTopList()
                .then(() => this.displayAllStats());
    }
    //Hämtar alla användare i rätt ordning.
    async getTopList() {
        const response = await fetch('/stats/toplist/top/10000')
        const body = await response.json();
        this.setState({
            info: body

        });

    }
    //Visar all statistik när man först laddar "pagen"
    displayAllStats = () => {
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

        return this.setState({displayStats: true})
    }
    //Hämtar användaren sätter det till userInfo.
    async getUser(user) {
        const response = await fetch('/stats/user/' + user);
        const body = await response.json();
        this.setState({
            userInfo: body
        });
    }
    //Vi kör en funktion i taget, först getUser sedan getWins o.s.v. Loading är för att förhindra att man spammar handleUserQuery.
    handleUserQuery = user => {
        if (this.state.errorMessageWins !== "" || this.state.errorMessageLosses !== "") {
            this.setState({ errorMessageWins: '', Loading: false, errorMessageLosses: ''});
        } else if (this.state.Loading === false) {
            this.setState({ Loading: true });
            this.getUser(user).then(() => 
                this.getWins()).then(() => 
                    this.getLosses()).then(() => 
                        this.showUserStats());
        }
    }
    //Hämtar alla wins för en specifik användare och stoppar in det i winsInfo arrayen.
    async getWins() {
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
    //Gör likadant som getWins fast för losers.
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
    //Här hämtas ut all data om en användare och stoppas in i en array som sedan används för att displaya en användares statistik
    //Kollar userInfo för alla losses en användare har, sedan omvandlas unix timen till ISO standard
    //Sedan stoppas allt detta i en object som kan sen visas i förlorar eller vinnar kolumnerna
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
                accessor: "Winners",
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
                        || this.state.userInfo.Username !== undefined && this.state.errorMessageLosses == "" ?
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

