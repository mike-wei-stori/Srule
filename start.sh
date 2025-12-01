#!/bin/sh

# Start Java Backend in background
java -jar /app/app.jar &

# Start Nginx in foreground
nginx -g "daemon off;"
