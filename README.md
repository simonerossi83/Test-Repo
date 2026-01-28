# Test-Repo

Sistema di invio email di conferma per form di contatto.

## Descrizione

Questa applicazione implementa un servizio backend Node.js che gestisce l'invio di email di conferma automatiche quando un utente compila un form di contatto. Utilizza Express.js per il server web e Nodemailer per l'invio delle email tramite SMTP.

## Funzionalità

- ✅ Form di contatto web con interfaccia utente
- ✅ Validazione dei dati del form (lato server)
- ✅ Invio automatico di email di conferma all'utente
- ✅ Supporto per provider SMTP (Gmail, SendGrid, Mailgun, ecc.)
- ✅ Email con template HTML professionale
- ✅ Gestione errori completa

## Prerequisiti

- Node.js (versione 14 o superiore)
- npm (Node Package Manager)
- Un account email SMTP (Gmail, SendGrid, Mailgun, ecc.)

## Installazione

1. Clona il repository:
```bash
git clone https://github.com/simonerossi83/Test-Repo.git
cd Test-Repo
```

2. Installa le dipendenze:
```bash
npm install
```

3. Configura le variabili d'ambiente:
```bash
cp .env.example .env
```

4. Modifica il file `.env` con le tue credenziali SMTP:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tua-email@gmail.com
SMTP_PASS=tua-password-app
EMAIL_FROM="Form Submission <noreply@example.com>"
```

### Configurazione SMTP per provider popolari

#### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tua-email@gmail.com
SMTP_PASS=tua-password-app
```
**Nota:** Per Gmail, devi creare una "App Password" nelle impostazioni di sicurezza del tuo account Google.

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=tua-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@tuo-dominio.mailgun.org
SMTP_PASS=tua-mailgun-password
```

## Utilizzo

1. Avvia il server:
```bash
npm start
```

2. Apri il browser e vai su:
```
http://localhost:3000
```

3. Compila il form con:
   - Nome (obbligatorio)
   - Email (obbligatorio)
   - Telefono (opzionale)
   - Messaggio (obbligatorio)

4. Clicca "Invia" - riceverai automaticamente un'email di conferma all'indirizzo fornito.

## Struttura del Progetto

```
Test-Repo/
├── server.js           # Server Express principale con gestione form
├── emailService.js     # Modulo per invio email con Nodemailer
├── package.json        # Dipendenze e script npm
├── .env.example        # Template configurazione
├── .gitignore          # File da escludere da Git
└── README.md           # Questa documentazione
```

## API Endpoints

### `GET /`
Mostra il form HTML di contatto.

### `POST /submit-form`
Gestisce l'invio del form e invia l'email di conferma.

**Request Body:**
```json
{
  "nome": "Mario Rossi",
  "email": "mario.rossi@example.com",
  "telefono": "1234567890",
  "messaggio": "Ciao, vorrei maggiori informazioni..."
}
```

**Response (successo):**
```json
{
  "success": true,
  "message": "Form ricevuto con successo! Ti abbiamo inviato una email di conferma."
}
```

**Response (errore validazione):**
```json
{
  "success": false,
  "message": "Dati del form non validi",
  "errors": ["Il campo Nome è obbligatorio"]
}
```

### `GET /health`
Health check endpoint.

## Template Email

L'email di conferma include:
- Header con logo colorato
- Messaggio di benvenuto personalizzato
- Riepilogo dati form inviati
- Footer con informativa
- Versioni HTML e testo semplice

## Testing

Per testare il sistema:

1. Avvia il server in modalità di sviluppo
2. Apri il form nel browser
3. Compila con un indirizzo email valido
4. Verifica la ricezione dell'email di conferma

## Troubleshooting

### L'email non viene inviata

1. Verifica le credenziali SMTP nel file `.env`
2. Controlla che il firewall non blocchi la porta SMTP
3. Per Gmail, assicurati di usare una "App Password" invece della password normale
4. Controlla i log del server per messaggi di errore

### Errori di autenticazione SMTP

- Verifica username e password SMTP
- Controlla che il provider SMTP permetta connessioni da applicazioni esterne
- Alcuni provider richiedono l'abilitazione dell'accesso SMTP nelle impostazioni

## Sicurezza

- ⚠️ Non committare mai il file `.env` con credenziali reali
- ⚠️ Usa password/API key sicure
- ⚠️ In produzione, aggiungi rate limiting per prevenire spam
- ⚠️ Considera l'aggiunta di CAPTCHA per prevenire bot

## Contribuire

Pull request sono benvenute! Per modifiche importanti, apri prima una issue per discutere i cambiamenti proposti.

## Licenza

ISC

