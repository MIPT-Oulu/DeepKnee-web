import {Component} from "react";
import socketIOClient from "socket.io-client";
import React from "react";

class SIOClient extends Component {
    constructor(props) {
        super(props);
        this.state = {
            endpoint: "http://0.0.0.0:8000",
            response: null,
            connected: false,
        };
        this.socket = socketIOClient(this.state.endpoint);
    }

    componentDidMount() {
        this.socket.on("dicom_processing", data => this.setState({ response: data }));
    }

    componentDidUpdate(prevProps, prevState) {
        // Input file updated
        if (this.props.file_blob !== prevProps.file_blob) {
            let blob = {
                file_name: this.props.file_name,
                file_blob: this.props.file_blob,
            };

            this.socket.emit('dicom_submission', JSON.stringify(blob));
            // TODO: cleanup
            console.log('Sent: ');
            console.log(this.props.file_blob);
        }
        // Results updated
        if (this.state.response !== prevState.response) {
            const response_raw = this.state.response;
            const response_obj = JSON.parse(response_raw);
            let ret = {
                server_status: "OK!",
                server_response: response_raw,
                image_src: response_obj.image_src,
                image_first: response_obj.image_first,
                image_second: response_obj.image_second,
                special_first: response_obj.special_first,
                special_second: response_obj.special_second,
            };
            // TODO: cleanup
            console.log('Received:');
            console.log(ret);
            // Lift up the update
            this.props.onServerResponse(ret);
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