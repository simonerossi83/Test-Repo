# Sistema di Messaggistica con Conferma Email Automatica

Un'applicazione web semplice che permette agli utenti di inviare messaggi e ricevere automaticamente una conferma via email.

## Caratteristiche

- ✉️ **Conferma Email Automatica**: Gli utenti ricevono immediatamente una conferma via email quando inviano un messaggio
- 🎯 **Interfaccia Intuitiva**: Form web semplice e facile da usare
- 🔒 **Validazione**: Controllo dei campi richiesti prima dell'invio
- 📝 **Archiviazione Messaggi**: I messaggi vengono salvati per riferimento futuro
- 🧪 **Modalità Test**: Possibilità di testare l'applicazione senza inviare email reali

## Requisiti

- Python 3.7 o superiore
- pip (gestore pacchetti Python)

## Installazione

1. Clona il repository:
```bash
git clone https://github.com/simonerossi83/Test-Repo.git
cd Test-Repo
```

2. Installa le dipendenze:
```bash
pip install -r requirements.txt
```

3. (Opzionale) Configura le impostazioni email:
```bash
cp .env.example .env
# Modifica .env con le tue credenziali SMTP
```

## Utilizzo

### Avvio dell'Applicazione

```bash
python app.py
```

L'applicazione sarà disponibile su `http://localhost:5000`

### Invio di un Messaggio

1. Apri il browser e vai su `http://localhost:5000`
2. Compila il form con:
   - Nome
   - Email
   - Messaggio
3. Clicca su "Invia Richiesta"
4. Riceverai una conferma nella pagina e un'email automatica

### Modalità Test vs Produzione

Per impostazione predefinita, l'applicazione funziona in **modalità test**, dove le email vengono solo registrate nei log invece di essere inviate realmente.

Per abilitare l'invio reale di email:

1. Configura le credenziali SMTP nel file `.env`:
```
EMAIL_MODE=production
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=tuo-email@example.com
SENDER_PASSWORD=tua-password-app
```

2. Riavvia l'applicazione

## API Endpoints

### POST /api/submit-message
Invia un nuovo messaggio e ricevi conferma via email.

**Richiesta:**
```json
{
  "name": "Mario Rossi",
  "email": "mario.rossi@example.com",
  "message": "Il mio messaggio"
}
```

**Risposta (Successo - 200):**
```json
{
  "message": "Grazie Mario Rossi! La tua richiesta è stata ricevuta...",
  "success": true
}
```

**Risposta (Errore - 400):**
```json
{
  "error": "Campi mancanti. Nome, email e messaggio sono richiesti."
}
```

### GET /api/messages
Recupera tutti i messaggi inviati (per scopi di demo).

**Risposta:**
```json
{
  "messages": [
    {
      "name": "Mario Rossi",
      "email": "mario.rossi@example.com",
      "message": "Il mio messaggio"
    }
  ]
}
```

## Test

Esegui i test con pytest:

```bash
pytest test_app.py -v
```

I test includono:
- Test del caricamento della pagina
- Test di invio messaggio con successo
- Test di validazione campi
- Test di conferma email in modalità test
- Test di recupero messaggi

## Struttura del Progetto

```
Test-Repo/
├── app.py              # Applicazione Flask principale
├── email_service.py    # Servizio per l'invio email
├── config.py           # Configurazione applicazione
├── test_app.py         # Test suite
├── requirements.txt    # Dipendenze Python
├── .env.example        # Esempio configurazione ambiente
└── README.md           # Documentazione
```

## Configurazione Email (Gmail)

Se usi Gmail, segui questi passaggi:

1. Attiva la verifica in due passaggi sul tuo account Google
2. Genera una "Password per app" nelle impostazioni di sicurezza Google
3. Usa questa password nel file `.env` come `SENDER_PASSWORD`

## Risoluzione Problemi

### L'email non viene inviata
- Verifica che `EMAIL_MODE` sia impostato su `production`
- Controlla le credenziali SMTP nel file `.env`
- Verifica che il tuo provider email permetta connessioni SMTP

### Errori di validazione
- Assicurati che tutti i campi (nome, email, messaggio) siano compilati
- Verifica che l'email sia in un formato valido

## Licenza

Questo è un progetto di test per dimostrare la funzionalità di conferma email automatica.
