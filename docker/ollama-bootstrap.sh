#!/bin/sh
set -eu

ollama serve &
pid=$!

until ollama list >/dev/null 2>&1; do
  sleep 2
done

ollama pull "${GENERATION_MODEL}"

wait "$pid"
