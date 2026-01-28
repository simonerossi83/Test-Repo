# Email Service con Template Responsive e Gestione Errori

Sistema di invio email robusto con template HTML responsive e gestione completa degli errori (retry/logging/fallback).

## 🎯 Caratteristiche

### ✉️ Template Email
- **Template HTML responsive** ottimizzato per tutti i client email
- **Compatibilità cross-client** (Gmail, Outlook, Apple Mail, etc.)
- **Design moderno** con gradiente e stili inline
- **Supporto mobile** con media queries responsive
- **Variabili dinamiche** per personalizzazione contenuti

### 🔄 Gestione Errori Robusta
- **Retry automatico** con exponential backoff
- **Logging dettagliato** di tutti gli errori
- **Classificazione errori** (retryable vs non-retryable)
- **Meccanismo di fallback** per evitare ghosting utenti
- **Timeout configurabili** per prevenire blocchi
- **Monitoraggio stato** invii

## 📁 Struttura Progetto

```
.
├── config/
│   └── email.config.js      # Configurazione SMTP e parametri
├── src/
│   ├── emailService.js      # Servizio email principale
│   └── example.js           # Esempio di utilizzo
├── templates/
│   └── confirmationEmail.html  # Template email responsive
├── tests/
│   └── testEmailService.js  # Suite di test
├── logs/                    # Directory log (auto-creata)
│   ├── email-errors.log     # Log errori dettagliati
│   └── email-fallback.log   # Log fallback quando email fallisce
└── package.json
```

## 🚀 Installazione

```bash
# Installa le dipendenze
npm install
```

## ⚙️ Configurazione

### Opzione 1: Variabili d'ambiente

Crea un file `.env`:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
EMAIL_FROM="Il Tuo Servizio" <noreply@example.com>
MAX_RETRIES=3
RETRY_DELAY=1000
RETRY_BACKOFF=2
EMAIL_TIMEOUT=10000
LOG_ERRORS=true
```

### Opzione 2: Configurazione diretta

Modifica `config/email.config.js` con i tuoi parametri SMTP.

### Provider SMTP Supportati

Il servizio è compatibile con tutti i provider SMTP standard:

- **Gmail** (usa app password)
- **SendGrid**
- **AWS SES**
- **Mailgun**
- **Postmark**
- Altri provider SMTP

Esempi di configurazione disponibili in `config/email.config.js`.

## 📖 Utilizzo

### Esempio Base

```javascript
const EmailService = require('./src/emailService');

// Inizializza il servizio
const emailService = new EmailService({
    smtp: {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        user: 'your-email@example.com',
        pass: 'your-password'
    },
    maxRetries: 3,
    retryDelay: 2000,
    retryBackoffMultiplier: 2
});

// Invia email di conferma
const result = await emailService.sendConfirmationEmail(
    'user@example.com',
    'Mario Rossi',
    'https://example.com/confirm?token=abc123'
);

if (result.success) {
    console.log('Email inviata con successo!');
} else {
    console.error('Invio fallito:', result.error);
}
```

### Esegui l'esempio

```bash
npm run example
```

Questo comando:
1. Verifica la connessione SMTP
2. Invia un'email di conferma di test
3. Mostra l'URL di preview (per account di test)
4. Gestisce automaticamente retry ed errori

## 🧪 Test

Esegui la suite di test completa:

```bash
npm test
```

La suite include test per:
- ✅ Inizializzazione servizio
- ✅ Caricamento template
- ✅ Verifica connessione
- ✅ Invio email con successo
- ✅ Logica di retry
- ✅ Classificazione errori

## 🔧 Configurazione Retry

Il servizio supporta configurazione flessibile del meccanismo di retry:

```javascript
const emailService = new EmailService({
    maxRetries: 3,              // Numero massimo di tentativi
    retryDelay: 1000,           // Delay iniziale (ms)
    retryBackoffMultiplier: 2,  // Moltiplicatore per exponential backoff
    timeout: 10000              // Timeout per ogni tentativo (ms)
});
```

### Comportamento Retry

- **Attempt 1**: Delay 1000ms
- **Attempt 2**: Delay 2000ms (1000 × 2)
- **Attempt 3**: Delay 4000ms (2000 × 2)

## 📊 Logging

### Log Errori (`logs/email-errors.log`)

Ogni errore viene registrato in formato JSON con:
- Timestamp
- Messaggio errore
- Codice errore
- Contesto (destinatario, oggetto, tentativo)
- Stack trace completo

### Log Fallback (`logs/email-fallback.log`)

Quando tutti i tentativi falliscono, viene registrato:
- Timestamp
- Destinatario
- Username
- URL di conferma
- Motivo del fallback

## 🛡️ Gestione Errori

### Errori Retryable

Il servizio riprova automaticamente per:
- `ETIMEDOUT` - Timeout di connessione
- `ECONNRESET` - Connessione resettata
- `ECONNREFUSED` - Connessione rifiutata
- `ENOTFOUND` - Host non trovato
- Codici SMTP 4xx (errori temporanei)

### Errori Non-Retryable

Il servizio **NON** riprova per:
- `EAUTH` - Errore di autenticazione
- Codici SMTP 5xx (errori permanenti)
- Errori di validazione

## 🔄 Meccanismo Fallback

Quando l'invio fallisce definitivamente, il sistema:

1. ✅ **Logga** i dettagli in `email-fallback.log`
2. ✅ **Notifica** l'amministratore via console
3. ⚠️ **Suggerisce** azioni da implementare:
   - Aggiungere a coda job per retry futuro
   - Inviare alert al sistema di monitoraggio
   - Fornire metodo di verifica alternativo all'utente

### Implementazione Produzione

Per un sistema production-ready, implementa:

```javascript
handleFallback(to, username, confirmationUrl) {
    // 1. Aggiungi a job queue (es. Bull, BeeQueue)
    await jobQueue.add('retry-email', {
        to, username, confirmationUrl
    });
    
    // 2. Invia alert a monitoring (es. Sentry, DataDog)
    await monitoring.alert('email_delivery_failed', {
        to, username
    });
    
    // 3. Aggiorna database utente
    await db.updateUser(username, {
        emailStatus: 'pending_retry'
    });
    
    // 4. Fornisci metodo alternativo
    await showManualVerificationOption(username);
}
```

## 📧 Template Email

Il template `confirmationEmail.html` include:

- **Design responsive** - si adatta a mobile e desktop
- **Stili inline** - compatibilità massima con client email
- **Fallback Outlook** - supporto MSO condizionale
- **Gradiente moderno** - header accattivante
- **CTA prominente** - bottone di conferma ben visibile
- **Testo alternativo** - link copiabile per backup
- **Avviso scadenza** - indica validità 24 ore
- **Nota sicurezza** - informa su cosa fare se email non richiesta
- **Footer completo** - copyright e contatti supporto

### Variabili Template

- `{{username}}` - Nome utente
- `{{confirmationUrl}}` - URL di conferma

## 🔐 Best Practices Sicurezza

1. **Non committare credenziali** - usa variabili d'ambiente
2. **Usa app password** - per Gmail e provider simili
3. **Implementa rate limiting** - previeni abusi
4. **Valida input** - sanitizza email e URL
5. **Token scadenza** - URL di conferma con timeout
6. **HTTPS obbligatorio** - per URL di conferma
7. **Log rotation** - gestisci dimensione file log

## 🚨 Troubleshooting

### Email non viene inviata

1. Verifica credenziali SMTP
2. Controlla `logs/email-errors.log`
3. Esegui verifica connessione:

```javascript
const isReady = await emailService.verifyConnection();
```

### Errore "Authentication failed"

- Gmail: usa [app password](https://support.google.com/accounts/answer/185833)
- Verifica username/password corretti
- Controlla se account richiede 2FA

### Timeout continui

- Aumenta `timeout` nella configurazione
- Verifica connessione di rete
- Controlla firewall/proxy

## 📝 Licenza

MIT

## 🤝 Contributi

I contributi sono benvenuti! Sentiti libero di aprire issue o pull request.

## 📞 Supporto

Per domande o problemi, apri un issue su GitHub.

---

**Nota**: Questo sistema è progettato per **evitare ghosting degli utenti**. Se l'invio fallisce, viene sempre registrato e attivato il meccanismo di fallback per garantire che l'utente non venga ignorato silenziosamente.
