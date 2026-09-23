# QVAC Debug Detective AI

A local AI debugging assistant powered by Tether QVAC.

## Features

- Analyze JavaScript code and error messages
- Identify likely root causes
- Suggest practical fixes
- Explain why a fix works
- Provide a next debugging check
- Run AI inference locally with QVAC

## QVAC SDK

This project uses @qvac/sdk version 0.19.1.

QVAC functions used:

- loadModel()
- completion()
- unloadModel()

The application uses the QVAC Llama.cpp completion plugin.

## Run

npm install

npm start

Then open http://localhost:3000 in a browser.

## How It Works

1. Enter JavaScript code.
2. Enter the error message.
3. Enter the developer goal.
4. Click Analyze Bug.
5. QVAC generates a local debugging analysis.

## Local AI

The debugging request is processed using the local QVAC model rather than a cloud AI API.

## License

MIT License.

## Project Version

Version 1.0.0 - QVAC Debug Detective AI.
