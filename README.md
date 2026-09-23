# QVAC EmailFixer AI

A local AI email rewriting tool powered by Tether QVAC.

QVAC EmailFixer AI takes a rough email and rewrites it into a clearer, more polished message using on-device AI inference.

## Features

- Rewrite rough emails
- Professional, Friendly, Formal, and Concise styles
- Uses local QVAC AI inference
- No cloud AI API required
- Shows QVAC engine and model status
- Generation counter
- Simple browser-based interface

## QVAC Integration

This project uses the Tether QVAC JavaScript SDK.

QVAC functions used:

- `loadModel()`
- `completion()`
- `unloadModel()`

The application loads the QVAC Llama 3.2 1B model and uses QVAC completion to rewrite emails locally.

## Requirements

- Node.js
- npm
- Windows, macOS, or Linux
- Internet connection for the initial dependency/model setup

## Installation

Clone the repository:

```bash
git clone https://github.com/MelmarKun/qvac-debug-detective-ai.git
cd qvac-debug-detective-ai