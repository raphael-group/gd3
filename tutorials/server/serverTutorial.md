This tutorial will go through the steps necessary to set up a simple, local Python webserver. Running a local webserver is necessary for D3 and GD3 functionality such as file loading.

## Installation
### Getting Python
#### Mac OSX
Python is installed by default. To see what version you have, open Terminal and enter `python -V`.

#### Linux
Python is installed by default for most distributions of Linux. To check if it is installed, type `python --version` into the terminal. If there is an error:

1. Download Python manually from http://www.python.org/download/
2. Use a terminal application such as `apt-get`. An Ubuntu example for installing Python 2.7 is:
```
sudo add-apt-repository ppa:fkrull/deadsnakes
sudo apt-get update
sudo apt-get install python2.7
```

#### Windows
To see if python is installed -- and if so, what version you have -- type `python -V`. If there is an error, download and install Python from http://www.python.org/download/

## Use
To start a Python webserver, type:
```
python -m SimpleHTTPServer 8888 &
```

Or, if you have Python 3+:
```
python -m http.server 8888 &
```