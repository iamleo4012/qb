## QB Tech Solutions – AI Chatbot (Node.js + Gemini)

Run a local chatbot with Google Gemini streaming and a branded UI.

### Prerequisites
- Node.js 18+
- A Google Gemini API Key (set as `GEMINI_API_KEY`)

### Setup
1. Create an `.env` file in the project root with:

   ```
   GEMINI_API_KEY=YOUR_API_KEY_HERE
   PORT=3000
   ```

2. Place your logo image at `public/logo.png`.
   - Use the image you provided in this conversation.

3. Install dependencies:

   ```bash
   npm install
   ```

### Development

```bash
npm run dev
```

Open `http://localhost:3000`.

### Production

```bash
npm start
```

### Notes
- The API endpoint is `POST /api/chat` with `{ "message": "..." }`.
- The response is streamed as `text/plain`.
- The UI color theme matches the logo’s navy and blue gradient.


