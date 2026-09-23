import {
  loadModel,
  LLAMA_3_2_1B_INST_Q4_0,
  completion,
  unloadModel
} from "@qvac/sdk";

import http from "http";

const PORT = 3000;

let modelId = null;

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QVAC Debug Detective AI</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f4f7fb;
      color: #1f2937;
    }

    header {
      background: #111827;
      color: white;
      padding: 28px 20px;
      text-align: center;
    }

    header h1 {
      margin: 0 0 8px;
      font-size: 32px;
    }

    header p {
      margin: 0;
      color: #d1d5db;
    }

    .badge {
      display: inline-block;
      margin-top: 12px;
      padding: 6px 12px;
      border-radius: 20px;
      background: #065f46;
      color: #d1fae5;
      font-size: 13px;
      font-weight: bold;
    }

    main {
      max-width: 1000px;
      margin: 30px auto;
      padding: 0 20px;
    }

    .card {
      background: white;
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
    }

    label {
      display: block;
      font-weight: bold;
      margin-bottom: 8px;
    }

    textarea {
      width: 100%;
      min-height: 130px;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      resize: vertical;
      font-family: Consolas, monospace;
      font-size: 14px;
      margin-bottom: 18px;
    }

    #goal {
      min-height: 80px;
      font-family: Arial, sans-serif;
    }

    button {
      width: 100%;
      border: none;
      border-radius: 8px;
      padding: 14px;
      background: #2563eb;
      color: white;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
    }

    button:hover {
      background: #1d4ed8;
    }

    button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    #status {
      margin-top: 16px;
      font-weight: bold;
    }

    #result {
      white-space: pre-wrap;
      background: #111827;
      color: #e5e7eb;
      padding: 20px;
      border-radius: 10px;
      min-height: 100px;
      font-family: Consolas, monospace;
      line-height: 1.6;
    }

    .example {
      margin-top: 10px;
      color: #6b7280;
      font-size: 13px;
    }
  </style>
</head>

<body>

<header>
  <h1>QVAC Debug Detective AI</h1>
  <p>Local AI debugging assistant powered by Tether QVAC</p>
  <div class="badge">[ON-DEVICE AI]</div>
</header>

<main>

  <div class="card">
    <h2>Debug Your Code</h2>

    <label for="code">Code</label>
    <textarea id="code" placeholder="Paste your code here...">const users = data.users;
console.log(users.map(user => user.name));</textarea>

    <label for="error">Error Message</label>
    <textarea id="error" placeholder="Paste the error message here...">TypeError: Cannot read properties of undefined (reading 'map')</textarea>

    <label for="goal">Developer Goal</label>
    <textarea id="goal" placeholder="What are you trying to accomplish?">Display the names of all users.</textarea>

    <button id="analyzeButton" onclick="analyzeBug()">
      ?? Analyze Bug
    </button>

    <div id="status"></div>
  </div>

  <div class="card">
    <h2>AI Analysis</h2>
    <div id="result">Your QVAC debugging analysis will appear here.</div>
  </div>

</main>

<script>
async function analyzeBug() {
  const code = document.getElementById("code").value;
  const error = document.getElementById("error").value;
  const goal = document.getElementById("goal").value;

  const button = document.getElementById("analyzeButton");
  const status = document.getElementById("status");
  const result = document.getElementById("result");

  if (!code.trim() || !error.trim() || !goal.trim()) {
    status.textContent = "?? Please complete all three fields.";
    return;
  }

  button.disabled = true;
  status.textContent = "?? QVAC is analyzing your code locally...";
  result.textContent = "";

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code,
        error,
        goal
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Analysis failed.");
    }

    result.textContent = data.result;
    status.textContent = "? Analysis completed locally with QVAC.";
  } catch (error) {
    result.textContent = "? " + error.message;
    status.textContent = "? Analysis failed.";
  } finally {
    button.disabled = false;
  }
}
</script>

</body>
</html>
`;

async function analyzeWithQVAC(code, error, goal) {
  const prompt = `
You are QVAC Debug Detective, a local JavaScript debugging assistant.

Analyze this debugging case carefully.

CODE:
${code}

ERROR:
${error}

DEVELOPER GOAL:
${goal}

Important:
- Identify the direct cause of the reported error.
- Do not confuse an undefined value with an empty array.
- Use the exact error message as evidence.
- Suggest a practical fix.
- Explain why the fix works.
- Suggest one useful next check.

Return exactly these sections:

ROOT CAUSE:
EVIDENCE:
SUGGESTED FIX:
WHY IT WORKS:
NEXT CHECK:

Keep the answer concise and technically accurate.
`;

  const history = [
    {
      role: "user",
      content: prompt
    }
  ];

  const result = completion({
    modelId,
    history,
    stream: true
  });

  let output = "";

  for await (const token of result.tokenStream) {
    output += token;
  }

  return output;
}

const server = http.createServer(async (req, res) => {

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  if (req.method === "POST" && req.url === "/analyze") {

    try {
      let body = "";

      req.on("data", chunk => {
        body += chunk;
      });

      req.on("end", async () => {

        try {
          const data = JSON.parse(body);

          const result = await analyzeWithQVAC(
            data.code,
            data.error,
            data.goal
          );
          res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8"
          });

          res.end(JSON.stringify({ result }));

        } catch (error) {

          res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8"
          });

          res.end(JSON.stringify({
            error: error.message
          }));
        }
      });

    } catch (error) {

      res.writeHead(500, {
        "Content-Type": "application/json; charset=utf-8"
      });

      res.end(JSON.stringify({
        error: error.message
      }));
    }

    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

async function start() {

  console.log("QVAC Debug Detective AI");

  modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    onProgress: (progress) => {
      console.log("Loading:", progress);
    }
  });

  console.log("? QVAC model loaded!");
  console.log("");
  console.log("======================================");
  console.log("??? QVAC Debug Detective AI");
  console.log("======================================");

  server.listen(PORT, () => {
    console.log("");
    console.log("?? Local web app is running!");
    console.log("");
    console.log("Open this in your browser:");
    console.log("http://localhost:3000");
    console.log("");
  });
}

process.on("SIGINT", async () => {

  console.log("\\n?? Shutting down...");

  server.close();

  if (modelId) {
    await unloadModel({
      modelId
    });
  }

  process.exit(0);
});

start().catch(error => {
  console.error("? QVAC Error:", error);
  process.exit(1);
});

