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

async function generateQuiz(notes, difficulty, questions) {
  const total = Number(questions) || 3;
  const generatedQuestions = [];

  for (let i = 1; i <= total; i++) {
    const prompt = `
Create ONE multiple-choice question from the study notes.

Difficulty: ${difficulty}

Requirements:
- Write exactly one question.
- Give exactly four choices.
- Use this format:

QUESTION ${i}
Question text

A. choice
B. choice
C. choice
D. choice

Do not provide the answer.

Study notes:
${notes}
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

    generatedQuestions.push(output.trim());
  }

  generationCount++;

  return generatedQuestions.join(
    "\n\n------------------------------\n\n"
  );
}

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>QVAC StudyForge AI</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #07111f;
  color: #e8f0f8;
}

.container {
  width: min(1100px, 92%);
  margin: auto;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0;
}

.brand {
  font-size: 22px;
  font-weight: 800;
}

.brand span {
  color: #66e3a5;
}

.status {
  border: 1px solid #66e3a5;
  color: #66e3a5;
  padding: 8px 13px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: bold;
}

.hero {
  padding: 45px 0 35px;
}

.eyebrow {
  color: #66e3a5;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 2px;
}

h1 {
  font-size: clamp(38px, 6vw, 68px);
  line-height: 1;
  margin: 15px 0;
}

.hero p {
  color: #9fb0c3;
  max-width: 650px;
  font-size: 17px;
  line-height: 1.6;
}

.grid {
  display: grid;
  grid-template-columns: 1.4fr .8fr;
  gap: 20px;
}

.card {
  background: #0d1a2b;
  border: 1px solid #1b3048;
  border-radius: 18px;
  padding: 24px;
}

.card h2 {
  margin-top: 0;
  font-size: 20px;
}

label {
  display: block;
  margin: 18px 0 8px;
  color: #aab8c8;
  font-size: 13px;
}

textarea,
select {
  width: 100%;
  border: 1px solid #29415b;
  background: #081522;
  color: white;
  border-radius: 12px;
  padding: 14px;
  font: inherit;
}

textarea {
  min-height: 250px;
  resize: vertical;
}

textarea:focus,
select:focus {
  outline: none;
  border-color: #66e3a5;
}

.controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

button {
  width: 100%;
  margin-top: 20px;
  padding: 15px;
  border: 0;
  border-radius: 12px;
  background: #66e3a5;
  color: #06120c;
  font-weight: 800;
  cursor: pointer;
}

button:hover {
  filter: brightness(1.08);
}

button:disabled {
  opacity: .5;
  cursor: wait;
}

.engine-row {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #1b3048;
}

.engine-row:last-child {
  border-bottom: 0;
}

.muted {
  color: #91a2b5;
}

.green {
  color: #66e3a5;
}

.output {
  grid-column: 1 / -1;
}

#result {
  margin-top: 18px;
}

.quiz-card {
  background: #081522;
  border: 1px solid #203a54;
  border-radius: 16px;
  padding: 20px;
  margin-top: 16px;
}

.question-number {
  color: #66e3a5;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 1px;
}

.question-text {
  font-size: 18px;
  font-weight: 700;
  margin: 10px 0 16px;
  line-height: 1.5;
}

.choice {
  background: #0d1f31;
  border: 1px solid #1c344b;
  padding: 11px 13px;
  border-radius: 10px;
  margin: 7px 0;
}

.answer-box {
  margin-top: 16px;
  padding: 12px;
  border-radius: 10px;
  background: #102b23;
  color: #66e3a5;
}

.explanation-box {
  margin-top: 10px;
  padding: 12px;
  border-radius: 10px;
  background: #101e2d;
  color: #b8c7d7;
  line-height: 1.5;
}

.empty {
  color: #91a2b5;
  line-height: 1.6;
}

.footer {
  text-align: center;
  padding: 40px 0;
  color: #6f8194;
  font-size: 13px;
}

@media(max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .output {
    grid-column: auto;
  }

  .controls {
    grid-template-columns: 1fr;
  }
}
</style>
</head>

<body>

<div class="container">

  <div class="topbar">
    <div class="brand">QVAC <span>StudyForge</span></div>
    <div class="status">ON-DEVICE AI</div>
  </div>

  <section class="hero">
    <div class="eyebrow">LOCAL AI STUDY TOOL</div>

    <h1>Turn your notes into a practice exam.</h1>

    <p>
      Paste your lesson notes, choose a difficulty level and generate
      a practice exam using AI running locally on your device.
    </p>
  </section>

  <div class="grid">

    <section class="card">

      <h2>Build your practice exam</h2>

      <label for="notes">Study notes</label>

      <textarea
        id="notes"
        placeholder="Paste your lesson or study notes here..."
      ></textarea>

      <div class="controls">

        <div>
          <label for="difficulty">Difficulty</label>

          <select id="difficulty">
            <option>Easy</option>
            <option selected>Medium</option>
            <option>Hard</option>
          </select>
        </div>

        <div>
          <label for="questions">Questions</label>

          <select id="questions">
            <option value="3" selected>3 Questions</option>
            <option value="5">5 Questions</option>
          </select>
        </div>

      </div>

      <button id="generate">
        Generate Practice Exam
      </button>

    </section>

    <aside class="card">

      <h2>QVAC Engine</h2>

      <div class="engine-row">
        <span class="muted">AI Engine</span>
        <strong>QVAC SDK</strong>
      </div>

      <div class="engine-row">
        <span class="muted">Model</span>
        <strong>Llama 3.2 1B</strong>
      </div>

      <div class="engine-row">
        <span class="muted">Inference</span>
        <strong class="green">Local / On-Device</strong>
      </div>

      <div class="engine-row">
        <span class="muted">Generations</span>
        <strong id="generationCount">0</strong>
      </div>

    </aside>

    <section class="card output">

      <h2>Practice Exam</h2>

      <div id="result">
        <div class="empty">
          Your generated questions will appear here.
        </div>
      </div>

    </section>

  </div>

  <div class="footer">
    QVAC StudyForge AI | Powered by Tether QVAC SDK
  </div>

</div>

<script>

const generateButton = document.getElementById("generate");
const notesInput = document.getElementById("notes");
const difficultyInput = document.getElementById("difficulty");
const questionsInput = document.getElementById("questions");
const result = document.getElementById("result");
const generationCount = document.getElementById("generationCount");

generateButton.addEventListener("click", async () => {

  const notes = notesInput.value.trim();

  if (!notes) {
    result.innerHTML =
      '<div class="empty">Please paste your study notes first.</div>';
    return;
  }

  generateButton.disabled = true;
  generateButton.textContent = "Generating with QVAC...";

  result.innerHTML =
    '<div class="empty">QVAC is generating your practice exam locally...</div>';

  try {

    const response = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        notes,
        difficulty: difficultyInput.value,
        questions: questionsInput.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Generation failed");
    }

    const sections = data.result
      .split(/(?=QUESTION\\s+\\d+)/i)
      .map(x => x.trim())
      .filter(Boolean);

    result.innerHTML = sections.map((section, index) => {

      const lines = section
        .split("\\n")
        .map(x => x.trim())
        .filter(Boolean);

      const title = lines[0] || "QUESTION " + (index + 1);

      const questionText = lines
        .filter(x => !/^[ABCD]\\./i.test(x))
        .slice(1)
        .join(" ");

      const choices = lines
        .filter(x => /^[ABCD]\\./i.test(x))
        .map(x =>
          x.replace(
            /^([ABCD])\\.\\s*/i,
            "<b>$1.</b> "
          )
        );

      return \`
        <div class="quiz-card">

          <div class="question-number">
            \${title}
          </div>

          <div class="question-text">
            \${questionText}
          </div>

          <div>
            \${choices.map(choice =>
              \`<div class="choice">\${choice}</div>\`
            ).join("")}
          </div>

        </div>
      \`;

    }).join("");

    const status = await fetch("/status");
    const statusData = await status.json();

    generationCount.textContent = statusData.generations;

  } catch (error) {

    result.innerHTML =
      '<div class="empty">Error: ' +
      error.message +
      '</div>';

  } finally {

    generateButton.disabled = false;
    generateButton.textContent =
      "Generate Practice Exam";

  }

});

</script>

</body>
</html>
`;

const server = http.createServer(async (req, res) => {

  if (req.method === "GET" && req.url === "/") {

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    res.end(html);

    return;
  }

  if (req.method === "GET" && req.url === "/status") {

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
      ready: modelId !== null,
      generations: generationCount
    }));

    return;
  }

  if (req.method === "POST" && req.url === "/generate") {

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {

      try {

        const data = JSON.parse(body);

        const result = await generateQuiz(
          data.notes,
          data.difficulty,
          data.questions
        );

        res.writeHead(200, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          result
        }));

      } catch (error) {

        console.error(error);

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

  console.log("Starting QVAC StudyForge AI...");
  console.log("Loading QVAC local model...");

  modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0
  });

  console.log("QVAC model loaded successfully.");
  console.log("Model ID:", modelId);

  server.listen(PORT, () => {

    console.log("");
    console.log("QVAC StudyForge AI is running.");
    console.log("Open http://localhost:" + PORT);
    console.log("Inference mode: ON-DEVICE");

  });

}

async function shutdown() {

  if (modelId) {
    await unloadModel({
      modelId
    });
  }

  process.exit(0);

}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch(error => {

  console.error("Failed to start StudyForge:");
  console.error(error);

  process.exit(1);

});
