# Quick Start Guide - Together AI Integration

## 🚀 Get Started in 3 Steps

### Step 1: Get Your Together AI API Key

1. Go to [together.ai](https://together.ai)
2. Sign up or log in
3. Navigate to **Settings** → **API Keys**
4. Copy your API key

### Step 2: Add to Environment Variables

Create or update your `.env` file:

```env
TOGETHER_API_KEY="paste_your_api_key_here"
```

Optional - specify a different model:

```env
TOGETHER_AI_MODEL="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
```

### Step 3: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## ✅ You're Done!

The AI features are now fully functional:

### Test It Out

1. **Create a subject**

   ```bash
   POST /api/subjects/create
   {
     "title": "Biology",
     "description": "Study notes"
   }
   ```

2. **Create a note**

   ```bash
   POST /api/notes/create
   {
     "subjectId": "your-subject-id",
     "title": "Cell Structure",
     "rawContent": "Cells are the basic units of life. They contain a nucleus, cytoplasm, and cell membrane. Mitochondria produce energy for the cell through cellular respiration."
   }
   ```

3. **Process with AI**

   ```bash
   POST /api/notes/{noteId}/process
   ```

4. **Generate a quiz**
   ```bash
   POST /api/learning-tools/generate
   {
     "type": "QUIZ",
     "source": "SINGLE_NOTE",
     "noteId": "your-note-id"
   }
   ```

## 📊 What You Get

### Note Processing

- Organized sections with headings
- Key points extracted
- Important concepts highlighted
- Concise summary

### Quiz Generation

- Multiple-choice questions
- 4 options per question
- Correct answer marked
- Detailed explanations

### Flashcards

- Clear front-side questions
- Complete back-side answers
- One concept per card

### Summaries

- Concise overview
- Key points list
- Main topics identified

## 🎯 Usage Limits

Your plan determines AI usage:

| Plan    | AI Operations/Month |
| ------- | ------------------- |
| FREE    | 100                 |
| PRO     | 1,000               |
| PREMIUM | 5,000               |

Each operation counts:

- ✅ Note processing = 1 operation
- ✅ Quiz generation = 1 operation
- ✅ Flashcard generation = 1 operation
- ✅ Summary generation = 1 operation

Check usage:

```bash
GET /api/user/usage
```

## 💡 Tips

1. **Better Content = Better Results**
   - Write clear, structured notes
   - Include key concepts
   - Use proper grammar

2. **Optimize Costs**
   - Use smaller models for simple tasks
   - Process notes in batches
   - Cache frequently used results

3. **Handle Errors Gracefully**
   - Show loading states
   - Provide retry options
   - Display helpful error messages

## 📚 Learn More

- **Full Documentation**: [TOGETHER_AI.md](./TOGETHER_AI.md)
- **API Reference**: [BACKEND_API.md](./BACKEND_API.md)
- **Together AI Docs**: https://docs.together.ai

## 🆘 Troubleshooting

### "API key not configured"

→ Add `TOGETHER_API_KEY` to `.env` and restart

### "AI usage limit exceeded"

→ User has reached their plan limit. Upgrade plan or wait for reset.

### Slow responses

→ Normal for first request. Subsequent requests are faster.

### Rate limit errors

→ Too many requests. Implement retry with backoff.

## 🎉 Ready to Build!

Your AI-powered study assistant is ready. Start building amazing features!
