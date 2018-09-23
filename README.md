# DeepKnee-web

## Description

Web-service application for automatic Knee Localization and Osteoarthritis KL grading in PA X-ray images.

![example](example.png)

## Installation

0. Before going through the next steps, make sure to install `Conda`, `Node.js`;
1. Clone the repository:

```bash
git clone --recurse-submodules git@github.com:MIPT-Oulu/DeepKnee-web.git
cd DeepKnee-web
```
2. Configure the environment:

```bash
# Create the environment
chmod u+x create_conda_env.sh
./create_conda_env.sh
source activate deep_knee_web

# Install KneeLocalizer
cd src_kneelocalizer
pip install .
cd ..

# Install DeepKnee
cd src_deepknee
pip install .
cd ..

source deactivate
```

## Running

To run the app:
```bash
sh run_service.sh
```

This script will automatically install the `Node.js` packages and will build an optimized production-ready React app. Additionally, the scripts launches the webservice which is available under `127.0.0.1:5000/deepknee`.

## License

The provided code is freely available only for academic research.
Any other usage is strictly prohibited and the code authors need to be contacted separately.

## Authors

* Design & Development: Egor Panfilov, Aleksei Tiulpin
* Project leader: Simo Saarakkala

Research Unit of Medical Imaging, Physics and Technology,

(c) 2018, University of Oulu, Finland.
