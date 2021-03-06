import os
from _datetime import datetime
import argparse
import logging
import tempfile
import base64
from glob import glob
from io import BytesIO
import matplotlib
matplotlib.use('Agg')
import imageio
import numpy as np

import socketio
import eventlet
from flask import Flask, send_from_directory

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
    p.add_argument('--path_proj_root', required=False, default='../')

    args = p.parse_args()
    args.path_proj_root = os.path.abspath(args.path_proj_root)
    return args


config = parse_args()


class KneeWrapper(object):
    def __init__(self):
        self.kneeloc = KneeLocalizer()

        nets_snapshots_names = []
        for snp in SNAPSHOTS_EXPS:
            nets_snapshots_names.extend(
                glob(os.path.join(SNAPSHOTS_KNEE_GRADING, snp, '*.pth')))
        self.deepknee = KneeNetEnsemble(
            snapshots_paths=nets_snapshots_names,
            mean_std_path=os.path.join(SNAPSHOTS_KNEE_GRADING, 'mean_std.npy'))

    def run(self, path_raw, path_crop, path_inf):
        # Find the first DICOM file in the provided path
        fname = glob(os.path.join(path_raw, '*'))[0]

        # Read and preprocess DICOM
        tmp = read_dicom(fname)
        if tmp is None:
            logger.error('Error reading DICOM')
            return False
        if len(tmp) != 2:
            logger.error('Invalid results of DICOM reading')
            return False
        img, spacing = tmp
        img_prep = preprocess_xray(img)
        logger.info('DICOM read')

        # Knee localization
        det_l, det_r = self.kneeloc.predict(fileobj=img_prep,
                                            spacing=spacing)
        det_both = det_l + det_r
        logger.info('Localization finished')

        # Image cropping
        knee_l, knee_r = process_file_or_image(
            image=img.astype(np.float64), spacing=spacing,
            save_dir=path_crop, bbox=det_both, gradeL=5, gradeR=5,
            save_vis=True)
        logger.info('Cropping finished')

        # Knee grading
        self.deepknee.predict_save(fileobj_in=knee_l, nbits=16,
                                   fname_suffix='0',
                                   path_dir_out=path_inf,
                                   fliplr=True)
        logger.info('Grading L finished')
        self.deepknee.predict_save(fileobj_in=knee_r, nbits=16,
                                   fname_suffix='1',
                                   path_dir_out=path_inf)
        logger.info('Grading R finished')


knee_wrapper = KneeWrapper()


def _png_to_web_base64(fn, fliplr=False, crop_to=None):
    """Coneverts an image into to base64.

    Image must be stored in the file.

    Parameters
    ----------
    fn : str
        filename
    fliplr : bool
        Whether to flip the image.
    crop_to : tuple or None
        Crop to (H_new, W_new)
    """
    web_image_prefix = 'data:image/png;base64,'

    image = imageio.imread(fn)
    if fliplr:
        image = np.fliplr(image)
    tmp_file = BytesIO()

    if crop_to is not None:
        assert len(crop_to) == 2
        h, w = image.shape
        image = image[h//2-crop_to[0]//2:h//2+crop_to[0]//2,
                      w//2-crop_to[1]//2:w//2+crop_to[1]//2]

    imageio.imwrite(tmp_file, image, format='png')
    tmp_file.seek(0)
    tmp = tmp_file.read()

    tmp = base64.b64encode(tmp).decode('ascii')
    return web_image_prefix + tmp


app = Flask(__name__, static_folder='build')
sio = socketio.Server(ping_timeout=120, ping_interval=120)


@app.route('/deepknee', defaults={'path': ''})
@app.route('/deepknee/<path:path>')
def serve(path):
    if path != "" and os.path.exists("build/" + path):
        return send_from_directory('build', path)
    else:
        return send_from_directory('build', 'index.html')


@sio.on('dicom_submission', namespace='/deepknee/backend')
def on_dicom_submission(sid, data):
    sio.emit('dicom_received', dict(), room=sid, namespace='/deepknee/backend')
    logger.info(f'Sent a message back to {sid}')
    sio.sleep(0)

    global knee_wrapper

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
            path_inf=path_inf)

        # Find the files with the results
        paths_results_raw = list(sorted(
            glob(os.path.join(path_crop, '**', '*.png'))))
        paths_results_heatmap = list(sorted(
            glob(os.path.join(path_inf, 'heatmap_*.png'))))
        paths_results_prob = list(sorted(
            glob(os.path.join(path_inf, 'prob_*.png'))))

        try:
            # Pack the results into JSON-message
            # TODO: implement image_src acquisition
            ret = {
                "image_1st_raw": _png_to_web_base64(paths_results_raw[0], fliplr=True, crop_to=(300, 300)),
                "image_2nd_raw": _png_to_web_base64(paths_results_raw[1], crop_to=(300, 300)),
                "image_1st_heatmap": _png_to_web_base64(paths_results_heatmap[0], fliplr=True),
                "image_2nd_heatmap": _png_to_web_base64(paths_results_heatmap[1]),
                "special_1st": _png_to_web_base64(paths_results_prob[0]),
                "special_2nd": _png_to_web_base64(paths_results_prob[1])
            }
        except BaseException as e:
            logger.error('Error sending the results:\n{}'.format(repr(e)))
            ret = {
                "image_1st_raw": None,
                "image_2nd_raw": None,
                "image_1st_heatmap": None,
                "image_2nd_heatmap": None,
                "special_1st": None,
                "special_2nd": None
            }

    # Send out the results
    sio.emit('dicom_processed', ret, room=sid, namespace='/deepknee/backend')


# Wrap Flask application with socketio's middleware
app = socketio.Middleware(sio, app, socketio_path='/deepknee/backend/socket.io')

# Deploy as an eventlet WSGI server
eventlet.wsgi.server(eventlet.listen(('', 5000)), app)
