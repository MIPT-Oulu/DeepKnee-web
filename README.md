Description
-----------

Webservice application for automatic Knee Localization and Osteoarthritis KL grading in posteroanterior knee X-ray images.

Installation
------------

0. Before going through the next steps, make sure to install `Conda`, `Node.js`;
1. Clone the repository:
```bash
git clone --recurse-submodules git@github.com:MIPT-Oulu/DeepKnee-web.git
cd DeepKnee-web
```
2. Configure the environment:
```bash
# Create the environment
cd src_backend
chmod u+x create_conda_env.sh
./create_conda_env.sh
source activate deep_knee_web
cd ..

# Install KneeLocalizer
cd src_kneelocalizer
pip install .
cd ..

# Install DeepKnee
# WIP
# cd src_deepknee
# cd ..

# Install the webserver dependencies
cd src_web
npm install
cd ..
```

Running
-------

To run the webservice:
```bash
# Start backend
cd src_backend; python main.py &

# Start web interface
# WIP
cd ../src_web; npm start &
```

License
-------

The provided code is freely available only for research purposes. Any other usages are to be discussed with the authors.

Authors
-------

Egor Panfilov, Research Unit of Medical Imaging, Physics and Technology, University of Oulu, Finland.
