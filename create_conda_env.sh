#!/bin/bash

conda create -y -n deep_knee_web python=3.6
source activate deep_knee_web

conda install -y -n deep_knee_web numpy opencv scipy pyyaml cython matplotlib scikit-learn
conda install -y -n deep_knee_web pytorch==0.3.1 torchvision -c soumith
conda install -y -n deep_knee_web git-lfs -c conda-forge

pip install pip -U
pip install pydicom
pip install tqdm
pip install pillow imageio
pip install termcolor
pip install visdom
pip install jupyterlab

pip install python-socketio
pip install eventlet
pip install flask
