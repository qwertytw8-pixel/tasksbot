# Wave 4 — Промпты для генерации изображений

## Палитра приложения

Все изображения должны соответствовать цветовой схеме Task Blo:

| Элемент | Light Mode | Dark Mode |
|---------|------------|-----------|
| Фон | `#eee8dc` (тёплый бежевый) | `#0f0f15` (глубокий тёмный) |
| Акцент | `#6d5dfc` (фиолетовый) | `#9d8fff` (лавандовый) |
| Градиент акцента | `#7b6bff → #5e4ef8` | `#8d7bff → #6e5cff` |
| Текст | `#15151b` (почти чёрный) | `#f3f1f6` (почти белый) |
| Тёплый фон | `#f5efe6` / `#f4edda` | `#232128` |
| Стекло (glass) | `rgba(255,255,255,0.86)` | `rgba(40,38,52,0.55)` |
| Опасность | `#e3534b` | `#ff8079` |
| Успех | `#1f9d63` | `#36c98a` |

**Стиль**: Liquid Glass (glassmorphism), мягкие тени, скруглённые углы (22px), blur-эффекты. Минимализм — мало текста, крупные элементы, чистый воздух.

---

## 1. Welcome (стартовая картинка /start)

**Файл**: `backend/assets/welcome.png`  
**Размер**: 800×500px (горизонтальная, для Telegram)

### Промпт:
```
A warm, minimal illustration for a Telegram productivity bot called "Task Blo". 
Warm beige background (#eee8dc) with subtle grain texture.
Center: a cute cartoon pet (small round fox or cat, kawaii style) sitting happily 
next to a floating translucent glassmorphism card showing a task checklist with 
3 items (2 checked, 1 unchecked). The card has a soft purple (#6d5dfc) glow.
Above the pet: small floating coins and sparkle particles in gold (#facc15) and 
purple (#7b6bff).
Style: flat illustration with soft gradients, no harsh outlines. 
Clean, modern, Apple-like aesthetic. No text on the image.
Mood: friendly, productive, playful.
Aspect ratio: 16:10
```

---

## 2. Premium (продвижение Premium)

**Файл**: `backend/assets/premium.png`  
**Размер**: 800×500px

### Промпт:
```
A premium upgrade illustration for a task management Telegram bot.
Warm beige background (#eee8dc) with a subtle gradient to light purple at the top.
Center: a glowing diamond or crystal emoji floating above a glassmorphism card.
The card has a soft frosted glass effect (white 86% opacity, blur, subtle border).
Around the card: floating icons — microphone (voice input), infinity symbol 
(unlimited tasks), bell (reminders), star — all in purple (#6d5dfc) with 
soft glow effects.
A subtle golden shimmer line across the top of the card.
Style: minimal, premium feel, glassmorphism. No text on the image.
Color palette: beige (#eee8dc), purple (#6d5dfc / #7b6bff), gold (#facc15), 
white glass surfaces.
Mood: exclusive, aspirational, clean.
Aspect ratio: 16:10
```

---

## 3. Premium Success (после покупки)

**Файл**: `backend/assets/premium_success.png`  
**Размер**: 800×500px

### Промпт:
```
A celebration illustration for successfully activating a premium subscription.
Warm beige background (#eee8dc).
Center: the same cute pet (fox/cat, kawaii style) wearing a tiny golden crown, 
jumping with joy. Around it: confetti particles in purple (#6d5dfc), gold 
(#facc15), and soft pink.
Below the pet: a glassmorphism badge with a checkmark, glowing in green (#1f9d63).
Floating sparkle effects and small stars scattered around.
Style: flat illustration, playful, celebratory. No text on the image.
Color palette: beige (#eee8dc), purple (#6d5dfc), gold (#facc15), green (#1f9d63).
Mood: joyful, rewarding, accomplished.
Aspect ratio: 16:10
```

---

## 4. Карусель /start — Слайд 1: Задачи

**Использование**: album-карусель в Telegram при /start  
**Размер**: 800×800px (квадрат для карусели)

### Промпт:
```
Square illustration for a feature slide about task creation.
Warm beige background (#eee8dc) with subtle geometric pattern.
Left side: a phone mockup (thin bezel, rounded corners) showing a chat interface 
with a voice waveform and a text message "Купить молоко завтра".
Right side: a glassmorphism task card appearing with the parsed task — 
title, date icon, checkmark. Card has frosted glass effect with purple 
accent border.
Small floating microphone icon and keyboard icon in purple (#6d5dfc).
Style: clean mockup, flat design, glassmorphism cards. Minimal.
At the bottom: small text area (leave blank — text will be added in Figma).
Aspect ratio: 1:1
```

---

## 5. Карусель /start — Слайд 2: Питомец

**Размер**: 800×800px

### Промпт:
```
Square illustration showcasing a virtual pet feature.
Warm beige background (#eee8dc) fading to a soft meadow scene at the bottom.
Center: a cute cartoon pet (round kawaii fox) at different growth stages — 
small egg on the left, baby pet in the middle, adult pet on the right — 
connected by a dotted arrow path showing progression.
Above each stage: floating XP numbers and level indicators in purple (#6d5dfc).
Small hearts and sparkle particles around the adult pet.
A glassmorphism mood indicator card floating near the pet showing a happy emoji.
Style: warm, playful, progression-focused. No text on the image.
Color palette: beige (#eee8dc), green meadow, purple (#6d5dfc), gold accents.
Aspect ratio: 1:1
```

---

## 6. Карусель /start — Слайд 3: Геймификация

**Размер**: 800×800px

### Промпт:
```
Square illustration showing gamification features.
Warm beige background (#eee8dc).
Composed of 4 floating glassmorphism cards arranged in a diamond pattern:
1. Top: a trophy icon with "Achievements" — golden glow
2. Left: a scroll icon with "Daily Quests" — purple (#6d5dfc) glow  
3. Right: a fire icon with "Streak 7 days" — orange/red glow
4. Bottom: a coin stack icon with coins — gold (#facc15) glow
Each card has frosted glass effect, soft shadow, rounded corners (22px).
Small particle effects connecting the cards.
Style: organized, feature-showcase, glassmorphism. No text beyond icons.
Color palette: beige, purple, gold, warm orange.
Aspect ratio: 1:1
```

---

## 7. Карусель /start — Слайд 4: Premium

**Размер**: 800×800px

### Промпт:
```
Square illustration promoting premium subscription.
Background: gradient from warm beige (#eee8dc) at top to soft purple 
(#6d5dfc at 15% opacity) at bottom.
Center: a large glassmorphism card with premium features listed as icons 
(infinity, microphone, bell, star) — each with a small purple circle behind it.
Above the card: a floating "PRO" badge with golden shimmer.
The card has a thicker border, subtle gradient, and enhanced glass effect 
compared to regular cards — conveying "premium" feel.
Scattered small stars and diamond particles around.
Style: premium, aspirational, clean glassmorphism. No text on the image.
Color palette: beige (#eee8dc), purple (#6d5dfc), gold (#facc15).
Aspect ratio: 1:1
```

---

## Общие рекомендации

1. **Минимум текста на изображениях** — текст добавляется поверх в коде или Figma
2. **Консистентные персонажи** — один и тот же стиль питомца на всех картинках
3. **Glassmorphism** — frosted glass эффект на всех карточках (blur + прозрачность + тонкая граница)
4. **Тёплая палитра** — бежевый фон, фиолетовые акценты, золотые награды
5. **Чистый воздух** — не перегружать деталями, много свободного пространства
6. **Для dark mode**: сгенерировать альтернативные версии с фоном `#0f0f15` и лавандовым акцентом `#9d8fff`
