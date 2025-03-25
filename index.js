const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// Add timeout middleware
app.use((req, res, next) => {
  req.setTimeout(120000);
  next();
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'An error occurred. Please try again.' });
});

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function fetchWithTimeout(url, options, timeoutMs = 60000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

app.post('/chat', async (req, res) => {
  try {
    console.log('Received message:', req.body.message);

    // Create a thread
    console.log('Creating thread...');
    const threadResponse = await fetchWithTimeout('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json'
      }
    });

    const threadResponseText = await threadResponse.text();
    console.log('Thread response:', threadResponseText);

    if (!threadResponse.ok) {
      throw new Error(`Thread creation failed: ${threadResponseText}`);
    }

    const thread = JSON.parse(threadResponseText);
    console.log('Thread created:', thread.id);

    // Add message to thread
    console.log('Adding message to thread...');
    const messageResponse = await fetchWithTimeout(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'user',
        content: req.body.message
      })
    });

    if (!messageResponse.ok) {
      const messageError = await messageResponse.text();
      throw new Error(`Message creation failed: ${messageError}`);
    }

    // Run the assistant
    console.log('Starting assistant...');
    const runResponse = await fetchWithTimeout(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistant_id: 'asst_MUYiIaHwl8reTtP0dhNnZdzM'
      })
    });

    if (!runResponse.ok) {
      const runError = await runResponse.text();
      throw new Error(`Run creation failed: ${runError}`);
    }

    const run = await runResponse.json();
    console.log('Run created:', run.id);

    // Wait for completion with timeout
    console.log('Waiting for completion...');
    let runStatus = 'in_progress';
    let attempts = 0;
    const maxAttempts = 30;
    const pollInterval = 2000; // 2 seconds between checks

    while (runStatus === 'in_progress' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await fetchWithTimeout(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!statusResponse.ok) {
        const statusError = await statusResponse.text();
        throw new Error(`Status check failed: ${statusError}`);
      }

      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      console.log(`Attempt ${attempts + 1}: Status = ${runStatus}`);
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error(`Assistant response failed with status: ${runStatus}`);
    }

    // Get messages
    console.log('Retrieving messages...');
    const messagesResponse = await fetchWithTimeout(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!messagesResponse.ok) {
      const messagesError = await messagesResponse.text();
      throw new Error(`Messages retrieval failed: ${messagesError}`);
    }

    const messages = await messagesResponse.json();
    const lastMessage = messages.data[0];
    console.log('Response received:', lastMessage.content[0].text.value);

    res.json({ reply: lastMessage.content[0].text.value });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request. Please try again.',
      details: error.message
    });
  }
});

// Create server with extended timeout
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

// Configure keep-alive timeout
server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 120000; // 120 seconds