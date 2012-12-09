#!/bin/sh

export DYLD_LIBRARY_PATH=/usr/local/oracle/instantclient_10_2
export LD_LIBRARY_PATH=/usr/local/oracle/instantclient_10_2
export ORACLE_HOME=/usr/local/oracle/instantclient_10_2
export VERSIONER_PYTHON_PREFER_32_BIT="yes"
source /Users/austin/devProjects/python/venv/bin/activate

python $1