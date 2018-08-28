import React, { Component } from "react";
import socketIOClient from "socket.io-client";


class App extends Component {
    constructor() {
        super();
        this.state = {
            response: false,
            endpoint: "http://0.0.0.0:8000"
        };
    }
    componentDidMount() {
        const { endpoint } = this.state;
        const socket = socketIOClient(endpoint);
        socket.emit('my message', 'dogshit');
        socket.on("my message", data => this.setState({ response: data }));
    }
    render() {
        const { response } = this.state;
        return (
            <div style={{ textAlign: "center" }}>
                {response
                    ? <p>
                        Returned value: {response}
                    </p>
                    : <p>Loading...</p>}
            </div>
        );
    }
}
export default App;
