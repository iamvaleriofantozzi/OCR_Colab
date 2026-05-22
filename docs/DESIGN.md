# Design System

## Nothing Design System Tokens

### Typography

| Role | Font | Weights |
|------|------|---------|
| Primary / UI | Space Grotesk | 400, 500 |
| Monospace / Data | Space Mono | 400 |
| Display / Hero | Doto | 400 |

Max 2 font families per screen.

### Light Mode (Default)

| Token | Hex |
|-------|-----|
| Background | `#F5F5F0` |
| Surface | `#FFFFFF` |
| Text Display | `#0A0A0A` |
| Text Primary | `#1A1A1A` |
| Text Secondary | `#666666` |
| Text Disabled | `#999999` |
| Border | `#E5E5E0` |
| Accent Red | `#D71921` |

### Dark Mode

| Token | Hex |
|-------|-----|
| Background | `#050505` |
| Surface | `#111111` |
| Text Display | `#F5F5F0` |
| Text Primary | `#E5E5E0` |
| Text Secondary | `#888888` |
| Text Disabled | `#555555` |
| Border | `#222222` |

### Spacing

- Tight: 4–8px
- Medium: 16px
- Wide: 32–48px
- Vast: 64–96px

### Component Rules

- **Button Primary**: Pill shape (`999px`), Space Grotesk 500
- **Button Secondary**: Technical shape (`4px` radius), 1px border
- **Input**: 4px radius, 1px border, focus = 1px `#0A0A0A`
- **Card**: Max 16px radius, NO shadow, NO blur
- **Status**: Space Mono ALL CAPS. `[PROCESSING...]`
- **Error**: Inline red text. NO toast, NO skeleton screens

### Anti-Patterns (Forbidden)

- Gradients, shadows, blur effects
- Skeleton loading screens
- Toast popups
- Filled / multi-color icons
- Border-radius > 16px on cards
- Background color changes on hover
