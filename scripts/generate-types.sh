#!/usr/bin/env bash
set -e

nargo compile --workspace --output-format=json    # JSON’ı target/’a yazar

pnpm noir-codegen ./examples/instagram_example/target/*.json \
  --out-dir ./src/__generated__

