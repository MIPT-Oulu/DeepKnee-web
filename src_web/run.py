import os
from flask import Flask, send_from_directory


app = Flask(__name__, static_folder='build')

@app.route('/deepknee', defaults={'path': ''})
@app.route('/deepknee/<path:path>')
def serve(path):
    if path != "" and os.path.exists("build/" + path):
        return send_from_directory('build', path)
    else:
        return send_from_directory('build', 'index.html')


if __name__ == '__main__':
    app.run(host='', use_reloader=False, debug=True, port=5001, threaded=True)
    # app.run(host='mipt-ml.oulu.fi', use_reloader=False, debug=True, port=5001, threaded=True)
