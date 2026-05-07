#!/usr/bin/env python3
"""Generate 225 pet mood prompts (3 species × 3 rarities × 5 stages × 5 moods)."""

STYLE_BLOCK = (
    "2D flat vector illustration, thick black outline, cel-shaded, bright solid colors, "
    "front-facing symmetrical pose, sitting upright looking directly at viewer, "
    "large head-to-body ratio (chibi proportions 1:1.2), round soft shapes, "
    "minimal shading with one shadow tone, white highlight dot in each eye, "
    "same art style as all other characters in this set, game character sprite, "
    "512x512 pixels, transparent background, PNG, centered composition, "
    "no text, no 3D, no gradients, no realistic textures"
)

# ---------------------------------------------------------------------------
# Mood modifiers (emotion suffixes added to base descriptions)
# ---------------------------------------------------------------------------
MOOD_MODS = {
    "happy": {
        "face": "joyful beaming expression with wide happy smile showing tiny cute teeth, eyes slightly squinted from joy",
        "body": "ears perked up happily, tail raised high and wagging gently",
        "fx": "tiny golden sparkle dots floating around body, warm cheerful atmosphere",
    },
    "sad": {
        "face": "sad sorrowful expression with downturned mouth, eyes slightly droopy and watery",
        "body": "ears drooping down sadly, tail drooping low to the ground",
        "fx": "small visible teardrop near one eye, soft gray shadow under eyes",
    },
    "normal": {
        "face": "calm neutral expression with gentle soft smile, relaxed peaceful eyes",
        "body": "ears in natural relaxed position, tail curled gently beside body",
        "fx": "",
    },
    "anxious": {
        "face": "anxious nervous expression with wide worried eyes, eyes wide open with small furrowed brow, small sweat drop on forehead",
        "body": "ears slightly flattened back, tail tucked close to body, slight trembling posture",
        "fx": "tiny nervous sweat drops floating, tense body lines",
    },
    "excited": {
        "face": "ecstatic thrilled expression with huge sparkling grin showing tiny cute teeth, star-shaped sparkle highlights in eyes",
        "body": "ears perked straight up, tail raised high and puffed up excitedly",
        "fx": "tiny golden sparkle dots and star shapes floating around body, energetic aura",
    },
}

# Dragon-specific body parts
DRAGON_MOOD_BODY = {
    "happy": "horns perked up, wings slightly raised and spread, tail raised high and curled happily",
    "sad": "horns drooping slightly forward, wings folded down sadly, tail drooping down low",
    "normal": "horns in natural position, wings visible behind body in relaxed position, tail curled beside body",
    "anxious": "horns slightly flattened back, wings slightly trembling, tail tucked close to body",
    "excited": "horns perked straight up, wings flapping excitedly, tail raised high and waving",
}

DRAGON_MOOD_FX = {
    "happy": "tiny puffs of happy light gray smoke from nostrils",
    "sad": "tiny sad wispy gray smoke trails from nostrils",
    "normal": "small calm light gray smoke puff from nostrils",
    "anxious": "tiny nervous gray smoke puffs from nostrils",
    "excited": "small excited orange flame puffs from nostrils, tiny golden sparkle dots floating around body",
}

# ---------------------------------------------------------------------------
# Base descriptions per species × stage (from ART_GUIDE_v3.md)
# ---------------------------------------------------------------------------

CAT_COMMON = {
    1: "A tiny baby orange kitten, very round chubby body, oversized round head, huge round {eye_color} eyes with white highlight dot, tiny pink triangle nose, very short stubby legs, small round ears, barely visible short tail, soft orange fur, light cream belly patch",
    2: "A young orange kitten, slightly taller and less round than a baby, bigger pointed ears, growing fluffy tail, playful curious expression, big round {eye_color} eyes with white highlight dot, pink nose, soft orange fur, light cream belly, visible whiskers starting to grow",
    3: "An adult orange cat, well-proportioned body, fluffy chest fur, long elegant whiskers, large bushy tail curled beside body, warm confident expression, big round {eye_color} eyes with white highlight dot, pink nose, rich orange fur, cream chest patch",
    4: "A majestic adult orange cat, well-proportioned strong body, fluffy chest fur, long elegant whiskers, large bushy tail, wise confident expression, big round {eye_color} eyes with white highlight dot, pink nose, rich orange fur, cream chest, small simple golden circular aura behind the head like a subtle halo",
    5: "A legendary adult orange cat, well-proportioned strong body, fluffy chest fur, long elegant whiskers, large bushy tail, ancient wise yet cute expression, big round {eye_color} eyes with white highlight dot, pink nose, rich orange fur, cream chest, golden circular aura behind the head, three small yellow star shapes floating above head",
}

CAT_RARE = {
    1: "A tiny baby orange kitten, very round chubby body, oversized round head, huge round {eye_color} eyes with white highlight dot, tiny pink nose, very short stubby legs, small round ears with lavender-purple tips, barely visible short tail with purple tip, soft orange fur, light cream belly patch",
    2: "A young orange kitten, slightly taller and less round than a baby, bigger pointed ears with lavender-purple tips, growing fluffy tail with purple tip, playful curious expression, big round {eye_color} eyes with white highlight dot, pink nose, soft orange fur, light cream belly, visible whiskers, small purple diamond mark on forehead",
    3: "An adult orange cat, well-proportioned body, fluffy chest fur, long elegant whiskers with purple tips, large bushy tail with purple tip curled beside body, confident expression, big round {eye_color} eyes with white highlight dot, pink nose, rich orange fur, cream chest, lavender-purple accent patches on paws and ear tips",
    4: "A majestic adult orange cat, well-proportioned strong body, fluffy chest fur, long whiskers with purple tips, large bushy tail with purple tip, wise confident expression, big round {eye_color} eyes with white highlight dot, pink nose, rich orange fur, cream chest, lavender-purple accent patches on paws and ear tips, small simple purple circular aura behind the head like a subtle halo",
    5: "A legendary adult orange cat, well-proportioned strong body, fluffy chest fur, long whiskers with purple tips, large bushy tail with purple tip, ancient wise yet cute expression, big round {eye_color} eyes with white highlight dot, pink nose, rich orange fur, cream chest, lavender-purple accent patches on paws and ear tips, purple circular aura behind the head, three small purple crystal shapes floating above head",
}

CAT_EPIC = {
    1: "A tiny baby orange kitten, very round chubby body, oversized round head, huge round {eye_color} eyes with white highlight dot, tiny pink nose, very short stubby legs, small round ears with golden tips, barely visible short tail with golden tip, small golden star mark on forehead, soft orange fur, light cream belly patch",
    2: "A young orange kitten, slightly taller and less round than a baby, bigger pointed ears with golden tips, growing fluffy tail with golden tip, playful confident expression, big round {eye_color} eyes with white highlight dot, pink nose, soft orange fur, light cream belly, small golden star mark on forehead, golden accent patches on paws",
    3: "An adult orange cat, well-proportioned body, fluffy chest fur, long elegant whiskers, large bushy tail with golden tip curled beside body, confident expression, big round {eye_color} eyes with white highlight dot, pink nose, rich orange fur, cream chest, golden star mark on forehead, golden accent patches on paws and ear tips",
    4: "A majestic adult orange cat, well-proportioned strong body, fluffy chest fur, long whiskers, large bushy tail with golden tip, wise confident expression, big round {eye_color} eyes with white highlight dot, pink nose, rich orange fur, cream chest, golden star mark on forehead, golden accent patches on paws and ear tips, small simple golden circular aura behind the head with tiny golden sparkle dots",
    5: "A legendary adult orange cat, well-proportioned strong body, fluffy chest fur, long whiskers, large bushy tail with golden tip, ancient wise yet cute expression, big round {eye_color} eyes with white highlight dot, pink nose, rich orange fur, cream chest, golden star mark on forehead, golden accent patches on paws and ear tips, golden circular aura behind the head, three small golden star shapes floating above head, tiny golden sparkle dots around body",
}

FOX_COMMON = {
    1: "A tiny baby red fox cub, very round fluffy body, oversized round head, huge round {eye_color} eyes with white highlight dot, small black nose, white chest and belly patch, tiny orange-red bushy tail, small pointed ears with white inner fur, orange-red fur",
    2: "A young red fox, slightly taller and slimmer than a baby, bigger pointed ears with white insides, growing bushy orange-red tail with white tip, playful cunning smile, big round {eye_color} eyes with white highlight dot, black nose, white chest, orange-red fur",
    3: "An adult red fox, well-proportioned sleek body, large bushy white-tipped tail, sharp clever expression, big round {eye_color} eyes with white highlight dot, black nose, prominent white chest and belly, pointed ears, rich orange-red fur",
    4: "A majestic adult red fox, well-proportioned sleek strong body, large bushy white-tipped tail, wise clever expression, big round {eye_color} eyes with white highlight dot, black nose, prominent white chest, pointed ears, rich orange-red fur, small simple teal-blue circular aura behind the head like a subtle halo",
    5: "A legendary adult red fox, well-proportioned sleek strong body, large bushy white-tipped tail, ancient wise yet cute expression, big round {eye_color} eyes with white highlight dot, black nose, prominent white chest, pointed ears, rich orange-red fur, teal-blue circular aura behind the head, three small teal star shapes floating above head",
}

FOX_RARE = {
    1: "A tiny baby red fox cub, very round fluffy body, oversized round head, huge round {eye_color} eyes with white highlight dot, small black nose, white chest and belly patch, tiny orange-red bushy tail with purple tip, small pointed ears with lavender-purple tips, orange-red fur",
    2: "A young red fox, slightly taller and slimmer than a baby, bigger pointed ears with lavender-purple tips, growing bushy tail with purple tip, playful cunning smile, big round {eye_color} eyes with white highlight dot, black nose, white chest, orange-red fur, small purple diamond mark on forehead",
    3: "An adult red fox, well-proportioned sleek body, large bushy tail with purple tip, sharp clever expression, big round {eye_color} eyes with white highlight dot, black nose, prominent white chest, pointed ears with lavender-purple tips, rich orange-red fur, purple accent patches on paws",
    4: "A majestic adult red fox, well-proportioned sleek strong body, large bushy tail with purple tip, wise clever expression, big round {eye_color} eyes with white highlight dot, black nose, prominent white chest, pointed ears with lavender-purple tips, rich orange-red fur, purple accent patches on paws, small simple purple circular aura behind the head like a subtle halo",
    5: "A legendary adult red fox, well-proportioned sleek strong body, large bushy tail with purple tip, ancient wise yet cute expression, big round {eye_color} eyes with white highlight dot, black nose, prominent white chest, pointed ears with lavender-purple tips, rich orange-red fur, purple accent patches on paws, purple circular aura behind the head, three small purple crystal shapes floating above head",
}

FOX_EPIC = {
    1: "A tiny baby red fox cub, very round fluffy body, oversized round head, huge round {eye_color} eyes with white highlight dot, small black nose, white chest and belly patch, tiny orange-red bushy tail with golden tip, small pointed ears with golden tips, small golden star mark on forehead, orange-red fur",
    2: "A young red fox, slightly taller and slimmer than a baby, bigger pointed ears with golden tips, growing bushy tail with golden tip, playful confident smile, big round {eye_color} eyes with white highlight dot, black nose, white chest, orange-red fur, small golden star mark on forehead, golden accent patches on paws",
    3: "An adult red fox, well-proportioned sleek body, large bushy tail with golden tip, sharp clever expression, big round {eye_color} eyes with white highlight dot, black nose, prominent white chest, pointed ears with golden tips, rich orange-red fur, golden star mark on forehead, golden accent patches on paws",
    4: "A majestic adult red fox, well-proportioned sleek strong body, large bushy tail with golden tip, wise clever expression, big round {eye_color} eyes with white highlight dot, black nose, prominent white chest, pointed ears with golden tips, rich orange-red fur, golden star mark on forehead, golden accent patches on paws, small simple golden circular aura behind the head with tiny golden sparkle dots",
    5: "A legendary adult red fox, well-proportioned sleek strong body, large bushy tail with golden tip, ancient wise yet cute expression, big round {eye_color} eyes with white highlight dot, black nose, prominent white chest, pointed ears with golden tips, rich orange-red fur, golden star mark on forehead, golden accent patches on paws, golden circular aura behind the head, three small golden star shapes floating above head, tiny golden sparkle dots around body",
}

DRAGON_COMMON = {
    1: "A tiny baby purple dragon, very round chubby body, oversized round head, huge round {eye_color} eyes with white highlight dot, tiny horn bumps on top of head, small wing nubs on back, light lavender belly patch, stubby short tail, soft purple scales",
    2: "A young purple dragon, slightly taller body, growing small pointed horns, small bat-like wings starting to form on back, longer tail, playful expression, big round {eye_color} eyes with white highlight dot, light lavender belly, medium purple scales",
    3: "An adult purple dragon, well-proportioned body, prominent curved horns, spread bat-like wings visible behind body, long scaled tail, confident smile, big round {eye_color} eyes with white highlight dot, light lavender belly scales, rich purple scales",
    4: "A majestic adult purple dragon, well-proportioned strong body, prominent curved horns, large spread bat-like wings, long scaled tail, wise confident expression, big round {eye_color} eyes with white highlight dot, light lavender belly, rich purple scales, small simple warm orange circular aura behind the head like a subtle halo",
    5: "A legendary adult purple dragon, well-proportioned strong body, prominent curved horns, large spread bat-like wings, long scaled tail, ancient wise yet cute expression, big round {eye_color} eyes with white highlight dot, light lavender belly, rich purple scales, warm orange circular aura behind the head, three small orange flame shapes floating above head",
}

DRAGON_RARE = {
    1: "A tiny baby purple dragon, very round chubby body, oversized round head, huge round {eye_color} eyes with white highlight dot, tiny horn bumps with blue tips on head, small wing nubs on back, light lavender belly patch, stubby short tail with blue tip, soft purple scales",
    2: "A young purple dragon, slightly taller body, growing small pointed horns with blue crystal tips, small bat-like wings with blue vein accents, longer tail with blue tip, playful expression, big round {eye_color} eyes with white highlight dot, light lavender belly, purple scales with blue crystal accents on shoulders",
    3: "An adult purple dragon, well-proportioned body, prominent curved horns with blue crystal tips, spread bat-like wings with blue accents, long scaled tail with blue tip, confident smile, big round {eye_color} eyes with white highlight dot, light lavender belly, rich purple scales, blue crystal accent patches on chest and shoulders",
    4: "A majestic adult purple dragon, well-proportioned strong body, prominent curved horns with blue crystal tips, large spread bat-like wings with blue accents, long scaled tail with blue tip, wise confident expression, big round {eye_color} eyes with white highlight dot, light lavender belly, rich purple scales, blue crystal accent patches on chest and shoulders, small simple blue circular aura behind the head like a subtle halo",
    5: "A legendary adult purple dragon, well-proportioned strong body, prominent curved horns with blue crystal tips, large spread bat-like wings with blue accents, long scaled tail with blue tip, ancient wise yet cute expression, big round {eye_color} eyes with white highlight dot, light lavender belly, rich purple scales, blue crystal accent patches on chest and shoulders, blue circular aura behind the head, three small blue crystal shapes floating above head",
}

DRAGON_EPIC = {
    1: "A tiny baby purple dragon, very round chubby body, oversized round head, huge round {eye_color} eyes with white highlight dot, tiny horn bumps with golden tips on head, small wing nubs on back, light lavender belly patch, stubby short tail with golden tip, small golden star mark on forehead, soft purple scales",
    2: "A young purple dragon, slightly taller body, growing small pointed horns with golden tips, small bat-like wings with golden edge accents, longer tail with golden tip, playful confident expression, big round {eye_color} eyes with white highlight dot, light lavender belly, purple scales with golden accents on shoulders, small golden star mark on forehead",
    3: "An adult purple dragon, well-proportioned body, prominent curved horns with golden tips, spread bat-like wings with golden edge accents, long scaled tail with golden tip, confident expression, big round {eye_color} eyes with white highlight dot, light lavender belly, rich purple scales, golden star mark on forehead, golden accent patches on chest",
    4: "A majestic adult purple dragon, well-proportioned strong body, prominent curved horns with golden tips, large spread bat-like wings with golden edge accents, long scaled tail with golden tip, wise confident expression, big round {eye_color} eyes with white highlight dot, light lavender belly, rich purple scales, golden star mark on forehead, golden accent patches on chest, small simple golden circular aura behind the head with tiny golden sparkle dots",
    5: "A legendary adult purple dragon, well-proportioned strong body, prominent curved horns with golden tips, large spread bat-like wings with golden edge accents, long scaled tail with golden tip, ancient wise yet cute expression, big round {eye_color} eyes with white highlight dot, light lavender belly, rich purple scales, golden star mark on forehead, golden accent patches on chest, golden circular aura behind the head, three small golden star shapes floating above head, tiny golden sparkle dots around body",
}

# ---------------------------------------------------------------------------
# Eye colors per rarity
# ---------------------------------------------------------------------------
EYE_COLORS = {
    "common": "dark",
    "rare": {"cat": "violet-purple", "fox": "violet-purple", "dragon": "sapphire-blue"},
    "epic": "golden-amber",
}

# ---------------------------------------------------------------------------
# Species data
# ---------------------------------------------------------------------------
SPECIES = {
    "cat": {
        "common": CAT_COMMON,
        "rare": CAT_RARE,
        "epic": CAT_EPIC,
    },
    "fox": {
        "common": FOX_COMMON,
        "rare": FOX_RARE,
        "epic": FOX_EPIC,
    },
    "dragon": {
        "common": DRAGON_COMMON,
        "rare": DRAGON_RARE,
        "epic": DRAGON_EPIC,
    },
}

SPECIES_LABELS = {"cat": "Котёнок", "fox": "Лисёнок", "dragon": "Дракончик"}
RARITY_LABELS = {"common": "Обычный", "rare": "Редкий", "epic": "Эпический"}
STAGE_LABELS = {1: "Малыш", 2: "Подросток", 3: "Взрослый", 4: "Мастер", 5: "Легенда"}
MOOD_LABELS = {"happy": "Радостный", "sad": "Грустный", "normal": "Спокойный", "anxious": "Тревожный", "excited": "Восторженный"}


def get_eye_color(species, rarity):
    if rarity == "rare":
        return EYE_COLORS["rare"][species]
    return EYE_COLORS[rarity]


def build_prompt(species, rarity, stage, mood):
    """Build a single prompt for a pet mood image."""
    base = SPECIES[species][rarity][stage]
    eye = get_eye_color(species, rarity)
    base = base.format(eye_color=eye)

    mod = MOOD_MODS[mood]

    # Species-specific body modifications
    if species == "dragon":
        body_mod = DRAGON_MOOD_BODY[mood]
        fx_mod = DRAGON_MOOD_FX[mood]
    else:
        body_mod = mod["body"]
        fx_mod = mod["fx"]

    # Remove default expression/smile words from base to avoid duplication with mood
    old_expressions = [
        "playful curious expression",
        "warm confident expression",
        "wise confident expression",
        "ancient wise yet cute expression",
        "confident expression",
        "confident smile",
        "playful expression",
        "sharp clever expression",
        "cunning smile",
        "playful cunning smile",
        "playful confident expression",
        "playful confident smile",
        "wise clever expression",
    ]
    # Sort by length descending to remove longer phrases first (avoid partial leftovers)
    old_expressions.sort(key=len, reverse=True)
    for old in old_expressions:
        base = base.replace(old, "")
    # Clean up double commas/spaces and hanging commas
    import re
    base = re.sub(r"\s*,\s*,\s*", ", ", base)
    base = re.sub(r",\s*\.", ".", base)
    base = re.sub(r"\s+", " ", base)
    base = base.strip(", ")

    parts = []
    parts.append(base)
    parts.append(mod["face"])
    parts.append(body_mod)
    if fx_mod:
        parts.append(fx_mod)
    parts.append(STYLE_BLOCK)

    return ", ".join(parts)


def main():
    lines = []
    lines.append("# PET_MOODS_ALL.md — Все эмоции всех питомцев (225 промптов)")
    lines.append("")
    lines.append("> Стиль: 2D flat vector, thick black outline, cel-shaded, chibi proportions.")
    lines.append("> Каждый промпт самостоятельный — копируй → вставляй в генератор.")
    lines.append("")
    lines.append("---")
    lines.append("")

    counter = 1
    checklist = []

    for species in ["cat", "fox", "dragon"]:
        lines.append(f"# {SPECIES_LABELS[species]} ({species.upper()})")
        lines.append("")

        for rarity in ["common", "rare", "epic"]:
            lines.append(f"## {RARITY_LABELS[rarity]} — {rarity.upper()}")
            lines.append("")

            for stage in range(1, 6):
                stage_name = STAGE_LABELS[stage]
                lines.append(f"### Стадия {stage}: {stage_name}")
                lines.append("")

                for mood in ["happy", "sad", "normal", "anxious", "excited"]:
                    mood_name = MOOD_LABELS[mood]
                    filename = f"{species}_{rarity}_stage{stage}_{mood}.png"
                    prompt = build_prompt(species, rarity, stage, mood)

                    lines.append(f"**#{counter} → `{filename}`** — {mood_name} {stage_name} {RARITY_LABELS[rarity]} {SPECIES_LABELS[species]}")
                    lines.append("```")
                    lines.append(prompt)
                    lines.append("```")
                    lines.append("")

                    checklist.append(f"- [ ] #{counter} → `{filename}`")
                    counter += 1

        lines.append("---")
        lines.append("")

    # Append checklist
    lines.append("# ЧЕКЛИСТ — Все 225 файлов")
    lines.append("")
    lines.extend(checklist)
    lines.append("")
    lines.append(f"**Итого: {counter - 1} файлов**")

    with open("PET_MOODS_ALL.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Generated PET_MOODS_ALL.md with {counter - 1} prompts.")


if __name__ == "__main__":
    main()
