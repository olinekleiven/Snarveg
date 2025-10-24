# Refaktorering av Snarveg-prosjektet 🎯

## Oversikt

Prosjektet har blitt refaktorert for bedre struktur og vedlikeholdbarhet, uten å endre noe visuelt. Alle layout, farger, typografi og interaksjoner er bevart nøyaktig som før.

## Hva er endret

### 1. Ny mappestruktur

```
/src
├── /types              # Alle TypeScript types samlet
│   └── index.ts
├── /utils              # Hjelpefunksjoner og konstanter
│   ├── constants.ts
│   └── helpers.ts
└── /components         # (Planlagt for fremtiden)
```

### 2. Types (`/src/types/index.ts`)

Alle TypeScript-typer er nå samlet på ett sted:

```typescript
- Destination     // Destinasjonsnode på hjulet
- Connection      // Forbindelse mellom noder
- Route           // Komplett reiserute
- UserPreferences // Brukerinnstillinger
```

**Fordeler:**
- ✅ Én enkelt kilde for alle types
- ✅ Lettere å vedlikeholde
- ✅ Unngår duplisering
- ✅ Bedre IntelliSense i editoren

### 3. Constants (`/src/utils/constants.ts`)

Alle konstanter er flyttet hit:

```typescript
- INITIAL_DESTINATIONS  // Startdestinasjoner på hjulet
- TRANSPORT_MODE_EMOJIS // Tilgjengelige transportmidler
- STORAGE_KEYS          // LocalStorage nøkler
```

**Fordeler:**
- ✅ Enkelt å endre verdier på ett sted
- ✅ Type-sikre konstanter
- ✅ Forhindrer hardkoding

### 4. Helpers (`/src/utils/helpers.ts`)

Forretningslogikk og hjelpefunksjoner:

```typescript
- buildRouteFromConnections()     // Bygger rute fra forbindelser
- getRandomTransportMode()        // Henter tilfeldig transportmiddel
- connectionExists()              // Sjekker om forbindelse eksisterer
- hasOutgoingConnection()         // Sjekker om node har utgående forbindelse
- rebuildConnectionsFromOrder()   // Rebuilder forbindelser fra ny rekkefølge
- checkActiveTicket()             // Sjekker om bruker har aktiv billett
```

**Fordeler:**
- ✅ Enklere å teste
- ✅ Gjenbrukbar logikk
- ✅ Mindre kode i komponenter
- ✅ Bedre separasjon av concerns

### 5. Oppdatert App.tsx

App.tsx er oppdatert til å bruke de nye utils og types:

**Før:**
```typescript
const initialDestinations: Destination[] = [ ... ];
const transportModeEmojis = [ ... ];

// Kompleks logikk direkte i komponenten
const buildRouteFromConnections = () => {
  // 30 linjer kode her
};
```

**Etter:**
```typescript
import { INITIAL_DESTINATIONS, TRANSPORT_MODE_EMOJIS, STORAGE_KEYS } from './src/utils/constants';
import { buildRouteFromConnections, ... } from './src/utils/helpers';

// Enkel funksjonskall
const handleBuildRoute = () => {
  const newRoute = buildRouteFromConnections(connections);
  if (newRoute) {
    setCurrentRoute(newRoute);
    setViewMode('route');
  }
};
```

**Fordeler:**
- ✅ Mer lesbar kode
- ✅ Mindre kompleksitet
- ✅ Lettere å forstå dataflyt

## Bakoverkompatibilitet

Den gamle `/components/travel/types.ts` er oppdatert til å re-eksportere fra `/src/types`:

```typescript
export type { Destination, Connection, Route, UserPreferences } from '../../src/types';
```

Dette betyr at eksisterende importer fortsatt fungerer uten endringer!

## Visuelle endringer

**INGEN!** 🎉

All visuell design, layout, farger, typografi og interaksjoner er 100% bevart. Dette er kun en kode-organisasjonsoppdatering.

## Testing

For å verifisere at alt fungerer:

1. ✅ Start appen: `npm run dev`
2. ✅ Sjekk at onboarding vises for nye brukere
3. ✅ Test navigasjonshjulet (drag-and-drop)
4. ✅ Bygg en rute og se at den vises korrekt
5. ✅ Test billettkjøp
6. ✅ Sjekk forsinkelsesmeldinger
7. ✅ Test settings-modal

Alt skal fungere akkurat som før! ✨

## Neste steg for videre refaktorering

### Fase 2 (Komponenter)
- Flytte komponenter fra `/components/travel` til `/src/components`
- Organisere i logiske mapper (common, navigation, route, tickets, modals)

### Fase 3 (Pages)
- Opprette `/src/pages`
- Lage `HomePage.tsx` og `RoutePage.tsx`
- Forenkle App.tsx ytterligere

### Fase 4 (Testing & Quality)
- Legge til unit tests for utils
- Legge til component tests
- Implementere error boundaries
- Legge til logging

### Fase 5 (Performance)
- Code splitting
- Lazy loading av komponenter
- Optimalisere re-renders
- Bundle size optimization

## Kodekonvensjoner

Følgende konvensjoner er etablert:

- **PascalCase**: Komponenter, Types, Interfaces
- **camelCase**: Funksjoner, variabler, props
- **UPPER_SNAKE_CASE**: Konstanter, enum-lignende objekter
- **kebab-case**: Filnavn for ikke-komponenter

## Ressurser

- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Motion (Framer Motion) Documentation](https://motion.dev/)

## Spørsmål?

Hvis noe er uklart eller ikke fungerer som forventet, sjekk:

1. Konsollen for feilmeldinger
2. At alle imports er korrekte
3. At TypeScript-types matcher
4. At localStorage ikke er korrupt (clear ved behov)

---

**Refaktorert:** Oktober 2025
**Mål:** Bedre kodeorganisasjon uten visuelle endringer
**Status:** ✅ Ferdig - klar for videre utvikling
