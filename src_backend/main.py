import os
import argparse
import logging
import tempfile
import base64
from glob import glob
from io import BytesIO

import imageio
import numpy as np
import torch

import socketio
import eventlet
from flask import Flask

from oulukneeloc.detector import KneeLocalizer
from oulukneeloc.proposals import read_dicom, preprocess_xray
from ouludeepknee.own_codes.produce_gradcam import (
    KneeNetEnsemble, SNAPSHOTS_EXPS, SNAPSHOTS_KNEE_GRADING)
from ouludeepknee.dataset.xray_processor import process_file_or_image


logging.basicConfig()
logger = logging.getLogger('backend')
logger.setLevel(logging.DEBUG)


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--path_proj_root', required=False,
                   default='../')

    args = p.parse_args()
    args.path_proj_root = os.path.abspath(args.path_proj_root)
    return args


config = parse_args()


class KneeWrapper(object):
    def __init__(self):
        self._kneeloc = KneeLocalizer()

        nets_snapshots_names = []
        for snp in SNAPSHOTS_EXPS:
            nets_snapshots_names.extend(
                glob(os.path.join(config.path_folds, snp, '*.pth')))
        self._deepknee = KneeNetEnsemble(
            snapshots_paths=nets_snapshots_names,
            mean_std_path=os.path.join(SNAPSHOTS_KNEE_GRADING, 'mean_std.npy'))
        del nets_snapshots_names

    def run(self, path_raw, path_crop, path_inf):
        # Find all DICOM files in the provided path
        fnames = glob(os.path.join(path_raw, '*'))
        fnames = [os.path.basename(e) for e in fnames]
        fname = fnames[0]

        # Read and preprocess DICOM
        tmp = read_dicom(fname)
        if tmp is None:
            logger.error('Error reading DICOM')
            return False
        if len(tmp) != 2:
            logger.error('Invalid results of DICOM reading')
            return False
        img, spacing = tmp
        img = preprocess_xray(img)

        # Knee localization
        det_l, det_r = self._kneeloc.predict(fileobj=img, spacing=spacing)
        det_both = det_l + det_r
        logger.debug('KneeLocalizer results:\n{}, {}'
                     .format(repr(det_l), repr(det_r)))

        # Image cropping
        knee_l, knee_r = process_file_or_image(
            image=None, spacing=spacing,
            save_dir=path_crop, bbox=det_both, gradeL=5, gradeR=5,
            sizemm=140, pad=300, save_vis=True)

        # Knee grading
        self._deepknee.predict_save(fileobj_in=knee_l, nbits=16,
                                    fname_suffix='0',
                                    path_dir_out=path_inf)
        self._deepknee.predict_save(fileobj_in=knee_r, nbits=16,
                                    fname_suffix='1',
                                    path_dir_out=path_inf)


knee_wrapper = KneeWrapper()


def _png_to_web_base64(fn, fliplr=False):
    web_image_prefix = 'data:image/png;base64,'

    if fliplr:
        image = imageio.imread(fn)
        image = np.fliplr(image)
        tmp_file = BytesIO()
        imageio.imwrite(tmp_file, image, format='png')
        tmp_file.seek(0)
        tmp = tmp_file.read()
    else:
        with open(fn, 'rb') as f:
            tmp = f.read()

    tmp = base64.b64encode(tmp).decode('ascii')
    return web_image_prefix + tmp


class SIONamespace(socketio.Namespace):
    def on_connect(self, sid, environ):
        logger.info('Connected: {}'.format(sid))

    def on_dicom_submission(self, sid, data):
        # logger.debug('Received message: {}'.format(data))

        global knee_wrapper

        if True:
            with tempfile.TemporaryDirectory() as tmp_dir:
                # Create subfolders to store intermediate results
                path_raw = os.path.join(tmp_dir, '00_raw')
                path_crop = os.path.join(tmp_dir, '01_crop')
                path_inf = os.path.join(tmp_dir, '02_inf')

                for p in (path_raw, path_crop, path_inf):
                    os.makedirs(p)

                # Receive and decode DICOM image
                fname_dicom = os.path.join(path_raw, 'image.dicom')
                with open(fname_dicom, 'wb') as f:
                    # Remove the web-content prefix
                    tmp = data['file_blob'].split(',', 1)[1]
                    f.write(base64.b64decode(tmp))

                # Run knee localization and grading
                knee_wrapper.run(
                    path_raw=path_raw,
                    path_crop=path_crop,
                    path_inf=path_inf
                )

                # Find the files with the results
                paths_results_raw = list(sorted(
                    glob(os.path.join(path_crop, '**', '*.png'))))
                paths_results_heatmap = list(sorted(
                    glob(os.path.join(path_inf, 'heatmap_*.png'))))
                paths_results_prob = list(sorted(
                    glob(os.path.join(path_inf, 'prob_*.png'))))

                # Pack the results into JSON-message
                # TODO: implement image_src acquisition
                # "image_src": _png_to_web_base64(paths_results_heatmap[0]),
                ret = {
                    "image_1st_raw": _png_to_web_base64(paths_results_raw[0], fliplr=True),
                    "image_2nd_raw": _png_to_web_base64(paths_results_raw[1]),
                    "image_1st_heatmap": _png_to_web_base64(paths_results_heatmap[0], fliplr=True),
                    "image_2nd_heatmap": _png_to_web_base64(paths_results_heatmap[1]),
                    "special_1st": _png_to_web_base64(paths_results_prob[0]),
                    "special_2nd": _png_to_web_base64(paths_results_prob[1])
                }

        # path_debug = '/Users/egor/Desktop/Screen Shot 2018-09-01 at 19.59.40.png'
        # ret = json.dumps(
        #     {"image_src": _png_to_web_base64(path_debug),
        #      "image_first": _png_to_web_base64(path_debug),
        #      "image_second": _png_to_web_base64(path_debug),
        #      "special_first": _png_to_web_base64(path_debug),
        #      "special_second": _png_to_web_base64(path_debug)}
        # )

        # Send out the results
        # logger.debug('Returning: {}'.format(ret))
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
