import logging

import socketio
import eventlet
from flask import Flask


logging.basicConfig()
logger = logging.getLogger('backend')
logger.setLevel(logging.DEBUG)


class SIONamespace(socketio.Namespace):
    def on_connect(self, sid, environ):
        logger.info('Connected: {}'.format(sid))

    def on_submission(self, sid, data):
        logger.debug('Received message: {}'.format(data))
        ret = 'message ' + data
        return ret

    def on_disconnect(self, sid):
        logger.info('Disconnected: {}'.format(sid))


if __name__ == '__main__':
    sio = socketio.Server()
    app = Flask(__name__)
    sio.register_namespace(SIONamespace())

    # Wrap Flask application with socketio's middleware
    app = socketio.Middleware(sio, app)

    # Deploy as an eventlet WSGI server
    eventlet.wsgi.server(eventlet.listen(('', 8000)), app)
