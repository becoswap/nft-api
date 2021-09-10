function strMul(str, num) {
  var s = '';
  for (var i = 0; i < num; i++) {
    s += str;
  }
  return s;
}

function genesToTraits(genes) {
  var genesString = genes.toString(2);
  genesString = strMul('0', 258 - genesString.length) + genesString;
  var traits = [];
  for (var i = 0; i < 43; i++) {
    traits.push(parseInt(genesString.slice(i * 6, 6 * (i + 1)), 2));
  }
  return traits;
}

const decode = genes => {
  let traits = genesToTraits(genes);
  const cardId = traits[1];
  const stats = baseStats.length > cardId ? baseStats[cardId] : baseStats[0];
  const skinBase = [];
  const rarity = traits[2];
  const classId = traits[0];
  traits = traits.slice(2);
  for (var i = 10; i >= 1; i--) {
    skinBase.push(traits[i * 4]);
  }
  for (var sb of skinBase) {
    const bodyStats = bodyStatMaps.length > sb ? bodyStatMaps[sb] : bodyStatMaps[0];
    stats[0] += bodyStats[0];
    stats[1] += bodyStats[1];
    stats[2] += bodyStats[2];
  }
  return {
    cardId,
    stats,
    skinBase,
    rarity,
    classId,
  };
};

const baseStats = [
  [30, 44, 26],
  [44, 33, 86],
  [78, 12, 68],
  [23, 67, 12],
  [11, 86, 12],
  [124, 67, 32],
];

const bodyStatMaps = [
  [0, 0, 1],
  [0, 1, 0],
  [0, 1, 1],
  [1, 1, 0],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 0],
  [0, 0, 1],
  [0, 1, 0],
  [0, 1, 1],
  [1, 1, 0],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 0],
  [0, 0, 1],
  [0, 1, 0],
  [0, 1, 1],
  [1, 1, 0],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 0],
  [1, 1, 0],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 0],
  [0, 1, 0],
  [1, 1, 0],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 0],
  [1, 1, 1],
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 1],
  [0, 1, 0],
  [0, 1, 1],
  [1, 1, 0],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 0],
  [0, 0, 1],
  [0, 1, 0],
  [0, 1, 1],
  [1, 1, 0],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 0],
  [0, 0, 1],
  [0, 1, 0],
  [0, 1, 1],
  [1, 1, 0],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 0],
  [1, 1, 0],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 0],
  [0, 1, 0],
  [1, 1, 0],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 0],
  [1, 1, 1],
  [0, 1, 0],
  [1, 1, 0],
  [1, 1, 1],
  [0, 1, 0],
  [1, 1, 1],
  [0, 1, 0],
  [1, 1, 0],
];

export { decode };
