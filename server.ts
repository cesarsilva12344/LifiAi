import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { 
  readDatabase, 
  writeDatabase, 
  addInboxItem, 
  getActivePersona, 
  updateActivePersona, 
  getProfile, 
  updateProfile,
  initializeDatabase
} from './server/db';
import { 
  classifyAndParseInput, 
  generatePersonaResponse, 
  getEmbedding, 
  semanticSearch,
  getAI
} from './server/ai';
import { 
  handleCommand, 
  isCommand, 
  executeFromIntent,
  deleteEntity,
  updateTask,
  updateProject,
  createExpense,
  createIncome,
  createTask,
  createReminder,
  createGoal,
  createHabit,
  createProject,
  createNote,
  createIdea,
  createMemory
} from './services/engine/index';
import { runPersona, runRouter, runTranscribe, runOCR } from './services/ai/core';
import { Expense, Income, Task, Reminder, Goal, Habit, Project, Note, Idea, Memory, InboxItem } from './src/types';

// Load env vars
dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

async function startServer() {
  // Initialize database (syncs from Supabase if configured)
  await initializeDatabase();

  const app = express();
  app.use(express.json());

  // In-memory/File-bound simulated Telegram Chat History
  const getTelegramHistory = () => {
    const db = readDatabase() as any;
    const userName = db.userProfile?.nome || 'César';
    const appName = db.userProfile?.appName || 'LifeOS AI';
    const activePersona = db.personas.find((p: any) => p.ativa) || db.personas[0];
    if (!db.telegram_history) {
      db.telegram_history = [
        { sender: 'bot', text: `Olá ${userName}! Bem-vindo ao ${appName}. Eu sou seu ${activePersona.nome} ativo hoje. Registre suas despesas, tarefas, pensamentos ou notas por aqui, e eu os classificarei em seu Dashboard de imediato.`, timestamp: new Date().toISOString() }
      ];
      writeDatabase(db);
    }
    return db.telegram_history;
  };

  const addTelegramHistory = (sender: 'user' | 'bot', text: string) => {
    const db = readDatabase() as any;
    const history = getTelegramHistory();
    const newItem = { sender, text, timestamp: new Date().toISOString() };
    history.push(newItem);
    db.telegram_history = history;
    writeDatabase(db);
    return newItem;
  };

  // ----------------------------------------------------
  // CORE API ROUTES (FIRST)
  // ----------------------------------------------------

  // Get full database state
  app.get('/api/db', (req, res) => {
    try {
      const state = readDatabase();
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao ler dados' });
    }
  });

  // Reset database state to mock defaults
  app.post('/api/db/reset', (req, res) => {
    try {
      const dbPath = path.join(process.cwd(), 'db.json');
      if (require('fs').existsSync(dbPath)) {
        require('fs').unlinkSync(dbPath);
      }
      const state = readDatabase(); // Trigger write defaults
      res.json({ message: 'Banco de dados restaurado ao original', state });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao resetar banco' });
    }
  });

  // Update profile
  app.post('/api/db/profile', (req, res) => {
    try {
      const updated = updateProfile(req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  });

  // Toggle/Change active persona
  app.post('/api/db/persona/toggle', (req, res) => {
    try {
      const { id } = req.body;
      const updated = updateActivePersona(id);
      if (updated) {
        addTelegramHistory('bot', `🔄 Persona alterada para: **${updated.nome}**\n*${updated.descricao}*`);
        res.json(updated);
      } else {
        res.status(404).json({ error: 'Persona não encontrada' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro ao alterar persona' });
    }
  });

  // Update a specific persona's settings
  app.post('/api/db/persona/update', (req, res) => {
    try {
      const { id, nome, descricao, prompt_base } = req.body;
      const db = readDatabase();
      const index = db.personas.findIndex(p => p.id === id);
      if (index !== -1) {
        db.personas[index] = {
          ...db.personas[index],
          nome: nome || db.personas[index].nome,
          descricao: descricao || db.personas[index].descricao,
          prompt_base: prompt_base || db.personas[index].prompt_base
        };
        writeDatabase(db);
        res.json(db.personas[index]);
      } else {
        res.status(404).json({ error: 'Persona não encontrada' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar persona' });
    }
  });

  // Toggle/Change status of a task
  app.post('/api/db/tasks/toggle', (req, res) => {
    try {
      const { id } = req.body;
      const db = readDatabase();
      const taskIndex = db.tasks.findIndex(t => t.id === id);
      if (taskIndex !== -1) {
        const task = db.tasks[taskIndex];
        task.status = task.status === 'completed' ? 'pending' : 'completed';
        writeDatabase(db);
        res.json(task);
      } else {
        res.status(404).json({ error: 'Tarefa não encontrada' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro ao alterar status da tarefa' });
    }
  });

  // Check-in habit
  app.post('/api/db/habits/check', (req, res) => {
    try {
      const { id } = req.body;
      const db = readDatabase();
      const habitIndex = db.habits.findIndex(h => h.id === id);
      const todayStr = '2026-05-26'; // Real operational system target today
      
      if (habitIndex !== -1) {
        const habit = db.habits[habitIndex];
        if (!habit.history.includes(todayStr)) {
          habit.history.push(todayStr);
          habit.streak += 1;
        } else {
          // Untoggle
          habit.history = habit.history.filter(d => d !== todayStr);
          habit.streak = Math.max(0, habit.streak - 1);
        }
        writeDatabase(db);
        res.json(habit);
      } else {
        res.status(404).json({ error: 'Hábito não encontrado' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro ao registrar hábito' });
    }
  });

  // Create standard task manuall
  app.post('/api/db/tasks', (req, res) => {
    try {
      const db = readDatabase();
      const { titulo, prioridade, prazo } = req.body;
      const newTask: Task = {
        id: 't_' + Date.now(),
        titulo: titulo || 'Nova Tarefa',
        status: 'pending',
        prioridade: prioridade || 'medium',
        prazo: prazo || '2026-05-27'
      };
      db.tasks.unshift(newTask);
      writeDatabase(db);
      res.json(newTask);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
  });

  // Cancel/complete reminders
  app.post('/api/db/reminders/status', (req, res) => {
    try {
      const { id, status } = req.body; // 'completed' | 'canceled' | 'active'
      const db = readDatabase();
      const index = db.reminders.findIndex(r => r.id === id);
      if (index !== -1) {
        db.reminders[index].status = status;
        writeDatabase(db);
        res.json(db.reminders[index]);
      } else {
        res.status(404).json({ error: 'Lembrete não encontrado' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar lembrete' });
    }
  });

  // Update/Progresso goal
  app.post('/api/db/goals/progress', (req, res) => {
    try {
      const { id, progresso } = req.body;
      const db = readDatabase();
      const index = db.goals.findIndex(g => g.id === id);
      if (index !== -1) {
        db.goals[index].progresso = parseFloat(progresso);
        writeDatabase(db);
        res.json(db.goals[index]);
      } else {
        res.status(404).json({ error: 'Meta não encontrada' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar progresso' });
    }
  });

  // Semantic Search API Endpoint
  app.get('/api/semantic-search', async (req, res) => {
    try {
      const query = (req.query.q as string) || '';
      if (!query.trim()) {
        return res.json([]);
      }
      const results = await semanticSearch(query);
      res.json(results);
    } catch (error) {
      console.error('Erro na busca semântica API:', error);
      res.status(500).json({ error: 'Falha ao rodar busca semântica' });
    }
  });

  // Get Telegram Chat history
  app.get('/api/telegram/history', (req, res) => {
    try {
      res.json(getTelegramHistory());
    } catch (error) {
      res.status(500).json({ error: 'Falha ao recuperar histórico' });
    }
  });

  // Persona insights computation
  app.get('/api/insights', async (req, res) => {
    const activePersona = getActivePersona();
    const profile = getProfile();
    const db = readDatabase();

    const statsPrompt = `Analise objetivamente os dados estruturados reais do LifeOS AI hoje (2026-05-26) e elabore 3 ou 4 insights ou conselhos acionáveis de curto prazo como a Persona: ${activePersona.nome}.
    
    PERFIL DO USUÁRIO:
    Interesses: ${profile.interesses.join(', ')}
    Objetivos: ${profile.objetivos.join(', ')}

    DADOS FINANCEIROS:
    - Receitas totais: R$ ${db.income.reduce((s, e) => s + e.valor, 0).toFixed(2)}
    - Despesas totais: R$ ${db.expenses.reduce((s, e) => s + e.valor, 0).toFixed(2)}
    - Balanço: R$ ${(db.income.reduce((s, e) => s + e.valor, 0) - db.expenses.reduce((s, e) => s + e.valor, 0)).toFixed(2)}
    - Despesas por categorias: ${JSON.stringify(db.expenses)}

    TAREFAS:
    - Pendentes (${db.tasks.filter(t => t.status==='pending').length}): ${db.tasks.filter(t => t.status==='pending').map(t => t.titulo).join(', ')}
    - Concluídas (${db.tasks.filter(t => t.status==='completed').length})

    HÁBITOS:
    - Streaks: ${db.habits.map(h => `${h.nome} (Streak: ${h.streak}/Frequência: ${h.frequencia})`).join(', ')}

    PROJETOS:
    - Progresso: ${db.projects.map(p => `${p.nome}: ${p.progresso}% [Status: ${p.status}]`).join(', ')}

    Envie uma resposta em formato Markdown muito bem desenhada (usando bullet points elegantes, títulos curtos e destaques visuais). Responda estritamente sob a personalidade da persona ${activePersona.nome}. Sem introduções clichês ou pós-fácios. Concentre-se no que o usuário deve fazer ou alertar.`;

    try {
      const ai = getAI();
      const text = await ai.chat(
        `Você é a persona ${activePersona.nome} do LifeOS AI. Responda estritamente sob essa personalidade.`,
        statsPrompt
      );
      res.json({ insights: text });
    } catch (error) {
      // Fallback response inside matching tone
      let mockInsights = '';
      if (activePersona.id === 'cfo') {
        mockInsights = `### 📊 Insights do CFO (Modo Fallback)\n\n1. **Controle Financeiro Rigoroso**: Seu saldo é positivo de R$ ${(db.income.reduce((s, e) => s + e.valor, 0) - db.expenses.reduce((s, e) => s + e.valor, 0)).toFixed(2)}. No entanto, a categoria **Alimentação** representa o maior foco de despesa recente. Monitore e reduza para alavancar aportes.\n2. **Alocação Inteligente**: Você possui R$ ${db.income.reduce((s, e) => s + e.valor, 0).toFixed(2)} em caixa faturado. Considere reservar 30% em renda fixa focada em liquidez imediata para despesas corporativas do micro-SaaS.\n3. **Mantenha Foco**: Não adicione nenhum custo recorrente fixo de assinaturas nas próximas semanas.`;
      } else if (activePersona.id === 'founder') {
        mockInsights = `### 🚀 Insights de Tração (Modo Fallback)\n\n1. **Acelere o MVP**: O projeto **LifeOS AI core** está com ${db.projects[0]?.progresso || 80}% concluído. Foque exclusivamente em fechar a interface de captura e testes de webhook hoje. Ignore pendências secundárias.\n2. **Engajamento**: Liste os 10 primeiros beta testers potenciais para validar o canal orgânico.\n3. **Pragmatismo**: Risque a tarefa de documentação imediata e suba código funcional para coleta rápida de feedbacks.`;
      } else {
        mockInsights = `### ⚡ Recomendações do Chief of Staff\n\n1. **Foco Pragmático**: Você tem ${db.tasks.filter(t => t.status === 'pending').length} tarefas pendentes. A tarefa de maior prioridade hoje é **Revisar contrato do designer**.\n2. **Manutenção de Hábitos**: O hábito **Treino de Força (Academia)** está com um excelente streak de ${db.habits[0]?.streak || 5} dias. Não falhe hoje para solidificar a neuroplasticidade.\n3. **Mapeamento Próximo**: Conclua seus lembretes programados nas próximas 24h para manter o córtex limpo.`;
      }
      res.json({ insights: mockInsights });
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // TELEGRAM WEBHOOK — Entrada principal de captura
  // Toda lógica delegada aos engines modulares:
  //   /comandos  → Command Engine
  //   texto      → AI Router → Action Engine → AI Core (runPersona)
  // ────────────────────────────────────────────────────────────────────────
  // ------------------------------------------------------------------------
  // CENTRAL MESSAGING PIPELINE (Channel-independent & WhatsApp Ready)
  // ------------------------------------------------------------------------
  
  interface UnifiedMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    source: 'telegram' | 'whatsapp' | 'emulator';
  }

  async function handleUnifiedMessage(msg: UnifiedMessage) {
    const text = msg.text;

    // 1. Save input to chat history
    addTelegramHistory('user', text);
    const history = (getTelegramHistory() as any[]).slice(-6).map((h: any) => ({
      sender: h.sender as 'user' | 'bot',
      text: h.text,
    }));

    // 2. Command Pipeline
    if (isCommand(text)) {
      const { response, handled } = await handleCommand(text, history);
      const reply = handled ? response : `❓ Comando não reconhecido. Use /help para ver os disponíveis.`;
      addTelegramHistory('bot', reply);
      return {
        response: reply,
        classification: 'command',
        saved: true
      };
    }

    // 3. AI Parsing & Classification (AI Router)
    const { intent, extracted_data, explanation, confidence } = await runRouter(text);

    // 4. Database write via Action Engine
    const actionResult = await executeFromIntent(intent, extracted_data, msg.source);

    // 5. Generate contextual persona reply
    const reply = await runPersona(text, history);

    addTelegramHistory('bot', reply);

    return {
      response: reply,
      classification: intent,
      confidence,
      explanation,
      parsed_data: extracted_data,
      saved: actionResult.success,
    };
  }

  // Telegram Webhook Endpoint
  app.post('/api/telegram/webhook', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text?.trim()) {
        return res.status(400).json({ error: 'Texto não fornecido' });
      }

      // Map to UnifiedMessage format
      const unifiedMsg: UnifiedMessage = {
        id: 'tg_' + Date.now(),
        text: text,
        senderId: req.body.chat_id || 'tg_user',
        senderName: req.body.username || 'Telegram User',
        source: 'telegram'
      };

      const result = await handleUnifiedMessage(unifiedMsg);
      res.json(result);

    } catch (error: any) {
      console.error('[Webhook Telegram] Falha:', error.message);
      res.status(500).json({ error: 'Erro ao processar captura Telegram' });
    }
  });

  // WhatsApp Webhook Endpoint (Ready for WhatsApp Cloud API integration in the future)
  app.post('/api/whatsapp/webhook', async (req, res) => {
    try {
      // Stub integration mapping WhatsApp Cloud API format to our UnifiedMessage
      const entry = req.body.entry?.[0];
      const changes = entry?.changes?.[0];
      const val = changes?.value;
      const message = val?.messages?.[0];

      const text = message?.text?.body || req.body.text; // Support testing payload
      if (!text?.trim()) {
        return res.json({ status: 'ignored', message: 'No text message body found' });
      }

      const unifiedMsg: UnifiedMessage = {
        id: message?.id || 'wa_' + Date.now(),
        text: text,
        senderId: message?.from || req.body.senderId || 'wa_user',
        senderName: val?.contacts?.[0]?.profile?.name || req.body.senderName || 'WhatsApp User',
        source: 'whatsapp'
      };

      const result = await handleUnifiedMessage(unifiedMsg);
      
      // Here you would trigger standard WhatsApp API calls to send the response back:
      // await sendWhatsAppMessage(unifiedMsg.senderId, result.response);

      res.json({
        status: 'success',
        processed: true,
        result
      });

    } catch (error: any) {
      console.error('[Webhook WhatsApp] Falha:', error.message);
      res.status(500).json({ error: 'Erro ao processar captura WhatsApp' });
    }
  });

  // ----------------------------------------------------
  // ADDITIONAL REST API ENDPOINTS
  // ----------------------------------------------------

  // Generic DELETE endpoint
  app.delete('/api/db/:collection/:id', async (req, res) => {
    try {
      const { collection, id } = req.params;
      const result = await deleteEntity(collection as any, id);
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH Task endpoint
  app.patch('/api/db/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await updateTask(id, req.body);
      if (result.success) {
        res.json(result.data);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH Project endpoint
  app.patch('/api/db/projects/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await updateProject(id, req.body);
      if (result.success) {
        res.json(result.data);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Manual Expenses / Income endpoints
  app.post('/api/db/expenses/manual', async (req, res) => {
    try {
      const result = await createExpense(req.body, 'dashboard');
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/income/manual', async (req, res) => {
    try {
      const result = await createIncome(req.body, 'dashboard');
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/reminders', async (req, res) => {
    try {
      const result = await createReminder(req.body, 'dashboard');
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Create Habit, Goal, Project endpoints
  app.post('/api/db/habits', async (req, res) => {
    try {
      const result = await createHabit(req.body, 'dashboard');
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/goals', async (req, res) => {
    try {
      const result = await createGoal(req.body, 'dashboard');
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/projects', async (req, res) => {
    try {
      const result = await createProject(req.body, 'dashboard');
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Create Note, Idea, Memory endpoints
  app.post('/api/db/notes', async (req, res) => {
    try {
      const result = await createNote(req.body, 'dashboard');
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/ideas', async (req, res) => {
    try {
      const result = await createIdea(req.body, 'dashboard');
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/memories/manual', async (req, res) => {
    try {
      const result = await createMemory(req.body, 'dashboard');
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Export Database endpoint
  app.get('/api/db/export', (req, res) => {
    try {
      const db = readDatabase();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=lifeos-export.json');
      res.send(JSON.stringify(db, null, 2));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Audio Transcribe Endpoint
  app.post('/api/audio/transcribe', async (req, res) => {
    try {
      const { audio, mime } = req.body;
      if (!audio) return res.status(400).json({ error: 'Áudio não fornecido' });
      const text = await runTranscribe(audio, mime);
      res.json({ text });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // OCR Extract Endpoint
  app.post('/api/ocr/extract', async (req, res) => {
    try {
      const { image, mime } = req.body;
      if (!image) return res.status(400).json({ error: 'Imagem não fornecida' });
      const result = await runOCR(image, mime);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Telegram bot status
  app.get('/api/telegram/status', (req, res) => {
    const profile = getProfile();
    res.json({
      configured: !!(profile.telegramBotToken && profile.telegramChatId),
      hasToken: !!profile.telegramBotToken,
      hasChatId: !!profile.telegramChatId,
      botToken: profile.telegramBotToken ? `${profile.telegramBotToken.slice(0, 6)}...` : null,
      chatId: profile.telegramChatId || null
    });
  });

  // Telegram webhook registration
  app.post('/api/telegram/register-webhook', async (req, res) => {
    try {
      const profile = getProfile();
      if (!profile.telegramBotToken) {
        return res.status(400).json({ error: 'Token do Telegram Bot não configurado.' });
      }
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const webhookUrl = `${appUrl}/api/telegram/real-webhook`;
      
      const registerUrl = `https://api.telegram.org/bot${profile.telegramBotToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
      const response = await fetch(registerUrl);
      const data = await response.json() as any;

      if (data.ok) {
        res.json({ message: `Webhook registrado com sucesso: ${webhookUrl}`, info: data.description });
      } else {
        res.status(400).json({ error: `Erro ao registrar webhook: ${data.description}` });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Real Telegram Webhook
  app.post('/api/telegram/real-webhook', async (req, res) => {
    try {
      const update = req.body;
      console.log('[Telegram Bot] Received update:', JSON.stringify(update));
      
      const message = update.message;
      if (!message) return res.status(200).send('OK');

      const chatId = message.chat.id;
      const text = message.text;
      
      const profile = getProfile();
      if (profile.telegramChatId && String(chatId) !== String(profile.telegramChatId)) {
        console.warn(`[Telegram Bot] Ignoring message from unauthorized chat ID: ${chatId}`);
        return res.status(200).send('OK');
      }

      if (text) {
        addTelegramHistory('user', text);
        const history = (getTelegramHistory() as any[]).slice(-6).map((h: any) => ({
          sender: h.sender as 'user' | 'bot',
          text: h.text,
        }));

        let reply = '';
        if (isCommand(text)) {
          const { response, handled } = await handleCommand(text, history);
          reply = handled ? response : `❓ Comando não reconhecido. Use /help para ver os disponíveis.`;
        } else {
          const { intent, extracted_data } = await runRouter(text);
          await executeFromIntent(intent, extracted_data, 'telegram');
          reply = await runPersona(text, history);
        }

        addTelegramHistory('bot', reply);

        if (profile.telegramBotToken) {
          const telegramUrl = `https://api.telegram.org/bot${profile.telegramBotToken}/sendMessage`;
          await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: reply,
              parse_mode: 'Markdown'
            })
          }).catch(err => console.error('[Telegram Webhook] Failed to send message:', err.message));
        }
      }
      res.status(200).send('OK');
    } catch (err: any) {
      console.error('[Telegram Bot] Error in real-webhook:', err.message);
      res.status(200).send('OK');
    }
  });

  // Start Background Scheduler
  function startScheduler() {
    console.log('[Scheduler] Background scheduler initialized.');
    setInterval(async () => {
      try {
        const db = readDatabase();
        const profile = getProfile();
        if (!profile.telegramBotToken || !profile.telegramChatId) return;

        const now = new Date();
        
        // 1. Process Reminders
        let dbChanged = false;
        for (const rem of db.reminders) {
          if (rem.status === 'active' && rem.data_hora) {
            const remTime = new Date(rem.data_hora);
            if (remTime <= now) {
              console.log(`[Scheduler] Firing reminder: ${rem.titulo}`);
              rem.status = 'completed';
              dbChanged = true;

              const msg = `🔔 **LEMBRETE!**\n\n📌 *${rem.titulo}*\n📅 Horário programado: ${new Date(rem.data_hora).toLocaleString('pt-BR')}`;
              const telegramUrl = `https://api.telegram.org/bot${profile.telegramBotToken}/sendMessage`;
              await fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: profile.telegramChatId,
                  text: msg,
                  parse_mode: 'Markdown'
                })
              }).catch(err => console.error('[Scheduler] Error sending reminder telegram:', err.message));
            }
          }
        }
        if (dbChanged) {
          writeDatabase(db);
        }

        // 2. Daily Digest (once a day at 8:00 AM - 10:00 AM local time)
        const todayStr = now.toISOString().split('T')[0];
        const lastDigestKey = `last_digest_${todayStr}`;
        const dbAny = db as any;
        if (!dbAny.metadata) dbAny.metadata = {};
        
        if (!dbAny.metadata[lastDigestKey]) {
          const currentHour = now.getHours();
          if (currentHour >= 8 && currentHour < 10) {
            console.log('[Scheduler] Sending daily digest...');
            dbAny.metadata[lastDigestKey] = true;
            writeDatabase(db);

            const digestResult = await handleCommand('/hoje');
            
            const telegramUrl = `https://api.telegram.org/bot${profile.telegramBotToken}/sendMessage`;
            await fetch(telegramUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: profile.telegramChatId,
                text: `🌅 **Bom dia! Aqui está seu resumo matinal:**\n\n${digestResult.response}`,
                parse_mode: 'Markdown'
              })
            }).catch(err => console.error('[Scheduler] Error sending digest telegram:', err.message));
          }
        }

      } catch (err: any) {
        console.error('[Scheduler] Error in scheduler loop:', err.message);
      }
    }, 60000);
  }

  startScheduler();


  // ----------------------------------------------------
  // VITE & CLIENT-BOUND STATIC SERVER HOOKS
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LifeOS AI] Server running smoothly on http://localhost:${PORT}`);
  });
}

startServer();
