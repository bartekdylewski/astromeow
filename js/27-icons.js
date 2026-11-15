'use strict';

const iconGroups = {
  map: '🗺️ 🧭', base: '🏠', shop: '🛍️', facts: '📖 📚', profile: '🐱 🧑‍🚀 👨‍🚀',
  star: '⭐ 🌟 ✨ 🎉', heart: '💗 ❤️ 🧡', goldheart: '💛', rocket: '🚀 🛬', rock: '🪨 🗿 🧊 🧱',
  meteor: '☄️', flask: '🧪 🌡️', box: '📦', clock: '⏱️', ufo: '🛸', fire: '🔥 💥 🌋',
  basket: '🧺', planet: '🪐 🌍 🌌 ⚪ 🌕 🌀 🌫️ 🌊 🌪️ 🫧', mars: '🔴', drop: '💧', oxygen: '🫁', moon: '🌙 🌑 🌗', lock: '🔒', trophy: '🏆',
  tool: '🔧 🔩 🏗️ 📏 🧲 💻', brain: '🧠', light: '💡 ❓', sun: '☀️ 🌞', check: '✅',
  arrow: '➡️ ⬆️ 👇 👆 ↗ 🔄 ♻️ 🤌', eye: '👀 🔭', flag: '🇵🇱', game: '🎮 🎯 🏋️ 💪',
  voice: '🔊 🎧', mute: '🔇', leaf: '🌱 🪶', pin: '📍', face: '😤 😎 😮 😅 🥹 🤔 😢 🙈 💀 🤖',
  paw: '🐾', lander: '🚡', satellite: '🛰️', dish: '📡', battery: '🔋', can: '🥫', toolbox: '🧰', plant: '🪴', shield: '🛡️', crown: '👑 🎩 🤠 🎀 🎈 💅', bolt: '⚡',
};
const iconNames = new Map();
for (const [name, group] of Object.entries(iconGroups)) {
  for (const symbol of group.split(' ')) iconNames.set(symbol.replace(/\uFE0F/g, ''), name);
}
const emojiPattern = /\p{Regional_Indicator}{2}|\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200d\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*/gu;
const iconSource = name => window.ICON_EMBED?.[name] || `assets/icons/${name}.svg`;
const iconName = symbol => iconNames.get(symbol.replace(/\uFE0F|\uFE0E/g, '')) || 'star';

function replaceEmoji(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (!root.parentElement?.closest('script,style,textarea,svg')) {
      const matches = [...root.data.matchAll(emojiPattern)];
      if (!matches.length) return;
      const fragment = document.createDocumentFragment();
      let offset = 0;
      for (const match of matches) {
        fragment.append(root.data.slice(offset, match.index));
        const icon = document.createElement('img');
        icon.className = 'game-icon';
        icon.src = iconSource(iconName(match[0]));
        icon.alt = '';
        fragment.append(icon);
        offset = match.index + match[0].length;
      }
      fragment.append(root.data.slice(offset));
      root.replaceWith(fragment);
    }
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(replaceEmoji);
}

const iconImages = new Map();
function drawGameIcon(ctx, symbol, x, y, size) {
  const name = iconName(symbol);
  if (!iconImages.has(name)) {
    const image = new Image();
    image.src = iconSource(name);
    iconImages.set(name, image);
  }
  const image = iconImages.get(name);
  if (image.complete && image.naturalWidth) ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
}
