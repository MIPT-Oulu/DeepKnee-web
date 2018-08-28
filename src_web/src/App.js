import React, { Component } from 'react';
import {
    Alert,
    Progress,
    Row,
    Col,
    Jumbotron,
} from 'reactstrap';
import Footer from './Footer';
import socketIOClient from "socket.io-client";


class SIOClient extends Component {
    constructor(props) {
        super(props);
        this.state = {
            connected: false,
            response: false,
            endpoint: "http://0.0.0.0:8000"
        };
    }

    componentDidMount() {
        const endpoint = this.state.endpoint;
        const socket = socketIOClient(endpoint);

        // TODO: implement checking the connection state
        socket.emit('submission', 'dogshit');
        socket.on("submission", data => this.setState({ response: data }));
    }

    render() {
        const response = this.state.response;
        return (
            <div>
                {this.state.connected && <Alert>Remote server is not connected</Alert>}
                {response
                    ? <p>Returned value: {response}</p>
                    : <p>Loading...</p>}
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

class VisualizationBlock extends Component {
    render() {
        return (
            <Col>
                <Row>{this.props.image}</Row>
                <Row>{this.props.special}</Row>
                <Row>{this.props.title}</Row>
            </Col>
        );
    }
}

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            connected: false,
            something: false
        };
    }

    handleServerResponse() {
        // Pass the data from SIOClient to Visualization Blocks
    }

    render() {
        return (
            <div className="col">
                <SIOClient onServerResponse={this.handleServerResponse}/>

                <FileUploader />

                <Col>
                    <Progress multi>
                        <Progress bar value="10"> Image uploading </Progress>
                        <Progress bar color="danger" value="20"> Knee localization </Progress>
                        <Progress bar color="warning" value="40"> Deep Knee </Progress>
                        <Progress bar color="success" value="20"> Gradcam </Progress>
                    </Progress>
                </Col>

                {/*<Jumbotron>*/}
                    <div className="visualization my-3">
                        <Row>
                            <Col>i1</Col>
                            <Col>s1</Col>
                            <Col>t1</Col>
                        </Row>
                        <Row>
                            <Col>i1</Col>
                            <Col>s1</Col>
                            <Col>t1</Col>
                        </Row>
                        <Row>
                            <Col>i1</Col>
                            <Col>s1</Col>
                            <Col>t1</Col>
                        </Row>
                    </div>
                {/*</Jumbotron>*/}

                <Footer/>
            </div>
        );
    }
}

export default App;