const fullImage = 'https://images.kriptogaming.com/monster/';
const thumb = 'https://images.kriptogaming.com/monster/thumb/';

function newArray(name) {
  var arr = [];
  for (var i = 0; i < 33; i++) {
    arr.push(`${name}:${i + 1}`);
  }
  return arr;
}

const nameMap = {
  color: ['Spessartite', 'Carnelian', 'Firoza', 'Fluorite', 'Amethyst', 'Heliodor', 'Opal'],
  card: ['Titanium', 'Chromium', 'Osmium', 'Steel', 'Iridium', 'Tungsten'],
  rarity: [null, 'Common', 'Uncommon', 'Rare', 'Legendary', 'Mythical', 'Immortal'],
  skill: [
    'Protection of Stone',
    'Fiery Frenzy',
    'Carnage Aura',
    'Gift of Blizzards',
    'Seal of Revival',
    'Ceremony of Poison',
    'Mind Assault',
    'Concentration of Courage',
    'Curse of Demon Fire',
    'Thunder Blaze',
    'Freeze Mind',
    'Beam of Recovery',
    'Acid Wrath',
    'Carnage of Shadows',
    'Ice Defence',
    'Wind Flare',
    'Assault of Nature',
    'Avalanche',
    'Revitalize',
    'Flare of Acid',
    'Bend Mind',
    'Victory of Faith',
    'Arcane-fire Typhoon',
    'Annihilation Wave',
    'Tidal Wave',
    'Divine Healing',
    'Poison Whip',
    'Delusion of Fire',
    'Blast of Demons',
    'Resurrection Rune',
    'Hallowing of Death',
    'Blessing of Agony',
    ...newArray('SKILL'),
  ],
  head: [
    'Golgadok',
    'Erzaroth',
    'Rogleth',
    'Onemor',
    'Onaral',
    'Jorkamith',
    'Minog',
    'Tolgren',
    'Astrollan',
    "Sir'gaz",
    'Azalath',
    "Eth'ton",
    'Aglikath',
    'Thirokath',
    'Xazodol',
    'Uzrezan',
    "Ir'giur",
    'Jizil',
    'Rugluth',
    'Malvozun',
    'Istrennan',
    'Eglexuug',
    'Telgonik',
    "Riz'gath",
    'Araxeth',
    'Dragriun',
    "Thaz'gadiz",
    "Sar'udon",
    'Tolvenuth',
    'Gorkud',
    'Belriluk',
    "Ar'anius",
    ...newArray('HEAD'),
  ],
  horn: [
    'Zorkoth',
    'Ingroneg',
    "Rug'drak",
    "Gol'ganoth",
    'Ogthamith',
    'Ozzolis',
    'Gogladeth',
    'Sugach',
    'Zozzug',
    'Tazeduth',
    'Brornazeth',
    'Zunamul',
    'Ostromuth',
    'Zigthuz',
    'Xakaal',
    "Ath'tor",
    'Tholvexath',
    'Arkallad',
    'Ilgalan',
    'Salralloth',
    "Zoz'gothur",
    'Dolgimoth',
    "Kor'il",
    'Trozran',
    'Bangrag',
    'Zegmeman',
    "Sath'tuun",
    'Jorkanoth',
    'Bigmanoth',
    'Jargres',
    "Duth'tith",
    'Morthrimul',
    ...newArray('HORN'),
  ],
  eye: [
    'Thagan',
    'Vennaniuch',
    'Trarzonath',
    'Xolrekil',
    'Zagithon',
    "Zaz'gaan",
    'Dolraz',
    'Sogmag',
    'Zanol',
    'Ziralen',
    'Igthanoth',
    'Kezinok',
    'Ruzzomod',
    'Darraul',
    'Jogrinath',
    'Vulvoral',
    "Zag'thol",
    'Elgorok',
    'Gogmoz',
    'Agthiun',
    'Zarken',
    "Jeg'thennon",
    'Trirrun',
    "Kur'goth",
    'Voggenor',
    "Rath'tathan",
    "Ther'gekas",
    'Thazgothol',
    'Morthroth',
    'Juranoth',
    "Bath'toruth",
    'Birgak',
    ...newArray('EYE'),
  ],
  ear: [
    'Jurod',
    'Durnan',
    'Marrollun',
    'Xastrath',
    'Azgath',
    'Gugganoth',
    'Allmallath',
    'Mangrozos',
    'Sezzothod',
    'Bugroth',
    'Ralvemith',
    "Tul'geth",
    'Brolvumaath',
    'Tharamas',
    'Bukamuun',
    'Uzganol',
    'Olmanith',
    'Olrikich',
    'Malmidal',
    'Kegdrath',
    'Xalvomok',
    'Zingrakon',
    "Tir'gathuun",
    'Oggollor',
    "Sith'ten",
    'Sazamen',
    'Xalrumuk',
    'Dugothok',
    'Almauth',
    'Kigthos',
    'Thalrenoth',
    'Razrimag',
    ...newArray('EAR'),
  ],
  arm: [
    "Zor'gonnaath",
    'Siroxez',
    'Rugthoth',
    'Dangron',
    'Zelmamath',
    'Thuzrak',
    'Thogranol',
    "Xog'thekan",
    "Kol'gon",
    "Zig'thuthog",
    'Girgonoth',
    'Egronnoth',
    'Goglozan',
    "Droth'tuud",
    'Thelmathon',
    'Dugdron',
    'Vagdrul',
    'Ogthallar',
    'Tarthruuk',
    'Ogdrannath',
    'Sezran',
    'Tonnenas',
    'Izzid',
    'Jezrin',
    'Trokorath',
    'Trolronath',
    "Eg'thollus",
    'Xugdranal',
    'Gelvach',
    'Traroneg',
    'Ronaath',
    "Drug'drak",
    ...newArray('ARM'),
  ],
};

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

const _decode = genes => {
  let traits = genesToTraits(genes);

  return {
    cardId: Math.floor(traits[42] % 6),
    rarity: traits[2],
    horn: traits[38],
    head: traits[34],
    head_color: traits[30] % 6,
    eye: traits[26],
    eye_color: traits[22] % 6,
    ear: traits[18],
    skill: traits[14],
    lArm: traits[10],
    rArm: traits[6],
  };
};

function getImage(base, traits): string {
  let cardId = traits.cardId;
  if (traits.rarity === 0) {
    cardId += 6;
  }

  return (
    base +
    [
      cardId,
      traits.head,
      traits.horn,
      traits.eye,
      traits.lArm,
      traits.ear,
      traits.rArm,
      traits.head_color,
      traits.eye_color,
    ]
      .map(i => i + 1)
      .join('-') +
    '.png'
  );
}

interface Genes {
  energy: number;
  speed: number;
  strength: number;
  card: string;
  image: string;
  thumb: string;
  eye: Part;
  head: Part;
  horn: Part;
  rarity: string;
  ear: Part;
  head_color: string;
  eye_color: string;
  skill: Part;
  lArm: Part;
  rArm: Part;
}

interface Part {
  name: string;
  image?: string;
}

function getImagePart(name: string, type: number, color: number): string {
  return `https://images.kriptogaming.com/monster/${name}/${type + 1}-${color + 1}.png`;
}

const decode = (genes): Genes => {
  const traits = _decode(genes);

  return {
    energy:
      baseStats[traits.cardId][1] + bodyStats.horn[traits.horn % 6] + bodyStats.ear[traits.ear % 6],
    speed: baseStats[traits.cardId][2] + bodyStats.eye[traits.eye % 6],
    strength:
      baseStats[traits.cardId][0] +
      bodyStats.head[traits.head % 6] +
      bodyStats.arm[traits.lArm % 6] +
      bodyStats.arm[traits.rArm % 6],
    card: nameMap.card[traits.cardId],
    image: getImage(fullImage, traits),
    thumb: getImage(thumb, traits),
    eye: {
      name: nameMap.eye[traits.eye],
      image: getImagePart('Eye', traits.eye, traits.eye_color),
    },
    head: {
      name: nameMap.head[traits.head],
      image: getImagePart('Head', traits.head, traits.head_color),
    },
    rarity: nameMap.rarity[traits.rarity],
    horn: {
      name: nameMap.horn[traits.horn],
      image: getImagePart('Horn', traits.horn, traits.head_color),
    },
    ear: {
      name: nameMap.ear[traits.ear],
      image: getImagePart('Ear', traits.ear, traits.head_color),
    },
    skill: {
      name: nameMap.skill[traits.skill],
      image: getImagePart('Skill', traits.skill, traits.head_color),
    },
    head_color: nameMap.color[traits.head_color],
    eye_color: nameMap.color[traits.eye_color],
    lArm: {
      name: nameMap.arm[traits.lArm],
      image: getImagePart('LArm', traits.lArm, traits.head_color),
    },
    rArm: {
      name: nameMap.arm[traits.rArm],
      image: getImagePart('RArm', traits.rArm, traits.head_color),
    },
  };
};

const baseStats = [
  [5, 10, 6],
  [6, 9, 5],
  [7, 8, 4],
  [8, 7, 3],
  [9, 6, 2],
  [10, 5, 1],
];

const bodyStats = {
  head: [20, 21, 22, 23, 24, 25],
  horn: [16, 15, 14, 13, 12, 11],
  eye: [16, 15, 14, 13, 12, 11],
  ear: [16, 15, 14, 13, 12, 11],
  arm: [16, 15, 14, 13, 12, 11],
};

export { decode };
