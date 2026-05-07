# Гайд по генерации артов — Nano Banana 2 (v3, единая стилистика)

Каждый промпт самостоятельный. Копируй → вставляй в Flow → переименовывай.

**Главное правило:** ВСЕ персонажи, все стадии, все редкости — в ОДНОМ стиле.

---

## Технические требования

| Ассет | Размер | Фон | Формат |
|---|---|---|---|
| Питомцы | 512×512 px | Прозрачный | PNG |
| Яйца | 512×512 px | Прозрачный | PNG |
| Аксессуары | 256×256 px | Прозрачный | PNG |
| Фоны | 1024×1024 px | С заполнением | PNG |
| Иконка лапки | 96×96 px | Прозрачный | PNG |

**Соотношение сторон: 1:1**

---

## СТИЛЬ-БЛОК (встроен в каждый промпт)

Каждый промпт содержит один и тот же стиль-блок в конце. Не меняй его — это гарантирует единую стилистику:

```
2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

---

## ПРАВИЛА ПОЗЫ

- **Все персонажи** сидят прямо, смотрят на зрителя (front-facing)
- **Все стадии** — одна и та же поза, отличаются только:
  - Размер тела (baby маленький и круглый → legend крупнее и стройнее)
  - Детали (рога/крылья растут, усы длиннее и т.д.)
  - Эффекты (аура, свечение — только на стадиях 4-5)
- **Все редкости** — один и тот же персонаж, одна поза, отличаются только цветовые акценты

---

## ПРАВИЛА РЕДКОСТИ

| Редкость | Что меняется | Что НЕ меняется |
|---|---|---|
| **Common** | Базовые цвета, никаких эффектов | Поза, пропорции, стиль |
| **Rare** | Добавляются фиолетовые/лавандовые акценты на кончиках ушей, хвосте, лапах + фиолетовый цвет глаз | Поза, пропорции, стиль, базовый цвет тела |
| **Epic** | Добавляются золотые акценты на кончиках ушей, хвосте, лапах + золотой цвет глаз + маленькая золотая звезда на лбу | Поза, пропорции, стиль, базовый цвет тела |

---

## #0 → `paw_icon.png` (иконка лапки, таб-бар)

```
A cute animal paw print icon, one large central pad and four smaller round toe pads, warm orange solid color, thick black outline, 2D flat vector style, minimal clean design, 96x96 pixels, transparent background, PNG, no text, no gradients, no 3D, no shadow
```

---

## КОТЁНОК (Cat) — рыжий, тёплые оранжевые тона

### Common

**#1 → `cat_common_stage1.png`** (Малыш)
```
A tiny baby orange kitten, very round chubby body, oversized round head, huge round dark eyes with white highlight dot, tiny pink triangle nose, very short stubby legs, small round ears, barely visible short tail, soft orange fur, light cream belly patch. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#2 → `cat_common_stage2.png`** (Подросток)
```
A young orange kitten, slightly taller and less round than a baby, bigger pointed ears, growing fluffy tail, playful curious expression, big round dark eyes with white highlight dot, pink nose, soft orange fur, light cream belly, visible whiskers starting to grow. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#3 → `cat_common_stage3.png`** (Взрослый)
```
An adult orange cat, well-proportioned body, fluffy chest fur, long elegant whiskers, large bushy tail curled beside body, warm confident expression, big round dark eyes with white highlight dot, pink nose, rich orange fur, cream chest patch. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#4 → `cat_common_stage4.png`** (Мастер)
```
A majestic adult orange cat, well-proportioned strong body, fluffy chest fur, long elegant whiskers, large bushy tail, wise confident expression, big round dark eyes with white highlight dot, pink nose, rich orange fur, cream chest, small simple golden circular aura behind the head like a subtle halo. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#5 → `cat_common_stage5.png`** (Легенда)
```
A legendary adult orange cat, well-proportioned strong body, fluffy chest fur, long elegant whiskers, large bushy tail, ancient wise yet cute expression, big round dark eyes with white highlight dot, pink nose, rich orange fur, cream chest, golden circular aura behind the head, three small yellow star shapes floating above head. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

### Rare — тот же котёнок, добавляются фиолетовые акценты

**#6 → `cat_rare_stage1.png`** (Малыш)
```
A tiny baby orange kitten, very round chubby body, oversized round head, huge round violet-purple eyes with white highlight dot, tiny pink nose, very short stubby legs, small round ears with lavender-purple tips, barely visible short tail with purple tip, soft orange fur, light cream belly patch. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#7 → `cat_rare_stage2.png`** (Подросток)
```
A young orange kitten, slightly taller and less round than a baby, bigger pointed ears with lavender-purple tips, growing fluffy tail with purple tip, playful curious expression, big round violet-purple eyes with white highlight dot, pink nose, soft orange fur, light cream belly, visible whiskers, small purple diamond mark on forehead. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#8 → `cat_rare_stage3.png`** (Взрослый)
```
An adult orange cat, well-proportioned body, fluffy chest fur, long elegant whiskers with purple tips, large bushy tail with purple tip curled beside body, confident expression, big round violet-purple eyes with white highlight dot, pink nose, rich orange fur, cream chest, lavender-purple accent patches on paws and ear tips. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#9 → `cat_rare_stage4.png`** (Мастер)
```
A majestic adult orange cat, well-proportioned strong body, fluffy chest fur, long whiskers with purple tips, large bushy tail with purple tip, wise confident expression, big round violet-purple eyes with white highlight dot, pink nose, rich orange fur, cream chest, lavender-purple accent patches on paws and ear tips, small simple purple circular aura behind the head like a subtle halo. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#10 → `cat_rare_stage5.png`** (Легенда)
```
A legendary adult orange cat, well-proportioned strong body, fluffy chest fur, long whiskers with purple tips, large bushy tail with purple tip, ancient wise yet cute expression, big round violet-purple eyes with white highlight dot, pink nose, rich orange fur, cream chest, lavender-purple accent patches on paws and ear tips, purple circular aura behind the head, three small purple crystal shapes floating above head. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

### Epic — тот же котёнок, добавляются золотые акценты + звезда на лбу

**#11 → `cat_epic_stage1.png`** (Малыш)
```
A tiny baby orange kitten, very round chubby body, oversized round head, huge round golden-amber eyes with white highlight dot, tiny pink nose, very short stubby legs, small round ears with golden tips, barely visible short tail with golden tip, small golden star mark on forehead, soft orange fur, light cream belly patch. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#12 → `cat_epic_stage2.png`** (Подросток)
```
A young orange kitten, slightly taller and less round than a baby, bigger pointed ears with golden tips, growing fluffy tail with golden tip, playful confident expression, big round golden-amber eyes with white highlight dot, pink nose, soft orange fur, light cream belly, small golden star mark on forehead, golden accent patches on paws. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#13 → `cat_epic_stage3.png`** (Взрослый)
```
An adult orange cat, well-proportioned body, fluffy chest fur, long elegant whiskers, large bushy tail with golden tip curled beside body, confident expression, big round golden-amber eyes with white highlight dot, pink nose, rich orange fur, cream chest, golden star mark on forehead, golden accent patches on paws and ear tips. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#14 → `cat_epic_stage4.png`** (Мастер)
```
A majestic adult orange cat, well-proportioned strong body, fluffy chest fur, long whiskers, large bushy tail with golden tip, wise confident expression, big round golden-amber eyes with white highlight dot, pink nose, rich orange fur, cream chest, golden star mark on forehead, golden accent patches on paws and ear tips, small simple golden circular aura behind the head with tiny golden sparkle dots. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#15 → `cat_epic_stage5.png`** (Легенда)
```
A legendary adult orange cat, well-proportioned strong body, fluffy chest fur, long whiskers, large bushy tail with golden tip, ancient wise yet cute expression, big round golden-amber eyes with white highlight dot, pink nose, rich orange fur, cream chest, golden star mark on forehead, golden accent patches on paws and ear tips, golden circular aura behind the head, three small golden star shapes floating above head, tiny golden sparkle dots around body. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

---

## ЛИСЁНОК (Fox) — рыже-красный, белая грудка, острые уши, пушистый хвост

### Common

**#16 → `fox_common_stage1.png`** (Малыш)
```
A tiny baby red fox cub, very round fluffy body, oversized round head, huge round dark eyes with white highlight dot, small black nose, white chest and belly patch, tiny orange-red bushy tail, small pointed ears with white inner fur, orange-red fur. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#17 → `fox_common_stage2.png`** (Подросток)
```
A young red fox, slightly taller and slimmer than a baby, bigger pointed ears with white insides, growing bushy orange-red tail with white tip, playful cunning smile, big round dark eyes with white highlight dot, black nose, white chest, orange-red fur. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#18 → `fox_common_stage3.png`** (Взрослый)
```
An adult red fox, well-proportioned sleek body, large bushy white-tipped tail, sharp clever expression, big round dark eyes with white highlight dot, black nose, prominent white chest and belly, pointed ears, rich orange-red fur. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#19 → `fox_common_stage4.png`** (Мастер)
```
A majestic adult red fox, well-proportioned sleek strong body, large bushy white-tipped tail, wise clever expression, big round dark eyes with white highlight dot, black nose, prominent white chest, pointed ears, rich orange-red fur, small simple teal-blue circular aura behind the head like a subtle halo. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#20 → `fox_common_stage5.png`** (Легенда)
```
A legendary adult red fox, well-proportioned sleek strong body, large bushy white-tipped tail, ancient wise yet cute expression, big round dark eyes with white highlight dot, black nose, prominent white chest, pointed ears, rich orange-red fur, teal-blue circular aura behind the head, three small teal star shapes floating above head. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

### Rare — тот же лисёнок, фиолетовые акценты

**#21 → `fox_rare_stage1.png`** (Малыш)
```
A tiny baby red fox cub, very round fluffy body, oversized round head, huge round violet-purple eyes with white highlight dot, small black nose, white chest and belly patch, tiny orange-red bushy tail with purple tip, small pointed ears with lavender-purple tips, orange-red fur. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#22 → `fox_rare_stage2.png`** (Подросток)
```
A young red fox, slightly taller and slimmer than a baby, bigger pointed ears with lavender-purple tips, growing bushy tail with purple tip, playful cunning smile, big round violet-purple eyes with white highlight dot, black nose, white chest, orange-red fur, small purple diamond mark on forehead. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#23 → `fox_rare_stage3.png`** (Взрослый)
```
An adult red fox, well-proportioned sleek body, large bushy tail with purple tip, sharp clever expression, big round violet-purple eyes with white highlight dot, black nose, prominent white chest, pointed ears with lavender-purple tips, rich orange-red fur, purple accent patches on paws. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#24 → `fox_rare_stage4.png`** (Мастер)
```
A majestic adult red fox, well-proportioned sleek strong body, large bushy tail with purple tip, wise clever expression, big round violet-purple eyes with white highlight dot, black nose, prominent white chest, pointed ears with lavender-purple tips, rich orange-red fur, purple accent patches on paws, small simple purple circular aura behind the head like a subtle halo. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#25 → `fox_rare_stage5.png`** (Легенда)
```
A legendary adult red fox, well-proportioned sleek strong body, large bushy tail with purple tip, ancient wise yet cute expression, big round violet-purple eyes with white highlight dot, black nose, prominent white chest, pointed ears with lavender-purple tips, rich orange-red fur, purple accent patches on paws, purple circular aura behind the head, three small purple crystal shapes floating above head. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

### Epic — тот же лисёнок, золотые акценты + звезда на лбу

**#26 → `fox_epic_stage1.png`** (Малыш)
```
A tiny baby red fox cub, very round fluffy body, oversized round head, huge round golden-amber eyes with white highlight dot, small black nose, white chest and belly patch, tiny orange-red bushy tail with golden tip, small pointed ears with golden tips, small golden star mark on forehead, orange-red fur. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#27 → `fox_epic_stage2.png`** (Подросток)
```
A young red fox, slightly taller and slimmer than a baby, bigger pointed ears with golden tips, growing bushy tail with golden tip, playful confident smile, big round golden-amber eyes with white highlight dot, black nose, white chest, orange-red fur, small golden star mark on forehead, golden accent patches on paws. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#28 → `fox_epic_stage3.png`** (Взрослый)
```
An adult red fox, well-proportioned sleek body, large bushy tail with golden tip, sharp clever expression, big round golden-amber eyes with white highlight dot, black nose, prominent white chest, pointed ears with golden tips, rich orange-red fur, golden star mark on forehead, golden accent patches on paws. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#29 → `fox_epic_stage4.png`** (Мастер)
```
A majestic adult red fox, well-proportioned sleek strong body, large bushy tail with golden tip, wise clever expression, big round golden-amber eyes with white highlight dot, black nose, prominent white chest, pointed ears with golden tips, rich orange-red fur, golden star mark on forehead, golden accent patches on paws, small simple golden circular aura behind the head with tiny golden sparkle dots. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#30 → `fox_epic_stage5.png`** (Легенда)
```
A legendary adult red fox, well-proportioned sleek strong body, large bushy tail with golden tip, ancient wise yet cute expression, big round golden-amber eyes with white highlight dot, black nose, prominent white chest, pointed ears with golden tips, rich orange-red fur, golden star mark on forehead, golden accent patches on paws, golden circular aura behind the head, three small golden star shapes floating above head, tiny golden sparkle dots around body. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

---

## ДРАКОНЧИК (Dragon) — фиолетовый, маленькие крылья, рожки, светлое пузико

### Common

**#31 → `dragon_common_stage1.png`** (Малыш)
```
A tiny baby purple dragon, very round chubby body, oversized round head, huge round dark eyes with white highlight dot, tiny horn bumps on top of head, small wing nubs on back, light lavender belly patch, stubby short tail, soft purple scales. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#32 → `dragon_common_stage2.png`** (Подросток)
```
A young purple dragon, slightly taller body, growing small pointed horns, small bat-like wings starting to form on back, longer tail, playful expression, big round dark eyes with white highlight dot, light lavender belly, medium purple scales. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#33 → `dragon_common_stage3.png`** (Взрослый)
```
An adult purple dragon, well-proportioned body, prominent curved horns, spread bat-like wings visible behind body, long scaled tail, confident smile, big round dark eyes with white highlight dot, light lavender belly scales, rich purple scales. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#34 → `dragon_common_stage4.png`** (Мастер)
```
A majestic adult purple dragon, well-proportioned strong body, prominent curved horns, large spread bat-like wings, long scaled tail, wise confident expression, big round dark eyes with white highlight dot, light lavender belly, rich purple scales, small simple warm orange circular aura behind the head like a subtle halo. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#35 → `dragon_common_stage5.png`** (Легенда)
```
A legendary adult purple dragon, well-proportioned strong body, prominent curved horns, large spread bat-like wings, long scaled tail, ancient wise yet cute expression, big round dark eyes with white highlight dot, light lavender belly, rich purple scales, warm orange circular aura behind the head, three small orange flame shapes floating above head. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

### Rare — тот же дракончик, синие кристальные акценты

**#36 → `dragon_rare_stage1.png`** (Малыш)
```
A tiny baby purple dragon, very round chubby body, oversized round head, huge round sapphire-blue eyes with white highlight dot, tiny horn bumps with blue tips on head, small wing nubs on back, light lavender belly patch, stubby short tail with blue tip, soft purple scales. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#37 → `dragon_rare_stage2.png`** (Подросток)
```
A young purple dragon, slightly taller body, growing small pointed horns with blue crystal tips, small bat-like wings with blue vein accents, longer tail with blue tip, playful expression, big round sapphire-blue eyes with white highlight dot, light lavender belly, purple scales with blue crystal accents on shoulders. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#38 → `dragon_rare_stage3.png`** (Взрослый)
```
An adult purple dragon, well-proportioned body, prominent curved horns with blue crystal tips, spread bat-like wings with blue accents, long scaled tail with blue tip, confident smile, big round sapphire-blue eyes with white highlight dot, light lavender belly, rich purple scales, blue crystal accent patches on chest and shoulders. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#39 → `dragon_rare_stage4.png`** (Мастер)
```
A majestic adult purple dragon, well-proportioned strong body, prominent curved horns with blue crystal tips, large spread bat-like wings with blue accents, long scaled tail with blue tip, wise confident expression, big round sapphire-blue eyes with white highlight dot, light lavender belly, rich purple scales, blue crystal accent patches on chest and shoulders, small simple blue circular aura behind the head like a subtle halo. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#40 → `dragon_rare_stage5.png`** (Легенда)
```
A legendary adult purple dragon, well-proportioned strong body, prominent curved horns with blue crystal tips, large spread bat-like wings with blue accents, long scaled tail with blue tip, ancient wise yet cute expression, big round sapphire-blue eyes with white highlight dot, light lavender belly, rich purple scales, blue crystal accent patches on chest and shoulders, blue circular aura behind the head, three small blue crystal shapes floating above head. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

### Epic — тот же дракончик, золотые акценты + звезда на лбу

**#41 → `dragon_epic_stage1.png`** (Малыш)
```
A tiny baby purple dragon, very round chubby body, oversized round head, huge round golden-amber eyes with white highlight dot, tiny horn bumps with golden tips on head, small wing nubs on back, light lavender belly patch, stubby short tail with golden tip, small golden star mark on forehead, soft purple scales. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#42 → `dragon_epic_stage2.png`** (Подросток)
```
A young purple dragon, slightly taller body, growing small pointed horns with golden tips, small bat-like wings with golden edge accents, longer tail with golden tip, playful confident expression, big round golden-amber eyes with white highlight dot, light lavender belly, purple scales with golden accents on shoulders, small golden star mark on forehead. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#43 → `dragon_epic_stage3.png`** (Взрослый)
```
An adult purple dragon, well-proportioned body, prominent curved horns with golden tips, spread bat-like wings with golden edge accents, long scaled tail with golden tip, confident expression, big round golden-amber eyes with white highlight dot, light lavender belly, rich purple scales, golden star mark on forehead, golden accent patches on chest. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#44 → `dragon_epic_stage4.png`** (Мастер)
```
A majestic adult purple dragon, well-proportioned strong body, prominent curved horns with golden tips, large spread bat-like wings with golden edge accents, long scaled tail with golden tip, wise confident expression, big round golden-amber eyes with white highlight dot, light lavender belly, rich purple scales, golden star mark on forehead, golden accent patches on chest, small simple golden circular aura behind the head with tiny golden sparkle dots. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

**#45 → `dragon_epic_stage5.png`** (Легенда)
```
A legendary adult purple dragon, well-proportioned strong body, prominent curved horns with golden tips, large spread bat-like wings with golden edge accents, long scaled tail with golden tip, ancient wise yet cute expression, big round golden-amber eyes with white highlight dot, light lavender belly, rich purple scales, golden star mark on forehead, golden accent patches on chest, golden circular aura behind the head, three small golden star shapes floating above head, tiny golden sparkle dots around body. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, front-facing symmetrical pose, sitting upright looking directly at viewer, large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, minimal shading with one shadow tone, white highlight dot in each eye, same art style as all other characters in this set, game character sprite, 512x512 pixels, transparent background, PNG, centered composition, no text, no 3D, no gradients, no realistic textures
```

---

## ЯЙЦА

Стиль яиц тоже единый: 2D flat vector, thick black outline, cel-shaded.

**#46 → `egg_common.png`** (Обычное яйцо)
```
A simple round egg, soft warm beige-cream solid color, thin crack lines on surface, small white sparkle highlight on upper right. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, centered composition, 512x512 pixels, transparent background, PNG, game item sprite, no text, no 3D, no gradients, no realistic textures
```

**#47 → `egg_rare.png`** (Редкое яйцо)
```
A round egg, soft lavender-purple solid color, thin glowing purple crack lines on surface, small purple sparkle highlight on upper right, tiny purple diamond shapes on surface. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, centered composition, 512x512 pixels, transparent background, PNG, game item sprite, no text, no 3D, no gradients, no realistic textures
```

**#48 → `egg_epic.png`** (Эпическое яйцо)
```
A round egg, warm golden-amber solid color, thin glowing golden crack lines on surface, small golden sparkle highlight on upper right, tiny golden star shapes on surface. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, centered composition, 512x512 pixels, transparent background, PNG, game item sprite, no text, no 3D, no gradients, no realistic textures
```

---

## АКСЕССУАРЫ (256×256)

Единый стиль: 2D flat vector, thick black outline, cel-shaded, simple.

**#49 → `acc_cap.png`** (Бейсболка)
```
A small red baseball cap, front-side angle view, curved brim, simple clean shape. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, 256x256 pixels, transparent background, PNG, game item icon, no text, no 3D, no gradients
```

**#50 → `acc_glasses.png`** (Очки)
```
Small round glasses with thin gold frame, front view, clear round lenses. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, 256x256 pixels, transparent background, PNG, game item icon, no text, no 3D, no gradients
```

**#51 → `acc_bowtie.png`** (Бантик)
```
A small red bow tie, neatly tied, front view, simple elegant shape. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, 256x256 pixels, transparent background, PNG, game item icon, no text, no 3D, no gradients
```

**#52 → `acc_scarf.png`** (Шарфик)
```
A warm knitted scarf, red and white horizontal stripes, loosely coiled shape. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, 256x256 pixels, transparent background, PNG, game item icon, no text, no 3D, no gradients
```

**#53 → `acc_headphones.png`** (Наушники)
```
Over-ear headphones, white and soft blue color, puffy round ear cushions, front view. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, 256x256 pixels, transparent background, PNG, game item icon, no text, no 3D, no gradients
```

**#54 → `acc_crown.png`** (Корона)
```
A small golden crown with three points, each tipped with a tiny colorful gem, shiny golden color. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, 256x256 pixels, transparent background, PNG, game item icon, no text, no 3D, no gradients
```

**#55 → `acc_halo.png`** (Нимб)
```
A golden halo ring floating, warm golden color, simple clean circular shape. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, 256x256 pixels, transparent background, PNG, game item icon, no text, no 3D, no gradients
```

**#56 → `acc_wings.png`** (Крылья)
```
A pair of small white angel wings, soft round feathers, spread open symmetrically. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, 256x256 pixels, transparent background, PNG, game item icon, no text, no 3D, no gradients
```

**#57 → `acc_fire_aura.png`** (Огненная аура)
```
A circular fiery orange-red aura ring, simple flame shapes flowing upward. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, 256x256 pixels, transparent background, PNG, game item icon, no text, no 3D, no gradients
```

**#58 → `acc_rainbow.png`** (Радужный шлейф)
```
A small rainbow arc trail, seven color bands in order, simple clean arc shape. 2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, 256x256 pixels, transparent background, PNG, game item icon, no text, no 3D, no gradients
```

---

## ФОНЫ (1024×1024, С заполнением)

Фоны — тоже 2D flat illustration, но без обводки (это фоны, не объекты).

**#59 → `bg_meadow.png`** (Поляна)
```
A green meadow landscape, soft rolling hills, small colorful wildflowers, bright blue sky with fluffy white clouds, warm sunlight. 2D flat illustration style, bright solid colors, soft simple shapes, 1024x1024 pixels, game background, no text, no characters, no outlines on sky
```

**#60 → `bg_night.png`** (Ночное небо)
```
A night sky landscape, dark blue sky, many small white star dots, bright crescent moon, soft wispy clouds, gentle moonlight glow. 2D flat illustration style, bright solid colors, soft simple shapes, 1024x1024 pixels, game background, no text, no characters
```

**#61 → `bg_city.png`** (Город)
```
A pastel city skyline at sunset, soft rounded building silhouettes, warm orange-pink sky, small yellow street light dots. 2D flat illustration style, bright solid colors, soft simple shapes, 1024x1024 pixels, game background, no text, no characters
```

**#62 → `bg_space.png`** (Космос)
```
A cosmic space scene, purple and blue nebula cloud shapes, distant small spiral galaxies, many small white star dots, deep blue-purple background. 2D flat illustration style, bright solid colors, soft simple shapes, 1024x1024 pixels, game background, no text, no characters
```

**#63 → `bg_volcano.png`** (Вулкан)
```
A volcanic landscape, dark rocky terrain shapes, glowing orange-red lava streams, fiery orange sky with dark clouds. 2D flat illustration style, bright solid warm colors, soft simple shapes, 1024x1024 pixels, game background, no text, no characters
```

**#64 → `bg_rainbow.png`** (Радуга)
```
A magical rainbow landscape, large colorful rainbow arc across bright blue sky, fluffy white clouds, green grassy field below, small golden sparkle dots. 2D flat illustration style, bright solid colors, soft simple shapes, 1024x1024 pixels, game background, no text, no characters
```

---

## ЧЕКЛИСТ

### Иконка
- [ ] #0 → `paw_icon.png`

### Котёнок
- [ ] #1 → `cat_common_stage1.png`
- [ ] #2 → `cat_common_stage2.png`
- [ ] #3 → `cat_common_stage3.png`
- [ ] #4 → `cat_common_stage4.png`
- [ ] #5 → `cat_common_stage5.png`
- [ ] #6 → `cat_rare_stage1.png`
- [ ] #7 → `cat_rare_stage2.png`
- [ ] #8 → `cat_rare_stage3.png`
- [ ] #9 → `cat_rare_stage4.png`
- [ ] #10 → `cat_rare_stage5.png`
- [ ] #11 → `cat_epic_stage1.png`
- [ ] #12 → `cat_epic_stage2.png`
- [ ] #13 → `cat_epic_stage3.png`
- [ ] #14 → `cat_epic_stage4.png`
- [ ] #15 → `cat_epic_stage5.png`

### Лисёнок
- [ ] #16 → `fox_common_stage1.png`
- [ ] #17 → `fox_common_stage2.png`
- [ ] #18 → `fox_common_stage3.png`
- [ ] #19 → `fox_common_stage4.png`
- [ ] #20 → `fox_common_stage5.png`
- [ ] #21 → `fox_rare_stage1.png`
- [ ] #22 → `fox_rare_stage2.png`
- [ ] #23 → `fox_rare_stage3.png`
- [ ] #24 → `fox_rare_stage4.png`
- [ ] #25 → `fox_rare_stage5.png`
- [ ] #26 → `fox_epic_stage1.png`
- [ ] #27 → `fox_epic_stage2.png`
- [ ] #28 → `fox_epic_stage3.png`
- [ ] #29 → `fox_epic_stage4.png`
- [ ] #30 → `fox_epic_stage5.png`

### Дракончик
- [ ] #31 → `dragon_common_stage1.png`
- [ ] #32 → `dragon_common_stage2.png`
- [ ] #33 → `dragon_common_stage3.png`
- [ ] #34 → `dragon_common_stage4.png`
- [ ] #35 → `dragon_common_stage5.png`
- [ ] #36 → `dragon_rare_stage1.png`
- [ ] #37 → `dragon_rare_stage2.png`
- [ ] #38 → `dragon_rare_stage3.png`
- [ ] #39 → `dragon_rare_stage4.png`
- [ ] #40 → `dragon_rare_stage5.png`
- [ ] #41 → `dragon_epic_stage1.png`
- [ ] #42 → `dragon_epic_stage2.png`
- [ ] #43 → `dragon_epic_stage3.png`
- [ ] #44 → `dragon_epic_stage4.png`
- [ ] #45 → `dragon_epic_stage5.png`

### Яйца
- [ ] #46 → `egg_common.png`
- [ ] #47 → `egg_rare.png`
- [ ] #48 → `egg_epic.png`

### Аксессуары
- [ ] #49 → `acc_cap.png`
- [ ] #50 → `acc_glasses.png`
- [ ] #51 → `acc_bowtie.png`
- [ ] #52 → `acc_scarf.png`
- [ ] #53 → `acc_headphones.png`
- [ ] #54 → `acc_crown.png`
- [ ] #55 → `acc_halo.png`
- [ ] #56 → `acc_wings.png`
- [ ] #57 → `acc_fire_aura.png`
- [ ] #58 → `acc_rainbow.png`

### Фоны
- [ ] #59 → `bg_meadow.png`
- [ ] #60 → `bg_night.png`
- [ ] #61 → `bg_city.png`
- [ ] #62 → `bg_space.png`
- [ ] #63 → `bg_volcano.png`
- [ ] #64 → `bg_rainbow.png`

**Итого: 65 файлов**

---

## Когда готово

Скинь мне все файлы — я:
1. Разложу по папкам в проекте
2. Заменю SVG-плейсхолдеры на `<img>` с артами
3. Обновлю пути в бэкенде
4. Заменю иконку лапки в таб-баре
5. Создам PR
