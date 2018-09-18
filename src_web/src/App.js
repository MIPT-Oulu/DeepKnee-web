import React, {Component} from 'react';
import SIOClient from './SIOClient';
import FileUploader from './FileUploader';
import ProgressBar from './ProgressBar';
import Footer from './Footer';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            server_status: 'undefined',
            server_response: null,
            is_waiting_response: false,

            file_name: null,
            file_blob: null,

            // image_src: null,
            // special_src: null,
            image_1st_raw: null,
            image_2nd_raw: null,
            image_1st_heatmap: null,
            image_2nd_heatmap: null,
            special_1st: null,
            special_2nd: null,
        };

        this.handleFileSubmission = this.handleFileSubmission.bind(this);
        this.handleServerResponse = this.handleServerResponse.bind(this);
    }

    handleFileSubmission(data) {
        this.setState({
            is_waiting_response: true,

            file_name: data.file_name,
            file_blob: data.file_blob
        });
    }

    handleServerResponse(data) {
        this.setState({
            server_status: data.server_status,
            server_response: data.server_response,
            is_waiting_response: false,

            // image_src: data.image_src,
            // special_src: data.special_src,
            image_1st_raw: data.image_1st_raw,
            image_2nd_raw: data.image_2nd_raw,
            image_1st_heatmap: data.image_1st_heatmap,
            image_2nd_heatmap: data.image_2nd_heatmap,
            special_1st: data.special_1st,
            special_2nd: data.special_2nd,
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

                <hr />

                {this.state.is_waiting_response &&
                    <ProgressBar/>
                }

                <div className="container" style={{visibility: this.state.image_1st_raw == null ? "hidden" : ""}}>
                    <div className="row" style={{height: "20px"}}>
                        <div className="col-sm">
                            <p className="text-center font-weight-bold">Left knee</p>
                        </div>
                        <div className="col-sm">
                            <p className="text-center font-weight-bold">Right knee</p>
                        </div>
                    </div>
                    <div className="row" style={{height: "400px"}}>
                        <div className="col-sm text-center align-self-center">
                            <img src={this.state.image_1st_raw} className="img-fluid" alt=""/>
                        </div>
                        <div className="col-sm text-center align-self-center">
                            <img src={this.state.image_1st_heatmap} className="img-fluid" alt=""/>
                        </div>
                        <div className="col-sm text-center align-self-center">
                            <img src={this.state.image_2nd_raw} className="img-fluid" alt=""/>
                        </div>
                        <div className="col-sm text-center align-self-center">
                            <img src={this.state.image_2nd_heatmap} className="img-fluid" alt=""/>
                        </div>
                    </div>
                    <div className="row" style={{height: "100px"}}>
                        <div className="col-sm text-center align-self-center">
                            <img src={this.state.special_1st} className="img-fluid" alt=""/>
                        </div>
                        <div className="col-sm text-center align-self-center">
                            <img src={this.state.special_2nd} className="img-fluid" alt=""/>
                        </div>
                    </div>
                </div>

                <Footer/>
            </div>
        );
    }
}

export default App;