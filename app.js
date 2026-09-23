import http from "http";
import {
  loadModel,
  LLAMA_3_2_1B_INST_Q4_0,
  completion,
  unloadModel
} from "@qvac/sdk";

const PORT = 3000;

let modelId = null;
let generationCount = 0;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QVAC EmailFixer</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #07111f;
  color: #eaf2ff;
}

.container {
  width: min(1050px, 92%);
  margin: auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 0;
}

.logo {
  font-size: 21px;
  font-weight: 800;
}

.logo span {
  color: #62e0a7;
}

.badge {
  border: 1px solid #62e0a7;
  color: #62e0a7;
  border-radius: 30px;
  padding: 8px 14px;
  font-size: 11px;
}

.hero {
  padding: 45px 0 30px;
}

.eyebrow {
  color: #62e0a7;
  font-size: 12px;
  letter-spacing: 3px;
  font-weight: bold;
}

h1 {
  font-size: clamp(42px, 7vw, 72px);
  line-height: .98;
  margin: 16px 0;
  max-width: 850px;
}

.hero p {
  color: #9fb0c7;
  max-width: 650px;
  line-height: 1.6;
}

.grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 18px;
}

.card {
  background: #0d1b2d;
  border: 1px solid #1d3854;
  border-radius: 16px;
  padding: 20px;
}

.card h2 {
  margin-top: 0;
  font-size: 17px;
}

label {
  display: block;
  color: #9fb0c7;
  font-size: 12px;
  margin: 18px 0 8px;
}

textarea,
select {
  width: 100%;
  border: 1px solid #294763;
  background: #091625;
  color: #eaf2ff;
  border-radius: 10px;
  padding: 14px;
  font-size: 14px;
}

textarea {
  min-height: 250px;
  resize: vertical;
}

select {
  height: 45px;
}

button {
  width: 100%;
  margin-top: 18px;
  border: 0;
  border-radius: 10px;
  padding: 14px;
  background: #62e0a7;
  color: #061018;
  font-weight: 800;
  cursor: pointer;
}

button:hover {
  opacity: .9;
}

.status-row {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #1d3854;
  font-size: 14px;
}

.status-row span:first-child {
  color: #8ea1b8;
}

.local {
  color: #62e0a7;
}

.output {
  margin-top: 18px;
}

.result {
  white-space: pre-wrap;
  line-height: 1.7;
  color: #eaf2ff;
  background: #091625;
  border: 1px solid #294763;
  border-radius: 10px;
  padding: 18px;
  min-height: 180px;
}

footer {
  text-align: center;
  color: #657890;
  padding: 40px 0;
  font-size: 12px;
}

@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
</head>

<body>

<div class="container">

<header>
  <div class="logo">QVAC <span>EmailFixer</span></div>
  <div class="badge">ON-DEVICE AI</div>
</header>

<section class="hero">
  <div class="eyebrow">LOCAL AI WRITING TOOL</div>
  <h1>Turn rough emails into polished messages.</h1>
  <p>
    Paste an email, choose a writing style, and let QVAC rewrite it locally
    using on-device AI.
  </p>
</section>

<div class="grid">

<div class="card">
  <h2>Fix your email</h2>

  <label for="email">Email text</label>
  <textarea id="email" placeholder="Paste your email here..."></textarea>

  <label for="style">Writing style</label>
  <select id="style">
    <option>Professional</option>
    <option>Friendly</option>
    <option>Formal</option>
    <option>Concise</option>
  </select>

  <button onclick="fixEmail()">Fix My Email</button>
</div>

<div class="card">
  <h2>QVAC Engine</h2>

  <div class="status-row">
    <span>AI Engine</span>
    <strong>QVAC SDK</strong>
  </div>

  <div class="status-row">
    <span>Model</span>
    <strong>Llama 3.2 1B</strong>
  </div>

  <div class="status-row">
    <span>Inference</span>
    <strong class="local">Local / On-Device</strong>
  </div>

  <div class="status-row">
    <span>Generations</span>
    <strong id="generationCount">0</strong>
  </div>
</div>

</div>

<div class="card output">
  <h2>Improved Email</h2>
  <div id="result" class="result">
    Your improved email will appear here.
  </div>
</div>

<footer>
  QVAC EmailFixer AI | Powered by Tether QVAC SDK
</footer>

</div>

<script>
async function fixEmail() {
  const email = document.getElementById("email").value.trim();
  const style = document.getElementById("style").value;
  const result = document.getElementById("result");

  if (!email) {
    result.textContent = "Please paste an email first.";
    return;
  }

  result.textContent = "QVAC is rewriting your email locally...";

  try {
    const response = await fetch("/fix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        style
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Generation failed.");
    }

    result.textContent = data.output;
    document.getElementById("generationCount").textContent =
      data.generationCount;
  } catch (error) {
    result.textContent = "Error: " + error.message;
  }
}
</script>

</body>
</html>`;

async function fixEmail(email, style) {
  const prompt = `
Rewrite the email below.

Writing style: ${style}

STRICT RULES:
- Keep the original meaning.
- Improve grammar, clarity, and professionalism.
- Do not invent facts.
- Do not add information that is not in the original email.
- Return only the rewritten email.
- Do not explain your changes.
- Do not add markdown.

Original email:
${email}
`;

  const result = completion({
    modelId,
    history: [
      {
        role: "user",
        content: prompt
      }
    ],
    stream: true
  });

  let output = "";

  for await (const token of result.tokenStream) {
    output += token;
  }

  generationCount++;

  return output.trim();
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    res.end(html);
    return;
  }

  if (req.method === "POST" && req.url === "/fix") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);

        if (!data.email || !data.email.trim()) {
          throw new Error("Email text is required.");
        }

        const output = await fixEmail(
          data.email,
          data.style || "Professional"
        );

        res.writeHead(200, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          output,
          generationCount
        }));

      } catch (error) {
        res.writeHead(500, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          error: error.message
        }));
      }
    });

    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

async function start() {
  console.log("Starting QVAC EmailFixer AI...");
  console.log("Loading QVAC local model...");

  modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0
  });

  console.log("QVAC model loaded successfully.");
  console.log("Model ID:", modelId);

  server.listen(PORT, () => {
    console.log("");
    console.log("QVAC EmailFixer AI is running.");
    console.log("Open http://localhost:" + PORT);
    console.log("Inference mode: ON-DEVICE");
  });
}

process.on("SIGINT", async () => {
  if (modelId) {
    await unloadModel({ modelId });
  }

  process.exit(0);
});

start();