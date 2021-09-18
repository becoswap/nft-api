const robotImageBase = 'https://images.kriptogaming.com/robot/';

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
  rarity: [null, 'Common', 'Uncommon', 'Rare', 'Legendary', 'Mythical', 'Immotal'],

  head: [
    'Hevin',
    'Flynt',
    'Elmit',
    'Enzay',
    'Dravis',
    'Ivula',
    'Enli',
    'Lotisa',
    'Hitcka',
    'Infina',
    'Yarbo',
    'Leznit',
    'Titan',
    'Geto',
    'Prioza',
    'Abel',
    'Aayan',
    'Aden',
    'Bentlee',
    'Brycen',
    'Cayson',
    'Issac',
    'Jaiden',
    'Javion',
    'Jayce',
    'Kaiden',
    'Kamden',
    'Kameron',
    'Kohen',
    'Landyn',
    'Misael',
    'Carl',
    ...newArray('HEAD'),
  ],

  anten: [
    'Azent',
    'Spec',
    'Amlin',
    'Amtrix',
    'Shanray',
    'Tiznel',
    'Spir',
    'Blisz',
    'Digitron',
    'Fiercon',
    'Lanz',
    'Gosine',
    'Chupl',
    'Meganil',
    'Floria',
    'Reece',
    'Tristian',
    'Alaric',
    'Arjun',
    'Benson',
    'Boone',
    'Cairo',
    'Chaim',
    'Dallas',
    'Dalton',
    'Ellis',
    'Enoch',
    'Gatlin',
    'Hamza',
    'Hassan',
    'Jakari',
    'Dario',
    ...newArray('ANTEN'),
  ],

  face: [
    'Barel',
    'Techoking',
    'Klasp',
    'Crytokon',
    'Lyrung',
    'Kream',
    'Scretl',
    'Connex',
    'Eazybit',
    'EleBliss',
    'Marcell',
    'Nerdware',
    'Intrino',
    'IntraHop',
    'Drifly',
    'Keanu',
    'Kyree',
    'Lawson',
    'Marlon',
    'Musa',
    'Peyton',
    'Sekani',
    'Shiloh',
    'Skyler',
    'Cory',
    'Derek',
    'Devon',
    'Dominik',
    'Joel',
    'Eliseo',
    'Gianni',
    'Alvaro',

    ...newArray('FACE'),
  ],
  shoulder: [
    'NaKnow',
    'Aliva',
    'Varian',
    'Renegy',
    'KinderLot',
    'Vakita',
    'Invictus',
    'PalmPal',
    'Sapien',
    'Crenly',
    'Zinikis',
    'Cobaz',
    'CalciteX',
    'Inova',
    'Lanlink',
    'Embren',
    'Quantico',
    'Sooper',
    'Walyn',
    'Leez',
    'Hiphic',
    'Rentoor',
    'Kiddily',
    'Tourish',
    'Knowza',
    'Drivemo',
    'Deduc',
    'Nutration',
    'Sygun',
    'Clogau',
    'Jabari',
    'Kyng',

    ...newArray('SHOULDER'),
  ],
  arm: [
    'Wani',
    'Deron',
    'Xozti',
    'Mivety',
    'Rengvo',
    'Kariox',
    'Pozzby',
    'Heyinz',
    'Watello',
    'Doniry',
    'Zlymo',
    'Wroy',
    'Nolunt',
    'Wopno',
    'Hobax',
    'Hoones',
    'Pangvo',
    'Joni',
    'Zize',
    'Gomof',
    'Myowy',
    'Shlofy',
    'Lariox',
    'Dravo',
    'Lozzby',
    'Xeanco',
    'Emota',
    'Dozti',
    'Jexmon',
    'Woello',
    'Lucca',
    'Osiris',
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
    anten: traits[38],
    head: traits[34],
    head_color: traits[30] % 6,
    eye: traits[26],
    eye_color: traits[22] % 6,
    lShouder: traits[18],
    rShouder: traits[14],
    lArm: traits[10],
    rArm: traits[6],
  };
};

function getImage(traits): string {
  let cardId = traits.cardId;
  if (traits.rarity === 0) {
    cardId += 6;
  }

  return (
    robotImageBase +
    [
      cardId,
      traits.head,
      traits.anten,
      traits.eye,
      traits.lArm,
      traits.lShouder,
      traits.rArm,
      traits.rShouder,
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
  eye: Part;
  head: Part;
  rarity: string;
  anten: Part;
  head_color: string;
  eye_color: string;
  lShouder: Part;
  rShouder: Part;
  lArm: Part;
  rArm: Part;
}

interface Part {
  name: string;
  image: string;
}

function getImagePart(name: string, type: number, color: number): string {
  return `https://images.kriptogaming.com/robot/${name}/${type + 1}-${color + 1}.png`;
}

const decode = (genes): Genes => {
  const traits = _decode(genes);

  return {
    energy:
      baseStats[traits.cardId][1] +
      bodyStats.anten[traits.anten % 6] +
      bodyStats.shoulder[traits.lShouder % 6] +
      bodyStats.shoulder[traits.rShouder % 6],
    speed: baseStats[traits.cardId][2] + bodyStats.eye[traits.eye % 6],
    strength:
      baseStats[traits.cardId][0] +
      bodyStats.head[traits.head % 6] +
      bodyStats.arm[traits.lArm % 6] +
      bodyStats.arm[traits.rArm % 6],
    card: nameMap.card[traits.cardId],
    image: getImage(traits),
    eye: {
      name: nameMap.face[traits.eye],
      image: getImagePart('Eye', traits.eye, traits.eye_color),
    },
    head: {
      name: nameMap.head[traits.head],
      image: getImagePart('Head', traits.head, traits.head_color),
    },
    rarity: nameMap.rarity[traits.rarity],
    anten: {
      name: nameMap.anten[traits.anten],
      image: getImagePart('Anten', traits.anten, traits.head_color),
    },
    head_color: nameMap.color[traits.head_color],
    eye_color: nameMap.color[traits.eye_color],
    lShouder: {
      name: nameMap.shoulder[traits.lShouder],
      image: getImagePart('LShoulder', traits.lShouder, traits.head_color),
    },
    rShouder: {
      name: nameMap.shoulder[traits.rShouder],
      image: getImagePart('RShoulder', traits.rShouder, traits.head_color),
    },
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
  head: [10, 11, 12, 13, 14, 15],
  anten: [6, 5, 4, 3, 2, 1],
  eye: [6, 5, 4, 3, 2, 1],
  shoulder: [6, 5, 4, 3, 2, 1],
  arm: [6, 5, 4, 3, 2, 1],
};

export { decode };
