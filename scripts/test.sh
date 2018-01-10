#! /bin/bash

output=$(nc -z localhost 8545; echo $?)
[ $output -eq "0" ] && ganache_running=true
if [ ! $ganache_running ]; then
  echo "Starting our own ganache node instance"
  # create 100 accounts for load tests
  node ./node_modules/ganache-cli/build/cli.node.js -a 100 -i 3 \
  > /dev/null &
  ganache_pid=$!
fi
 node_modules/.bin/solidity-coverage
if [ ! $ganache_running ]; then
  kill -9 $ganache_pid
fi