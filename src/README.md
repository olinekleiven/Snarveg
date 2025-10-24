# Snarveg - Smart reiseplanlegging 🚀

En mobil reise- og navigasjonsapp med sirkulært navigasjonshjul og intelligente ruteanbefalinger.

## 📁 Prosjektstruktur

```
/
├── App.tsx                          # Hovedapplikasjonen
├── /src
│   ├── /components
│   │   ├── /common                  # Felleskomponenter
│   │   │   ├── AnimatedBackground.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── ParticleEffect.tsx
│   │   │   └── Confetti.tsx
│   │   ├── /navigation              # Navigasjonshjul og relatert
│   │   │   ├── NavigationWheel.tsx
│   │   │   ├── DestinationNode.tsx
│   │   │   ├── ConnectionLine.tsx
│   │   │   └── DrawingLine.tsx
│   │   ├── /route                   # Rutevisning
│   │   │   └── RouteVisualization.tsx
│   │   ├── /tickets                 # Billettfunksjonalitet
│   │   │   ├── TicketButton.tsx
│   │   │   ├── TicketOverview.tsx
│   │   │   └── TicketView.tsx
│   │   ├── /modals                  # Modaler
│   │   │   ├── EditDestinationModal.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   └── AddDestinationModal.tsx
│   │   ├── /onboarding              # Onboarding flow
│   │   │   └── OnboardingFlow.tsx
│   │   ├── /map                     # Kartvisning
│   │   │   └── MapView.tsx
│   │   └── /ui                      # Shadcn UI komponenter
│   ├── /types                        # TypeScript types
│   │   └── index.ts
│   ├── /utils                        # Hjelpefunksjoner
│   │   ├── constants.ts
│   │   └── helpers.ts
│   └── /styles                       # Globale stiler
│       └── globals.css
├── /components
│   ├── /travel                       # (Gammel struktur - kan slettes)
│   ├── /ui                           # Shadcn UI komponenter
│   └── /figma                        # Figma-relatert (IKKE slett)
│       └── ImageWithFallback.tsx
└── /styles
    └── globals.css                   # Tailwind CSS variabler

```

## 🚀 Kom i gang

```bash
# Installer avhengigheter
npm install

# Start utviklingsserver
npm run dev
```

## 🎨 Design

- **Designsystem**: Skandinavisk minimalistisk design
- **Fargepalett**: Lyse bakgrunner, myke gradienter, rolige blå-grå toner
- **Typografi**: Ren sans-serif
- **Interaksjon**: Drag-and-drop, hold-to-lock, touch-optimalisert

## 🏗️ Arkitektur

### Komponenter

- **common/** - Gjenbrukbare UI-komponenter som kan brukes overalt
- **navigation/** - Alt relatert til navigasjonshjulet
- **route/** - Ruteplanlegging og visualisering
- **tickets/** - Billettkjøp og håndtering  
- **modals/** - Modaler for redigering og innstillinger
- **onboarding/** - Førstegangsopplevelse
- **map/** - Kartintegrasjon

### Types

Alle TypeScript-typer er samlet i `/src/types/index.ts`:
- `Destination` - Destinasjonsnode
- `Connection` - Forbindelse mellom noder
- `Route` - Komplett rute
- `UserPreferences` - Brukerinnstillinger

### Utils

Hjelpefunksjoner og konstanter:
- `constants.ts` - Faste verdier (transportmidler, initial data, etc.)
- `helpers.ts` - Hjelpefunksjoner for rutebygging, validering, etc.

## 📱 Funksjonalitet

1. **Navigasjonshjul** - Sirkulært interface for å velge destinasjoner
2. **Drag-and-drop** - Trekk mellom noder for å lage ruter
3. **Smart lås** - Hold inne for å låse forbindelser
4. **Rutevisualisering** - Se hele ruten med transport og tidspunkter
5. **Forsinkelsesmeldinger** - Sanntidsoppdateringer på transportforsinkelser
6. **Billettsystem** - Kjøp billetter basert på ruten din
7. **Onboarding** - Førstegangsopplevelse for nye brukere

## 🔧 Teknologi

- **React** - UI framework
- **TypeScript** - Type-sikkerhet
- **Tailwind CSS** - Styling
- **Motion (Framer Motion)** - Animasjoner
- **Lucide React** - Ikoner
- **Sonner** - Toast-notifikasjoner

## 📝 Kodekonvensjoner

- **PascalCase** for komponenter og typer
- **camelCase** for funksjoner og variabler
- **UPPER_SNAKE_CASE** for konstanter
- Funksjonelle komponenter med hooks
- Props interfaces definert i samme fil som komponent

## ✅ Ferdig refaktorering

- [x] Opprettet `/src/types` for alle TypeScript typer
- [x] Opprettet `/src/utils` for hjelpefunksjoner og konstanter
- [x] Oppdatert `App.tsx` til å bruke nye utils og types
- [x] Flyttet forretningslogikk ut av komponenter og inn i utils

## 🎯 Neste steg (for videre utvikling)

- [ ] Migrere alle komponenter fra `/components/travel` til `/src/components`
- [ ] Opprette `/src/pages` for bedre sidestruktur
- [ ] Dele opp store komponenter i mindre underkomponenter
- [ ] Legge til unit tests for utils og komponenter
- [ ] Implementere error boundaries
- [ ] Legge til logging og analytics

