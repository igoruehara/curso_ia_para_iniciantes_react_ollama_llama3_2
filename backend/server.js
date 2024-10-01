// backend/server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configurar rate limiting (opcional, mas recomendado)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita cada IP a 100 requisições por janela
  message: 'Muitas requisições criadas a partir desta IP, por favor, tente novamente após 15 minutos.',
});
app.use(limiter);

// Variáveis de ambiente
const OLLAMA_API_URL = 'http://localhost:11434/api/chat'

// Endpoint para gerar respostas via Ollama
app.post('/api/generate', async (req, res) => {
  const { messages } = req.body;

  // Validação dos campos
  if (!messages) {
    return res.status(400).json({ message: 'Os campos "model" e "prompt" são obrigatórios.' });
  }

  try {
    const response = await axios.post(
      OLLAMA_API_URL,
      {
        "model": "llama3.2:3b",
        "stream": false,
        "messages": [
          { "role": "user", "content": messages[messages.length -1].content }
        ]

      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Verificar se a resposta contém o resultado esperado
    const botResponse = response.data.message.content || 'Desculpe, não consegui processar sua mensagem.';

    res.json({ answer: botResponse });
  } catch (error) {
    if (error.response) {
      // O servidor respondeu com um status diferente de 2xx
      console.error('Erro da API do Ollama:', error.response.data);
      res.status(error.response.status).json({ message: 'Erro na API do Ollama: ' + JSON.stringify(error.response.data) });
    } else if (error.request) {
      // A requisição foi feita, mas nenhuma resposta foi recebida
      console.error('Nenhuma resposta recebida da API do Ollama:', error.request);
      res.status(500).json({ message: 'Nenhuma resposta recebida da API do Ollama.' });
    } else {
      // Alguma outra coisa causou o erro
      console.error('Erro ao configurar a requisição:', error.message);
      res.status(500).json({ message: 'Erro ao configurar a requisição: ' + error.message });
    }
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor backend rodando em http://localhost:${port}`);
});
