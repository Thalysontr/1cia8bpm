# Sistema ISEO — 1ª CIA / 8º BPM

Sistema de controle de Escalas ISEO · Força Tática · Colatina-ES

---

## 📁 Estrutura

```
1cia/
├── index.html          ← shell principal (login + nav + todos os módulos)
├── css/
│   └── styles.css      ← estilos completos do sistema
├── js/
│   ├── firebase.js     ← config Firebase (preencher antes de ativar)
│   ├── auth.js         ← login/logout (local + stub Firebase)
│   ├── db.js           ← CRUD localStorage + lista de militares
│   ├── app.js          ← roteamento e inicialização
│   ├── painel.js       ← dashboard principal
│   ├── vrte.js         ← controle de VRTE
│   ├── operacoes.js    ← cadastro de operações
│   ├── escala.js       ← nova escala (turnos + PDF + DOCX)
│   ├── escalas.js      ← histórico de escalas
│   ├── militares.js    ← cadastro e histórico de militares
│   ├── config.js       ← usuários, assinantes e dados
│   ├── ferias.js       ← (em desenvolvimento)
│   ├── dispensas.js    ← (em desenvolvimento)
│   └── audiencias.js   ← (em desenvolvimento)
└── modules/
    ├── painel.html     ← HTML do painel (referência)
    ├── vrte.html
    ├── operacoes.html
    ├── escala.html
    ├── escalas.html
    ├── militares.html
    └── config.html
```

---

## 🚀 Como usar (modo local — sem Firebase)

1. Abrir `index.html` em qualquer navegador moderno
2. Login padrão: `admin` / `1cia2026`
3. Todos os dados são salvos no `localStorage` do navegador

---

## 🔥 Ativar Firebase (opcional — para sincronização em nuvem)

1. Criar projeto em https://console.firebase.google.com
2. Ativar **Authentication** (Email/Senha) e **Firestore Database**
3. Preencher `js/firebase.js` com suas credenciais
4. No `index.html`, descomentar os scripts CDN do Firebase
5. Em `js/auth.js`, descomentar o bloco Firebase e comentar o bloco local
6. Em `js/db.js`, migrar os getters/setters de `localStorage` para Firestore

---

## 📦 Dependências externas

| Lib | Uso |
|-----|-----|
| JSZip 3.10.1 (CDN) | Geração de arquivos DOCX |
| Google Fonts | Playfair Display + DM Sans + DM Mono |
| Firebase (opcional) | Auth + Firestore |

---

## 🔑 Credenciais padrão

| Usuário | Senha | Perfil |
|---------|-------|--------|
| admin | 1cia2026 | Administrador |

> ⚠️ Alterar a senha padrão em **Configurações → Usuários** após o primeiro acesso.

---

## 📝 Versão

Sistema ISEO v8 — Abril/2026  
1ª Companhia / 8º BPM · PMES · Colatina-ES
