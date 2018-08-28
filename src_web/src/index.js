import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
// import App from './AppSIO';
import registerServiceWorker from './registerServiceWorker';
import 'bootstrap/dist/css/bootstrap.css';


ReactDOM.render(
    <App />,
    document.getElementById('root')
);
registerServiceWorker();
