# Painel de Vida

App pessoal de organização, clareza mental e execução de tarefas.

**Stack:** React + Vite + TypeScript + Firebase

---

## Setup

### 1. Clone e instale

```bash
git clone <repo-url>
cd vida-app
npm install
```

### 2. Configure o Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um projeto novo
3. Ative **Authentication** → Email/senha
4. Ative **Firestore Database** → modo produção
5. Ative **Hosting**
6. Vá em Configurações do projeto → Seus apps → Web app → copie as credenciais

Crie o arquivo `.env` na raiz:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Atualize o `.firebaserc`

```json
{
  "projects": {
    "default": "SEU-PROJECT-ID-AQUI"
  }
}
```

### 4. Regras do Firestore

No console do Firebase → Firestore → Regras, cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /tasks/{id} {
      allow create: if request.auth != null;
    }
    match /ideas/{id} {
      allow create: if request.auth != null;
    }
    match /distractions/{id} {
      allow create: if request.auth != null;
    }
    match /discarded/{id} {
      allow create: if request.auth != null;
    }
    match /direction/{id} {
      allow create: if request.auth != null;
    }
    match /daily_logs/{id} {
      allow create: if request.auth != null;
    }
  }
}
```

---

## Desenvolvimento

```bash
npm run dev
```

Abre em `http://localhost:5173`

---

## Deploy

```bash
# Instalar Firebase CLI (uma vez)
npm install -g firebase-tools
firebase login

# Deploy completo
npm run deploy
```

---

## Estrutura

```
src/
├── context/
│   └── AuthContext.tsx       # Auth state global
├── hooks/
│   ├── useTasks.ts           # CRUD de tarefas
│   ├── useDirection.ts       # Direção de vida
│   ├── useIdeas.ts           # Ideias, distrações, descartadas
│   └── useDailyLog.ts        # Review diário
├── components/
│   ├── Layout.tsx            # Sidebar + nav
│   ├── TaskItem.tsx          # Item individual de tarefa
│   ├── TaskList.tsx          # Lista de tarefas
│   ├── QuickAdd.tsx          # Modal de criação rápida
│   ├── WeeklyFocus.tsx       # Foco da semana
│   ├── DailyReview.tsx       # Formulário de review
│   ├── IdeasBlock.tsx        # Bloco de ideias/distrações
│   └── DirectionBlock.tsx    # Formulário de direção
├── pages/
│   ├── Login.tsx
│   ├── Hoje.tsx              # Dashboard principal
│   ├── LimparCabeca.tsx      # Ideias e bloqueios
│   ├── Direcao.tsx           # Direção de vida
│   └── Evolucao.tsx          # Reviews + padrões
├── types/
│   └── index.ts              # Todos os tipos TypeScript
├── styles/
│   └── globals.css           # Design system completo
├── firebase.ts               # Inicialização Firebase
├── App.tsx                   # Router + rotas protegidas
└── main.tsx                  # Entry point
```

---

## Coleções Firestore

| Coleção | Campos principais |
|---|---|
| `tasks` | userId, title, date, priority, status, impact, reason |
| `ideas` | userId, content |
| `distractions` | userId, text |
| `discarded` | userId, text |
| `direction` | userId, lifeDirection, idealSelf, weeklyFocus[], values[] |
| `daily_logs` | userId, date, good, bad, improve |
