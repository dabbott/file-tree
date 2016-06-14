#!/bin/sh

BIN=./node_modules/.bin
BABEL=${BIN}/babel

SOURCES=(file-tree-client file-tree-common file-tree-server react-file-tree)

for dir in ${SOURCES[@]}; do
  ${BABEL} packages/${dir}/src -d packages/${dir}/lib
done
