import React from 'react';  
import './style.css';  
import {Table} from "reactable";
// v Denna används ej? Kommenterar ut den.
//import { getQueriesForElement } from '@testing-library/react';

class Statistics extends React.Component {  
    constructor(props) {
        super(props);
        this.state = {
            info: '',
            filterUsername: '',
            array: [],
            userInfo: '',
            winsInfo: [],
            showStats: false,
            userArray: [],
            expanded: {}

        };
        this.filterArray = this.filterArray.bind(this);
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

    handleUserQuery = user => {

        this.getUser(user)
            .then(() => this.getWID()).then(() => this.showUserStats());
    }

    showUserStats() {

        const userInfo = this.state.userInfo;
        const userWID = this.state.winsInfo;
        console.log(userInfo, userWID)
       
        for (var i = 0; i < userInfo.Wins.length; i++) {
            for (var j = 0; j < userWID[i].winners.length; j++) {
                console.log(userWID[i].winners[j], userInfo.Wins[i])
               
                    var obj = {
                        "WinnerWID": userInfo.Wins[i],
                        "FlipTime": userWID[i].time,
                        "Results": userWID[i].results,
                        "Winners": Object.keys(userWID[i].winners[j])[0],
                        "winTrue":  userWID[i].winners[j][userInfo.Username] 
                        
                    };
                

                

            }
            this.state.userArray.push(obj);
        }

        this.setState({
            showStats: true
        });
    }



    filterArray(e) {


        console.log(e)

    }
    expand_row(info) {
        console.log(info);
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
                Header: "Win Time",
                accessor: "FlipTime"
            },
            {
                Header: "Winners",
                accessor: "Winners"
            }
        ]







        return (
            <div className='popup'>

                {!this.state.showStats ?
                    <ReactTable data={this.state.array} columns={columnsDefault} filterable={["Username"]}
                        showPageSizeOptions={false} defaultPageSize={10}

                    />
                    : null
                }
                {"Statistics for user: " + this.state.userInfo.Username}
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

