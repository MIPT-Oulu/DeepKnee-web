import React, {Component} from "react";
import socketIOClient from "socket.io-client";

class SIOClient extends Component {
    constructor(props) {
        super(props);
        this.state = {
            endpoint: "http://0.0.0.0:8000",
            response: null,
            connected: false,
        };
        this.socket = socketIOClient(this.state.endpoint,
            {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: Infinity
            });
    }

    componentDidMount() {
        this.socket.on("dicom_processing", data => this.setState({ response: data }));
        this.socket.on("connect", () => this.setState({connected: true}));
        this.socket.on("disconnect", () => this.setState({connected: false}));
    }

    componentDidUpdate(prevProps, prevState) {
        // Input file updated
        if (this.props.file_blob !== prevProps.file_blob) {
            let blob = {
                file_name: this.props.file_name,
                file_blob: this.props.file_blob,
            };

            this.socket.emit('dicom_submission', blob);
            console.log('Message sent');
            // console.log(blob);
        }
        // Results updated
        if (this.state.response !== prevState.response) {
            const response = this.state.response;
            console.log('Message received');
            // console.log(response);
            // Lift up the update
            this.props.onServerResponse(response);
        }
    }

    render() {
        return (
            this.state.connected ? null :
                <div className="alert alert-danger" role="alert">
                    Server is not connected
                </div>
        );
    }
}

export default SIOClient;