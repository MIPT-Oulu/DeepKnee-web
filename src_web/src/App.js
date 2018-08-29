import React, { Component } from 'react';
import {
    Alert,  // eslint-disable-next-line
    Progress,  // eslint-disable-next-line
    Row,  // eslint-disable-next-line
    Col,  // eslint-disable-next-line
    Jumbotron,  // eslint-disable-next-line
} from 'reactstrap';
import Footer from './Footer';
import socketIOClient from "socket.io-client";


class SIOClient extends Component {
    constructor(props) {
        super(props);
        this.state = {
            endpoint: "http://0.0.0.0:8000",
            response: null,
        };
        this.socket = socketIOClient(this.state.endpoint);
    }

    componentDidMount() {
        this.socket.on("dicom_processing", data => this.setState({ response: data }));
    }

    componentDidUpdate(prevProps, prevState) {
        // Input file updated
        if (this.props.file_blob !== prevProps.file_blob) {
            this.socket.emit('dicom_submission', this.props.file_blob);
            console.log('Sent: ');
            console.log(this.props.file_blob);
        }
        // Results updated
        if (this.state.response !== prevState.response) {
            // TODO: unpack the results
            const response_raw = this.state.response;
            const response_obj = JSON.parse(response_raw);
            // Lift up the update
            let ret = {
                server_status: "OK!",
                server_response: response_raw,
                image_src: response_obj.image_src,
                image_first: response_obj.image_first,
                image_second: response_obj.image_second,
                special_first: response_obj.special_first,
                special_second: response_obj.special_second,

            };
            console.log('Received:');
            console.log(ret);
            this.props.onServerResponse(ret);
        }
    }

    render() {
        return (
            <div>
                {/*{this.state.response && <Alert>Remote server is not connected</Alert>}*/}

                    {/*? <p>Returned value: {response}</p>*/}
                    {/*: <p>Loading...</p>}*/}
            </div>
        );
    }
}


class FileUploader extends Component {
    constructor(props) {
        super(props);
        this.state = {filename: ''};

        this.handleChangeInput = this.handleChangeInput.bind(this);
        this.handleChangeSubmit = this.handleChangeSubmit.bind(this);
    }

    extractFilename = function (fullname) {
        return fullname.split('\\').pop().split('/').pop();
    };

    handleChangeInput(event) {
        this.setState({filename: this.extractFilename(event.target.value)});
    }

    handleChangeSubmit(event) {
        this.setState({filename: 'File submitted'});
        // TODO: load data as base64
        // let blob = null;
        // TODO: remove the dummy retval
        const blob = {file_name: "Nothing", file_blob: "Dummy data"};
        this.props.onFileSubmission(blob);
    }

    render() {
        return (
            <div className="input-group my-3">
                <div className="input-group-prepend">
                    <button className="btn btn-outline-secondary" type="button"
                            onClick={this.handleChangeSubmit}>
                        Submit DICOM
                    </button>
                </div>
                <div className="custom-file">
                    <input type="file" className="custom-file-input" id="inputGroupFile"
                           onChange={this.handleChangeInput} />
                        <label className="custom-file-label" htmlFor="inputGroupFile">
                            {this.state.filename ? this.state.filename : "Choose file"}
                        </label>
                </div>
            </div>
    )};
}


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            server_status: 'undefined',
            server_response: null,

            file_name: null,
            file_blob: null,

            image_src: '',
            image_first: '',
            image_second: '',
            special_src: '',
            special_first: '',
            special_second: '',
            title_src: '',
            title_first: '',
            title_second: '',
        };

        this.handleFileSubmission = this.handleFileSubmission.bind(this);
        this.handleServerResponse = this.handleServerResponse.bind(this);
    }

    handleFileSubmission(data) {
        this.setState({
            file_name: data.file_name,
            file_blob: data.file_blob
        });
    }

    handleServerResponse(data) {
        this.setState({
            server_status: data.server_status,
            server_response: data.server_response,
            image_src: data.image_src,
            image_first: data.image_first,
            image_second: data.image_second,
            special_src: data.special_src,
            special_first: data.special_first,
            special_second: data.special_second,
        });
    }

    render() {
        return (
            <div className="col">
                <SIOClient
                    file_name={this.state.file_name}
                    file_blob={this.state.file_blob}
                    onServerResponse={this.handleServerResponse}
                />

                <FileUploader
                    onFileSubmission={this.handleFileSubmission}
                />

                {/*<Col>
                    <Progress multi>
                        <Progress bar value="10"> Image uploading </Progress>
                        <Progress bar color="danger" value="20"> Knee localization </Progress>
                        <Progress bar color="warning" value="40"> Deep Knee </Progress>
                        <Progress bar color="success" value="20"> Gradcam </Progress>
                    </Progress>
                </Col>*/}

                <hr />

                {/*<Jumbotron>*/}
                    <div className="container">
                        <div className="row" style={{height: "400px"}}>
                            <div className="col-sm text-center align-self-center">
                                <img src={this.state.image_src} className="img-fluid" alt=""/>
                            </div>
                            <div className="col-sm text-center align-self-center">
                                <img src={this.state.image_first} className="img-fluid" alt=""/>
                            </div>
                            <div className="col-sm text-center align-self-center">
                                <img src={this.state.image_second} className="img-fluid" alt=""/>
                            </div>
                        </div>
                        <div className="row" style={{height: "100px"}}>
                            <div className="col-sm align-self-center">
                                {}
                            </div>
                            <div className="col-sm text-center align-self-center">
                                <img src={this.state.special_first} className="img-fluid" alt=""/>
                            </div>
                            <div className="col-sm text-center align-self-center">
                                <img src={this.state.special_second} className="img-fluid" alt=""/>
                            </div>
                        </div>
                        <div className="row" style={{height: "20px"}}>
                            <div className="col-sm">
                                <p className="text-center font-weight-bold">Input image</p>
                            </div>
                            <div className="col-sm">
                                <p className="text-center font-weight-bold">First knee</p>
                            </div>
                            <div className="col-sm">
                                <p className="text-center font-weight-bold">Second knee</p>
                            </div>
                        </div>
                    </div>
                {/*</Jumbotron>*/}

                <Footer/>
            </div>
        );
    }
}

export default App;