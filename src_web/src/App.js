import React, {Component} from 'react';
import {Progress} from 'reactstrap';
import SIOClient from './SIOClient';
import FileUploader from './FileUploader';
import Footer from './Footer';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            server_status: 'undefined',
            server_response: null,

            file_name: null,
            file_blob: null,

            image_src: null,
            image_first: null,
            image_second: null,
            special_src: null,
            special_first: null,
            special_second: null,
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

                {/*<Progress multi>*/}
                    {/*<Progress bar value="10"> Image uploading </Progress>*/}
                    {/*<Progress bar color="danger" value="20"> Knee localization </Progress>*/}
                    {/*<Progress bar color="warning" value="40"> Deep Knee </Progress>*/}
                    {/*<Progress bar color="success" value="20"> Gradcam </Progress>*/}
                {/*</Progress>*/}

                <hr />

                <div className="container" style={{visibility: this.state.image_first == null ? "hidden" : ""}}>
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

                <Footer/>
            </div>
        );
    }
}

export default App;