import os
import argparse
import subprocess
import json
import logging
import tempfile
import base64

import socketio
import eventlet
from flask import Flask


logging.basicConfig()
logger = logging.getLogger('backend')
logger.setLevel(logging.DEBUG)


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--path_proj_root', required=False,
                   default='../')
    p.add_argument('--path_logs', required=False,
                   default='../logs')
    p.add_argument('--debug', required=False, default=False,
                   action='store_true')

    args = p.parse_args()
    args.path_data_root = os.path.abspath(args.path_data_root)
    args.path_logs = os.path.abspath(args.path_logs)
    return args


config = parse_args()


class KneeLocalizerWrapper(object):
    def __init__(self, path_root, fname_script='detector.py'):
        self.path_root = path_root
        self.fname_script = fname_script

    def run(self, path_input, path_file_output):
        ret = subprocess.run((
            'conda activate knee_localizer'
            ' ; '
            'python'
            f' {os.path.join(self.path_root, self.fname_script)}'
            f' --path_input {os.path.abspath(path_input)}'
            f' --fname_output {os.path.abspath(path_file_output)}'
        ), shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        if ret.returncode != 0:
            msg = ("KneeLocalizer execution failed with error: ",
                   ret.stderr)
            logger.error(msg)
            return False, None
        return True, result


module_kneelocalizer = KneeLocalizerWrapper(
    path_root=os.path.join(config.path_project_root, 'src_kneelocalizer')
)


class DeepKneeWrapper(object):
    def __init__(self, path_root,
                 path_script_0='Dataset/crop_rois_your_dataset.py',
                 path_script_1='inference_own/predict.py'):
        self.path_root = path_root
        self.path_script_0 = path_script_0
        self.path_script_1 = path_script_1

    def run(self, path_dicom_input, path_file_loc,
            path_crop, path_inf):
        ret = subprocess.run((
            'conda activate deep_knee'
            ' ; '
            'python'
            f' {os.path.join(self.path_root, self.path_script_0)}'
            f' --data_dir {os.path.abspath(path_dicom_input)}'
            f' --save_dir {os.path.abspath(path_crop)}'
            f' --detections {os.path.abspath(path_file_loc)}'
            ' ; '
            'python'
            f' {os.path.join(self.path_root, self.path_script_1)}'
            f' --dataset {os.path.abspath(path_crop)}'
            f' --save_results {os.path.abspath(path_inf)}'
        ), shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        if ret.returncode != 0:
            msg = ("DeepKnee execution failed with error: ",
                   ret.stderr)
            logger.error(msg)
            return False, None
        return True, result


module_deepknee = DeepKneeWrapper(
    path_root=os.path.join(config.path_project_root, 'src_deepknee')
)


class SIONamespace(socketio.Namespace):
    def on_connect(self, sid, environ):
        logger.info('Connected: {}'.format(sid))

    def on_dicom_submission(self, sid, data):
        logger.debug('Received message: {}'.format(data))

        global module_kneelocalizer
        global module_deepknee

        with tempfile.TemporaryDirectory() as tmp_dir:
            # Create subfolders to store intermediate results
            path_raw = os.path.join(tmp_dir, '00_raw')
            path_loc = os.path.join(tmp_dir, '01_loc')
            path_crop = os.path.join(tmp_dir, '02_crop')
            path_inf = os.path.join(tmp_dir, '03_inf')

            for p in (path_raw, path_loc, path_crop, path_inf):
                os.makedirs(p)

            # Receive and decode DICOM image
            data_json = json.loads(data)
            fname_dicom = os.path.join(path_raw, 'image.dicom')
            with open(fname_dicom, 'wb') as f:
                tmp = base64.b64decode(data_json['file_blob']).decode('utf-8')
                f.write(tmp)

            # Run knee localization
            path_file_loc = os.path.join(path_loc, 'detection_results.txt')
            module_kneelocalizer.run(
                path_input=path_raw,
                path_file_output=path_file_loc
            )

            module_deepknee.run(
                path_dicom_input=path_raw,
                path_file_loc=path_file_loc,
                path_crop=path_crop,
                path_inf=path_inf
            )

            ret = json.dumps(
                {"image_src": "aaa",
                 "image_first": "bbb",
                 "image_second": "ccc",
                 "special_first": "ddd",
                 "special_second": "eee"}
            )

        logger.debug('Returning: {}'.format(ret))
        self.emit('dicom_processing', ret)

    def on_disconnect(self, sid):
        logger.info('Disconnected: {}'.format(sid))


sio = socketio.Server()
app = Flask(__name__)

sio.register_namespace(SIONamespace())

# Wrap Flask application with socketio's middleware
app = socketio.Middleware(sio, app)

# Deploy as an eventlet WSGI server
eventlet.wsgi.server(eventlet.listen(('', 8000)), app)
