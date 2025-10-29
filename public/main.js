const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chat-form");
const promptEl = document.getElementById("prompt");
const faqEl = document.getElementById("faq");

function appendMessage({ role, text }) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  if (role === "assistant") {
    const img = document.createElement("img");
    img.src = "/logo.jpg";
    img.alt = "QB Tech Logo";
    avatar.appendChild(img);
  } else {
    const img = document.createElement("img");
    // Simple user silhouette icon (inline SVG as data URI)
    img.src = "data:image/svg+xml;utf8,"
      + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">'
        + '<circle cx="12" cy="8" r="4" fill="%230a84ff"/>'
        + '<path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" fill="%231ba6ff"/>'
        + '</svg>'
      );
    img.alt = "User";
    avatar.appendChild(img);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  if (role === "assistant") {
    bubble.innerHTML = sanitizeAssistant(text);
  } else {
    bubble.textContent = text;
  }

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage(text) {
  appendMessage({ role: "user", text });
  const aiWrap = { role: "assistant", text: "" };
  appendMessage(aiWrap);

  const bubbles = messagesEl.querySelectorAll(".msg .bubble");
  const lastBubble = bubbles[bubbles.length - 1];

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok || !response.body) {
      try {
        const errText = await response.text();
        lastBubble.textContent = errText || "Sorry, something went wrong. Please try again.";
      } catch (_) {
        lastBubble.textContent = "Sorry, something went wrong. Please try again.";
      }
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      aiWrap.text += chunk;
      lastBubble.innerHTML = sanitizeAssistant(aiWrap.text);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // Fetch next suggested questions after assistant finishes
    try {
      const sres = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, assistant: aiWrap.text })
      });
      const data = await sres.json();
      if (Array.isArray(data.suggestions) && data.suggestions.length) {
        renderInlineFAQ(data.suggestions, "You can also ask:");
      }
    } catch (_) { /* ignore */ }
  } catch (err) {
    lastBubble.textContent = "Network error. Please check your connection.";
  }
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = promptEl.value.trim();
  if (!text) return;
  promptEl.value = "";
  formEl.querySelector("button").disabled = true;
  await sendMessage(text);
  formEl.querySelector("button").disabled = false;
  promptEl.focus();
});

// Quick replies (FAQ)
// Delegate clicks on suggestion chips inside the messages feed
messagesEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-q]");
  if (!btn) return;
  const q = btn.getAttribute("data-q");
  sendMessage(q);
});

// Default intro message on load
window.addEventListener("DOMContentLoaded", () => {
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
  const maxFaq = isMobile ? 2 : 5;
  if (!messagesEl.querySelector(".msg")) {
    const introHtml = [
      '<p><strong>Anjali</strong><br />Online – Ready to help</p>',
      '<p>"Welcome to QB Tech Solutions!<br />I’m Anjali, your AI assistant from QB Tech Solutions—here to guide you through our services in branding, web development, digital marketing, and AI innovation."</p>'
    ].join("");
    appendMessage({ role: "assistant", text: introHtml });
  }
  // Initial inline FAQ inside chat (render AFTER intro so intro appears first)
  const defaults = [
    "Tell me about QB Tech Solutions",
    "What services do you offer?",
    "How can I get started with a project?",
    "Show me your portfolio or past work",
    "How do I contact your team?",
  ];
  renderInlineFAQ(defaults.slice(0, maxFaq), "How can I assist you today?");
});

function renderInlineFAQ(items, titleText) {
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
  const maxItems = isMobile ? 2 : 5;
  const wrap = document.createElement("div");
  wrap.className = "msg assistant";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  const img = document.createElement("img");
  img.src = "/logo.jpg";
  img.alt = "QB Tech Logo";
  avatar.appendChild(img);

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const title = document.createElement("p");
  title.className = "faq-title";
  title.textContent = titleText;
  const list = document.createElement("div");
  list.className = "faq-list";
  items.slice(0, maxItems).forEach((q) => {
    const b = document.createElement("button");
    b.setAttribute("data-q", q);
    b.textContent = q;
    list.appendChild(b);
  });
  bubble.appendChild(title);
  bubble.appendChild(list);
  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function sanitizeAssistant(input) {
  if (!input) return "";
  let out = String(input);
  // Strip fenced code blocks like ```html ... ``` or ``` ... ```
  out = out.replace(/```[a-zA-Z]*\n([\s\S]*?)```/g, "$1");
  // Remove stray triple backticks
  out = out.replace(/```/g, "");
  return out;
}


