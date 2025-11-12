# Mobilvisning Setup Guide

## 🚀 Rask start

```bash
# Start serveren for mobilvisning
npm run mobile
```

Serveren kjører nå på `http://0.0.0.0:3000` og er tilgjengelig på alle nettverksgrensesnitt.

---

## 📱 Finne din IP-adresse

### macOS / Linux:
```bash
# Finn IP-adressen din
ifconfig | grep "inet " | grep -v 127.0.0.1

# Eller mer spesifikt:
ipconfig getifaddr en0        # Wi-Fi (macOS)
ipconfig getifaddr en1        # Ethernet (macOS)
hostname -I | awk '{print $1}' # Linux
```

### Windows:
```bash
ipconfig | findstr IPv4
```

**Eksempel:** Hvis IP-adressen din er `192.168.1.100`, åpner du på mobil:
```
http://192.168.1.100:3000
```

---

## ✅ Test at det fungerer

1. **Start serveren:**
   ```bash
   npm run mobile
   ```

2. **Sjekk at serveren kjører:**
   - Du skal se noe som: `Local: http://localhost:3000/`
   - Og: `Network: http://192.168.x.x:3000/`

3. **Test på mobil:**
   - Sørg for at mobilen er på samme Wi-Fi-nettverk
   - Åpne nettleseren på mobilen
   - Gå til: `http://[DIN-IP-ADRESSE]:3000`
   - Eksempel: `http://192.168.1.100:3000`

4. **Feilsøking:**
   - Sjekk at begge enheter er på samme Wi-Fi
   - Sjekk at brannmuren tillater port 3000
   - Prøv å pinge IP-adressen fra mobilen

---

## 🎬 Vise appen på scene

### Alternativ 1: Skjermspeiling (anbefalt)

#### macOS - QuickTime:
1. Koble iPhone til Mac med USB-kabel
2. Åpne QuickTime Player
3. Fil → Ny filmopptak
4. Velg iPhone som kamera
5. Fullskjerm QuickTime-vinduet på projektor

#### Android - scrcpy:
```bash
# Installer scrcpy
brew install scrcpy  # macOS
# eller
choco install scrcpy  # Windows

# Koble Android via USB og kjør:
scrcpy
```

### Alternativ 2: QR-kode

1. **Generer QR-kode:**
   ```bash
   # Installer qrcode-terminal (valgfritt)
   npm install -g qrcode-terminal
   
   # Når serveren kjører, vis QR-kode i terminal:
   echo "http://192.168.1.100:3000" | qrcode-terminal
   ```

2. **Eller bruk online QR-generator:**
   - Gå til: https://www.qr-code-generator.com/
   - Lim inn: `http://[DIN-IP]:3000`
   - Vis QR-koden på projektor
   - La publikum skanne med mobil

---

## 🏗️ Produksjonsversjon (build + serve)

For en raskere, optimalisert versjon under presentasjonen:

```bash
# Bygg og start produksjonsserver
npm run serve
```

Dette bygger appen og starter en statisk server på port 3000.

**For å endre port:**
```bash
npm run build
npx serve -s build -l 8080  # Port 8080
```

---

## 🔧 Konfigurasjon

### Vite (nåværende prosjekt)
Konfigurasjonen er allerede satt opp i `vite.config.ts`:
```typescript
server: {
  port: 3000,
  host: '0.0.0.0', // Tillater tilgang fra alle nettverksgrensesnitt
}
```

### Brannmur (macOS)
Hvis du får problemer, tillat port 3000:
```bash
# macOS - tillat port 3000
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

---

## 📝 Tilgjengelige kommandoer

| Kommando | Beskrivelse |
|----------|-------------|
| `npm run dev` | Normal utviklingsserver (kun localhost) |
| `npm run mobile` | Server for mobilvisning (0.0.0.0) |
| `npm run build` | Bygg produksjonsversjon |
| `npm run preview` | Forhåndsvisning av build (0.0.0.0) |
| `npm run serve` | Bygg + start statisk server |

---

## 🎯 Tips for presentasjon

1. **Test først:** Sjekk at alt fungerer før presentasjonen starter
2. **Backup-plan:** Ha en video/PDF klar hvis nettverket feiler
3. **Hotspot:** Hvis Wi-Fi er ustabil, bruk mobilens hotspot
4. **Fullskjerm:** Bruk nettleserens fullskjermmodus (F11 / Cmd+Ctrl+F)
5. **DevTools:** Skjul utviklerverktøy (F12) før presentasjonen

---

## ❓ Feilsøking

**Problem:** Mobilen kan ikke nå serveren
- ✅ Sjekk at begge er på samme Wi-Fi
- ✅ Sjekk IP-adressen (kan endre seg hvis du kobler til/fra)
- ✅ Prøv å pinge fra mobilen
- ✅ Sjekk brannmur-innstillinger

**Problem:** Serveren starter ikke
- ✅ Sjekk at port 3000 ikke er i bruk: `lsof -i :3000`
- ✅ Prøv en annen port i `vite.config.ts`

**Problem:** Appen laster ikke på mobil
- ✅ Sjekk at du bruker `http://` ikke `https://`
- ✅ Sjekk at portnummeret er riktig
- ✅ Prøv å åpne i inkognito-modus på mobilen

