import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { 
  readDatabase, 
  writeDatabase, 
  addInboxItem, 
  getActivePersona, 
  updateActivePersona, 
  getProfile, 
  updateProfile,
  initializeDatabase
} from './db';
import { 
  classifyAndParseInput, 
  generatePersonaResponse, 
  getEmbedding, 
  semanticSearch,
  getAI
} from './ai';
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
} from '../services/engine/index';
import { runPersona, runRouter, runTranscribe, runOCR } from '../services/ai/core';
import { Expense, Income, Task, Reminder, Goal, Habit, Project, Note, Idea, Memory, InboxItem } from '../src/types';

// Load env vars
dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

async function startServer() {
  // Initialize database (syncs from Supabase if configured)
  await initializeDatabase();

  const app = express();
  app.use(express.json());

  // Middleware to resolve Vercel's path rewrites by recovering the original requested path
  app.use((req, res, next) => {
    const forwardedPath = req.headers['x-vercel-forwarded-path'] as string;
    if (forwardedPath) {
      const queryIndex = req.url.indexOf('?');
      const queryString = queryIndex !== -1 ? req.url.substring(queryIndex) : '';
      req.url = forwardedPath + queryString;
      console.log(`[Vercel Route] Rewritten req.url to: ${req.url}`);
    }
    next();
  });

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
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
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

    // 4. Three-tier confidence decision
    let reply = '';
    let saved = false;
    let extractionStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW' = 'PENDING';

    const activePersona = getActivePersona();

    if (confidence >= 0.85) {
      // Auto-approved
      extractionStatus = 'APPROVED';
      const actionResult = await executeFromIntent(intent, extracted_data, msg.source);
      saved = actionResult.success;
      reply = await runPersona(text, history);
    } else if (confidence >= 0.60) {
      // Review staging
      extractionStatus = 'REVIEW';
      saved = false;
      reply = `🔍 **[${activePersona.nome}]** Recebi sua mensagem, César. Como a confiança da extração foi de ${Math.round(confidence * 100)}% (abaixo do limiar de 85%), salvei-a de forma segura na sua **Fila de Validação IA** no Dashboard para sua revisão manual antes de gravar definitivamente.`;
    } else {
      // Rejected
      extractionStatus = 'REJECTED';
      saved = false;
      reply = `❓ **[${activePersona.nome}]** Não consegui extrair as informações com clareza suficiente (${Math.round(confidence * 100)}% confiança). Poderia reformular a mensagem fornecendo o valor exato, a categoria e a descrição detalhada?`;
    }

    // Save extraction history
    const db = readDatabase();
    db.aiExtractions = db.aiExtractions || [];
    db.aiExtractions.unshift({
      id: 'ext_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      source: msg.source as any,
      confidence,
      extracted_json: { intent, data: extracted_data, explanation },
      status: extractionStatus,
      created_at: new Date().toISOString()
    });
    writeDatabase(db);

    addTelegramHistory('bot', reply);

    return {
      response: reply,
      classification: intent,
      confidence,
      explanation,
      parsed_data: extracted_data,
      saved,
      extractionStatus
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
  // POST Manual Decisions / Review endpoints
  app.post('/api/db/decisions', async (req, res) => {
    try {
      const { createDecision } = await import('../services/engine/action');
      const result = await createDecision(req.body, 'dashboard');
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/db/decisions/:id', async (req, res) => {
    try {
      const { updateDecision } = await import('../services/engine/action');
      const result = await updateDecision(req.params.id, req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Energy tracking endpoints
  app.post('/api/db/energy', async (req, res) => {
    try {
      const { createEnergyLog } = await import('../services/engine/action');
      const result = await createEnergyLog(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/db/energy/avg', (req, res) => {
    try {
      const db = readDatabase();
      const logs = db.energyLogs || [];
      const hourlyAvg: { [hour: number]: { count: number; sum: number } } = {};
      logs.forEach(l => {
        const hour = new Date(l.created_at || new Date().toISOString()).getHours();
        if (!hourlyAvg[hour]) hourlyAvg[hour] = { count: 0, sum: 0 };
        hourlyAvg[hour].count += 1;
        hourlyAvg[hour].sum += l.energy_level;
      });
      const result = Object.keys(hourlyAvg).map(h => ({
        hour: parseInt(h),
        avg_energy: parseFloat((hourlyAvg[parseInt(h)].sum / hourlyAvg[parseInt(h)].count).toFixed(2))
      })).sort((a,b) => a.hour - b.hour);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Meditation sessions
  app.post('/api/db/meditation', async (req, res) => {
    try {
      const { createMeditationSession } = await import('../services/engine/action');
      const result = await createMeditationSession(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/db/meditation/stats', (req, res) => {
    try {
      const db = readDatabase();
      const sessions = db.meditationSessions || [];
      const total_sessions = sessions.length;
      const total_minutes = Math.round(sessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 60);
      const avg_mood_lift = total_sessions > 0
        ? parseFloat((sessions.reduce((sum, s) => sum + (s.mood_after - s.mood_before), 0) / total_sessions).toFixed(2))
        : 0;
      const last_session = total_sessions > 0 ? sessions[0].completed_at : null;

      res.json({ total_sessions, total_minutes, avg_mood_lift, last_session });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Daily intention
  app.post('/api/db/intentions', async (req, res) => {
    try {
      const { createDailyIntention } = await import('../services/engine/action');
      const result = await createDailyIntention(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Mood log
  app.post('/api/db/mood', async (req, res) => {
    try {
      const { createMoodLog } = await import('../services/engine/action');
      const result = await createMoodLog(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Debt endpoints
  app.post('/api/db/debts', async (req, res) => {
    try {
      const { createDebt } = await import('../services/engine/action');
      const result = await createDebt(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db/debt-payments', async (req, res) => {
    try {
      const { createDebtPayment } = await import('../services/engine/action');
      const result = await createDebtPayment(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Budgets
  app.post('/api/db/budgets', async (req, res) => {
    try {
      const { createBudget } = await import('../services/engine/action');
      const result = await createBudget(req.body);
      if (result.success) res.json(result.data);
      else res.status(400).json({ error: result.error });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Financial Upload & AI Spreadsheet Import Integration
  app.post('/api/db/import-spreadsheet', async (req, res) => {
    try {
      const { fileUrl } = req.body;
      const db = readDatabase();
      
      // Simulate spreadsheet processing by extracting mocked rows
      const extractedRows = [
        { id: 'bdg_ex1', category_id: 'Alimentação', valor_planejado: 800, mes: 5, ano: 2026 },
        { id: 'bdg_ex2', category_id: 'Transporte', valor_planejado: 400, mes: 5, ano: 2026 },
        { id: 'bdg_ex3', category_id: 'Moradia', valor_planejado: 2500, mes: 5, ano: 2026 },
        { id: 'bdg_ex4', category_id: 'Lazer', valor_planejado: 600, mes: 5, ano: 2026 },
        { id: 'bdg_ex5', category_id: 'Saúde', valor_planejado: 300, mes: 5, ano: 2026 }
      ];

      db.budgets = db.budgets || [];
      extractedRows.forEach(row => {
        db.budgets = db.budgets.filter(b => !(b.category_id === row.category_id && b.mes === row.mes && b.ano === row.ano));
        db.budgets.unshift({
          id: row.id,
          category_id: row.category_id,
          valor_planejado: row.valor_planejado,
          valor_realizado: 0,
          mes: row.mes,
          ano: row.ano
        });
      });

      const dbAny = db as any;
      dbAny.financialUploads = dbAny.financialUploads || [];
      dbAny.financialUploads.unshift({
        id: 'upload_' + Date.now(),
        file_url: fileUrl,
        file_name: path.basename(fileUrl),
        processed_status: 'COMPLETED',
        total_rows: extractedRows.length,
        created_at: new Date().toISOString()
      });

      writeDatabase(db);
      res.json({ success: true, rows: extractedRows.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET Financial Reconciliation
  app.get('/api/db/financial-reconciliation', (req, res) => {
    try {
      const db = readDatabase();
      const budgets = db.budgets || [];
      const expenses = db.expenses || [];
      const result = budgets.map(b => {
        const realizado = expenses
          .filter(e => e.categoria.toLowerCase() === b.category_id.toLowerCase() && new Date(e.data + 'T12:00:00').getMonth() + 1 === b.mes && new Date(e.data + 'T12:00:00').getFullYear() === b.ano)
          .reduce((sum, e) => sum + e.valor, 0);
        return {
          id: b.id,
          category_id: { name: b.category_id },
          mes: b.mes,
          ano: b.ano,
          valor_planejado: b.valor_planejado,
          valor_realizado: realizado,
          diferenca: b.valor_planejado - realizado,
          status_conciliacao: Math.abs(b.valor_planejado - realizado) < 1 ? 'OK' : 'DIFERENCA'
        };
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Simulator scenario run "E Se..."
  app.post('/api/db/simulator/run', async (req, res) => {
    try {
      const params = req.body; // { months, newHires, adSpend, newDebt, priceHike }
      const db = readDatabase();
      
      const totalIncome = db.income.reduce((sum, item) => sum + item.valor, 0);
      const totalExpenses = db.expenses.reduce((sum, item) => sum + item.valor, 0);
      
      let balance = totalIncome - totalExpenses;
      const baseExpense = totalExpenses;
      const projection = [];
      
      for(let i=1; i<=(params.months || 6); i++) {
        // Deterministic simulation formula matching Block 2
        balance += (totalIncome * (1 + (params.priceHike || 0)/100)) - baseExpense - (params.newHires || 0) * 5000 - (params.adSpend || 0) - (params.newDebt || 0);
        projection.push({ month: i, balance, risk: balance < 0 ? 'HIGH' : 'LOW' });
      }

      db.simulatorRuns = db.simulatorRuns || [];
      db.simulatorRuns.unshift({
        id: 'sim_run_' + Date.now(),
        params,
        result: projection,
        created_at: new Date().toISOString()
      });
      writeDatabase(db);

      res.json({ projection });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET AI Extractions Queue
  app.get('/api/db/ai-extractions', (req, res) => {
    try {
      const db = readDatabase();
      const extractions = (db.aiExtractions || []).filter(e => e.status === 'PENDING' || e.status === 'REVIEW');
      res.json(extractions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST AI Extractions Validation Action (Human-In-The-Loop)
  app.post('/api/db/ai-extractions/:id/validate', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, extracted_json } = req.body; // status: 'APPROVED' | 'REJECTED'
      const { updateAiExtractionStatus } = await import('../services/engine/action');
      const result = await updateAiExtractionStatus(id, status, extracted_json);
      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Daily Briefing Generator (generate-briefing mock)
  app.post('/api/db/generate-briefing', async (req, res) => {
    try {
      const db = readDatabase();
      const totalIncome = db.income.reduce((sum, item) => sum + item.valor, 0);
      const totalExpenses = db.expenses.reduce((sum, item) => sum + item.valor, 0);
      const net = totalIncome - totalExpenses;
      
      const urgentTasks = db.tasks.filter(t => t.status === 'pending').slice(0, 2).map(t => t.titulo).join(' e ');
      const activePersona = getActivePersona();

      const text = `🌅 **[${activePersona.nome}] Ritual das 07:00:**\n\n🧘 *Respire:* 4s in → 4s hold → 6s out (3x).\n💰 *Finanças:* Seu saldo é de R$ ${net.toFixed(2)}. Monitore a categoria Alimentação.\n📌 *Prioridades:* Resolver: ${urgentTasks || 'Nenhuma tarefa pendente'}.\n⚡ *Foco:* Programe um bloco de 60min Zen hoje às 10h.\n💡 *Insight:* "A execução constante mói qualquer obstáculo." Foco absoluto hoje!`;

      const { createBriefing } = await import('../services/engine/action');
      const result = await createBriefing({ content: text });
      
      if (result.success) res.json({ status: 'ok', text });
      else res.status(400).json({ error: result.error });
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

  // ----------------------------------------------------
  // RELATIONALLY STRUCTURED SYSTEM ENDPOINTS: categories, accounts, tags
  // ----------------------------------------------------

  // Categories Endpoints
  app.post('/api/db/categories', (req, res) => {
    try {
      const db = readDatabase();
      const newCategory = {
        id: 'cat_' + Date.now(),
        nome: req.body.nome || 'Nova Categoria',
        tipo: req.body.tipo || 'despesa',
        cor: req.body.cor || '#3b82f6'
      };
      if (!db.categories) db.categories = [];
      db.categories.unshift(newCategory);
      writeDatabase(db);
      res.json(newCategory);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Accounts Endpoints
  app.post('/api/db/accounts', (req, res) => {
    try {
      const db = readDatabase();
      const newAccount = {
        id: 'acc_' + Date.now(),
        nome: req.body.nome || 'Nova Conta',
        tipo: req.body.tipo || 'carteira',
        saldo_inicial: parseFloat(req.body.saldo_inicial) || 0,
        saldo_atual: parseFloat(req.body.saldo_inicial) || 0,
        cor: req.body.cor || '#3b82f6'
      };
      if (!db.accounts) db.accounts = [];
      db.accounts.unshift(newAccount);
      writeDatabase(db);
      res.json(newAccount);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Tags Endpoints
  app.post('/api/db/tags', (req, res) => {
    try {
      const db = readDatabase();
      const newTag = {
        id: 'tag_' + Date.now(),
        nome: req.body.nome || 'Nova Tag',
        cor: req.body.cor || '#3b82f6'
      };
      if (!db.tags) db.tags = [];
      db.tags.unshift(newTag);
      writeDatabase(db);
      res.json(newTag);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // NEW TABLES ENDPOINTS: salaries, creditCards, cardExpenses
  // ----------------------------------------------------

  // Salaries Endpoints
  app.post('/api/db/salaries', (req, res) => {
    try {
      const db = readDatabase();
      const newSalary = {
        id: 'sal_' + Date.now(),
        valor: parseFloat(req.body.valor) || 0,
        categoria: req.body.categoria || 'Geral',
        descricao: req.body.descricao || '',
        data_prevista: req.body.data_prevista || new Date().toISOString().split('T')[0],
        quitada: !!req.body.quitada,
        data_pagamento: req.body.data_pagamento || null
      };
      if (!db.salaries) db.salaries = [];
      db.salaries.unshift(newSalary);
      writeDatabase(db);
      res.json(newSalary);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/db/salaries/:id', (req, res) => {
    try {
      const db = readDatabase();
      if (!db.salaries) db.salaries = [];
      const index = db.salaries.findIndex(s => s.id === req.params.id);
      if (index !== -1) {
        db.salaries[index] = {
          ...db.salaries[index],
          ...req.body
        };
        writeDatabase(db);
        res.json(db.salaries[index]);
      } else {
        res.status(404).json({ error: 'Salário não encontrado' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Credit Cards Endpoints
  app.post('/api/db/credit-cards', (req, res) => {
    try {
      const db = readDatabase();
      const newCard = {
        id: 'card_' + Date.now(),
        nome: req.body.nome || 'Novo Cartão',
        limite: parseFloat(req.body.limite) || 0,
        dia_fechamento: parseInt(req.body.dia_fechamento) || 5,
        dia_vencimento: parseInt(req.body.dia_vencimento) || 12,
        cor: req.body.cor || '#8b5cf6'
      };
      if (!db.creditCards) db.creditCards = [];
      db.creditCards.unshift(newCard);
      writeDatabase(db);
      res.json(newCard);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/db/credit-cards/:id', (req, res) => {
    try {
      const db = readDatabase();
      if (!db.creditCards) db.creditCards = [];
      const index = db.creditCards.findIndex(c => c.id === req.params.id);
      if (index !== -1) {
        db.creditCards[index] = {
          ...db.creditCards[index],
          ...req.body
        };
        writeDatabase(db);
        res.json(db.creditCards[index]);
      } else {
        res.status(404).json({ error: 'Cartão não encontrado' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Card Expenses Endpoints
  app.post('/api/db/card-expenses', (req, res) => {
    try {
      const db = readDatabase();
      const newExpense = {
        id: 'cexp_' + Date.now(),
        cartao_id: req.body.cartao_id,
        valor: parseFloat(req.body.valor) || 0,
        categoria: req.body.categoria || 'Outros',
        descricao: req.body.descricao || '',
        data: req.body.data || new Date().toISOString().split('T')[0],
        parcelas: parseInt(req.body.parcelas) || 1,
        quitada: !!req.body.quitada
      };
      if (!db.cardExpenses) db.cardExpenses = [];
      db.cardExpenses.unshift(newExpense);
      writeDatabase(db);
      res.json(newExpense);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/db/card-expenses/:id', (req, res) => {
    try {
      const db = readDatabase();
      if (!db.cardExpenses) db.cardExpenses = [];
      const index = db.cardExpenses.findIndex(e => e.id === req.params.id);
      if (index !== -1) {
        db.cardExpenses[index] = {
          ...db.cardExpenses[index],
          ...req.body
        };
        writeDatabase(db);
        res.json(db.cardExpenses[index]);
      } else {
        res.status(404).json({ error: 'Despesa de cartão não encontrada' });
      }
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
      const appUrl = req.body.appUrl || process.env.APP_URL || 'http://localhost:3000';
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

  // Diagnostic test endpoint for Telegram Bot
  app.get('/api/test-telegram', async (req, res) => {
    try {
      const profile = getProfile();
      const token = profile.telegramBotToken;
      const chatId = profile.telegramChatId;
      
      const debugInfo = {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        chatId: chatId || null,
        envBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
        envChatId: !!process.env.TELEGRAM_CHAT_ID,
      };

      if (!token) {
        return res.status(400).json({ 
          error: 'Token do Telegram Bot não configurado (vazio).',
          debugInfo
        });
      }

      const testChatId = req.query.chat_id as string || chatId;

      if (!testChatId) {
        return res.status(400).json({ 
          error: 'Chat ID do Telegram não configurado (vazio) e nenhum query param chat_id foi fornecido.',
          debugInfo
        });
      }

      const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: testChatId,
          text: `🔔 **Teste de Diagnóstico do LifeOS AI!**\nSeu servidor e o Bot estão se comunicando com sucesso.\n\n⚙️ **Informações:**\n- Chat ID testado: \`${testChatId}\``,
          parse_mode: 'Markdown'
        })
      });

      const data = await response.json() as any;
      res.json({
        success: data.ok,
        telegramResponse: data,
        debugInfo
      });
    } catch (err: any) {
      res.status(500).json({ 
        error: 'Erro no pipeline de teste do Telegram.', 
        message: err.message 
      });
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
      console.log('[Telegram Webhook] Received message:', text, 'from chatId:', chatId);
      console.log('[Telegram Webhook] Bot token exists:', !!profile.telegramBotToken);
      console.log('[Telegram Webhook] Profile Chat ID configured:', profile.telegramChatId);
      
      // Auto-bind telegramChatId if not configured yet
      if (!profile.telegramChatId) {
        console.log(`[Telegram Bot] No telegramChatId set. Auto-binding to chatId: ${chatId}`);
        updateProfile({ telegramChatId: String(chatId) });
        profile.telegramChatId = String(chatId);
      } else if (String(chatId) !== String(profile.telegramChatId)) {
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
        try {
          if (isCommand(text)) {
            const { response, handled } = await handleCommand(text, history);
            reply = handled ? response : `❓ Comando não reconhecido. Use /help para ver os disponíveis.`;
          } else {
            let intent = 'chat';
            let extracted_data: any = {};
            let routerSuccess = false;
            
            // Try running router AI
            try {
              const routerRes = await runRouter(text);
              intent = routerRes.intent;
              extracted_data = routerRes.extracted_data;
              routerSuccess = true;
            } catch (routerErr: any) {
              console.warn('[Telegram Webhook] AI Router failed, using fallback regex parsing:', routerErr.message);
              
              // Smart Regex Fallback: "Gasto Uber R$ 42.90"
              const valMatch = text.match(/(?:R\$|r\$|\$)\s*([0-9]+(?:[.,][0-9]{2})?)/) || text.match(/([0-9]+(?:[.,][0-9]{2})?)\s*(?:reais|reais)/);
              if (valMatch) {
                const valor = parseFloat(valMatch[1].replace(',', '.'));
                intent = text.toLowerCase().includes('receb') || text.toLowerCase().includes('ganh') ? 'income' : 'expense';
                extracted_data = {
                  valor,
                  categoria: text.toLowerCase().includes('uber') || text.toLowerCase().includes('transp') ? 'Transporte' : 'Geral',
                  descricao: text.substring(0, 45)
                };
              }
            }

            // Execute database transaction
            const actionRes = await executeFromIntent(intent, extracted_data, 'telegram');

            // Try running persona AI response
            try {
              if (routerSuccess) {
                reply = await runPersona(text, history);
              } else {
                throw new Error('Fallback active');
              }
            } catch (personaErr: any) {
              console.warn('[Telegram Webhook] Persona AI failed, using template fallback:', personaErr.message);
              
              if (actionRes.success && (intent === 'expense' || intent === 'income')) {
                const isIncome = intent === 'income';
                reply = `✅ **[CFO Padrão]** ${isIncome ? 'Receita' : 'Despesa'} registrada no banco de dados!\n\n📝 **Descrição:** ${extracted_data.descricao || 'Registro via Telegram'}\n💰 **Valor:** R$ ${Number(extracted_data.valor).toFixed(2)}\n📂 **Categoria:** ${extracted_data.categoria || 'Geral'}\n\n⚠️ *Nota: O seu registro foi salvo com sucesso, mas a IA de conversação personalizada está indisponível. Verifique se a sua **Gemini API Key** está configurada nos Ajustes.*`;
              } else {
                reply = `🤖 **[Mobilis Executive]** Recebi seu texto: "${text}".\n\n⚠️ *Não foi possível rodar a Inteligência Artificial (Gemini) para processar os dados ou gerar uma resposta. Por favor, verifique se a sua API Key está salva corretamente nos Ajustes do painel.*`;
              }
            }
          }
        } catch (pipelineErr: any) {
          console.error('[Telegram Webhook] Pipeline crash:', pipelineErr.message);
          reply = `🤖 **[Mobilis Executive]** Olá! Recebi sua mensagem, mas ocorreu uma falha interna no processamento. Certifique-se de configurar as chaves de API nos Ajustes do aplicativo.`;
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
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
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
  }

  if (process.env.VERCEL) {
    // In Vercel serverless environment, we return the configured app instance
    return app;
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LifeOS AI] Server running smoothly on http://localhost:${PORT}`);
  });
  return app;
}

const appPromise = startServer();

// Vercel serverless function entrypoint handler
export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
