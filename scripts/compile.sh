#!/bin/sh

BIN=./node_modules/.bin
BABEL=${BIN}/babel

SOURCES=(
  react-file-tree
  file-tree-git
  file-tree-client
  file-tree-common
  file-tree-server
  file-tree-client-transport-socket.io
  file-tree-server-transport-socket.io
  file-tree-client-transport-electron
  file-tree-server-transport-electron
  file-tree-example-electron
)

for dir in ${SOURCES[@]}; do
  ${BABEL} packages/${dir}/src -d packages/${dir}/lib
done
