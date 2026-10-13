export interface Work {
  id: string;
  title: string;
  slug: string;
  contentType: 'poem' | 'story' | 'essay' | 'thought' | 'quote' | 'artwork';
  language: 'hi' | 'en' | 'mixed';
  script: 'Deva' | 'Latn' | 'mixed';
  creator: string;
  excerpt: string;
  body?: string;
  coverImage?: string;
  coverAlt?: string;
  publishedAt: string;
  updatedAt: string;
  status: 'published' | 'draft';
  tags: string[];
  categories: string[];
  collectionSlugs?: string[];
  translatedEditionSlug?: string;
  translatedEditionTitle?: string;
  translatedEditionLang?: 'hi' | 'en';
  readingTimeMinutes?: number;
  // Specific to quotes
  quoteSource?: {
    author: string;
    workTitle: string;
    year?: string;
    url?: string;
    isVerified: boolean;
  };
  // Specific to artworks
  artworkDetails?: {
    medium: string;
    yearCreated: number;
    dimensions: string;
    aspectRatio: '16:9' | '1:1' | '3:4';
  };
  // Rights metadata
  rights: {
    declaredBy: string;
    declarationType: 'Original Creator' | 'Public Domain Attributed' | 'Curated Citation';
    status: 'Creator-Declared' | 'Attributed';
    notice: string;
  };
}

export interface Collection {
  id: string;
  slug: string;
  title: string;
  titleHi?: string;
  description: string;
  curatorNote: string;
  coverImage: string;
  itemSlugs: string[];
}

export const PUBLICATION_INFO = {
  name: "Antigravity Review",
  nameHi: "एंटीग्रेविटी समीक्षा",
  tagline: "A Bilingual Journal of Poetry, Ideas & Visual Arts",
  taglineHi: "कविता, विचार और दृश्य कला की द्विभाषी पत्रिका",
  editor: "A. G. Varma",
  editorHi: "ए. जी. वर्मा",
  description: "A sanctuary for contemplative reading, fine typography, and bilingual literary expression in Hindi and English.",
  foundedYear: 2026,
  rightsNotice: "All literary and artwork rights are explicitly declared by the creator. Unauthorised duplication prohibited."
};

export const WORKS: Work[] = [
  // 1. Hindi Devanagari Poem
  {
    id: "poem-hi-01",
    title: "स्मृतियों की देहरी पर",
    slug: "smritiyon-ki-dehari-par",
    contentType: "poem",
    language: "hi",
    script: "Deva",
    creator: "ए. जी. वर्मा",
    excerpt: "धुंधले आकाश की छांव तले, जलते हुए दीये की लौ में, समय ने अपनी परछाईं को चुपचाप समेट लिया...",
    body: `धुंधले आकाश की छांव तले,
जलते हुए दीये की कांपती लौ में,
समय ने अपनी परछाईं को
चुपचाप जल की सतह पर समेट लिया।

नाव बंधी है उस पुराने खंभे से,
जैसे कोई भूली हुई प्रतिज्ञा
सदियों के मौन के बाद भी
लहरों की प्रतीक्षा में ठहरी हो।

एक सन्नाटा उतरता है पेड़ों की डालियों से,
सांझ की स्याही में घुलता हुआ;
जो शब्द होंठों तक न आ सके,
वे अब हवाओं की सांझ-वंदना हैं।

हम सब केवल यात्री हैं उस किनारे के,
जहाँ यादों की लहरें आती हैं,
छूकर लौट जाती हैं पाषाण को,
और पीछे रह जाती है केवल भीगी रेत।`,
    coverImage: "/images/artworks/twilight_melancholy.jpg",
    coverAlt: "शाम के धुंधलके में नदी किनारे दीपक जलाए एक शांत आकृति का जलरंग चित्र",
    publishedAt: "2026-10-10T18:30:00Z",
    updatedAt: "2026-10-10T18:30:00Z",
    status: "published",
    tags: ["स्मृति", "सांझ", "प्रतीक्षा", "शांत रस"],
    categories: ["कविता"],
    collectionSlugs: ["monsoon-melancholy"],
    rights: {
      declaredBy: "ए. जी. वर्मा",
      declarationType: "Original Creator",
      status: "Creator-Declared",
      notice: "रचनाकार द्वारा मौलिक घोषित रचना। सर्वाधिकार सुरक्षित।"
    }
  },

  // 2. English Poem
  {
    id: "poem-en-01",
    title: "The Architecture of Solitude",
    slug: "the-architecture-of-solitude",
    contentType: "poem",
    language: "en",
    script: "Latn",
    creator: "A. G. Varma",
    excerpt: "There is an ancient masonry in evening rain, stone upon stone laid without mortar or haste...",
    body: `There is an ancient masonry in evening rain,
stone upon stone laid without mortar or haste,
where every silence earns its quiet arch
above the cold and uncomplaining waste.

The lanterns swing on gallows made of pine,
amber beacons spilling gold on dark moss,
not to invite the wanderer to rest,
but marking where the living pathways cross.

We measure distance not by stone or stride,
but by the shadows lengthening between
the thoughts we dare to utter in the light
and all the inward thresholds left unseen.

Step gently here: the forest keeps no clock.
The crescent moon climbs upward through the firs,
and night becomes a cathedral of stone
wherein no bell, no spoken prayer stirs.`,
    coverImage: "/images/artworks/silent_valley.jpg",
    coverAlt: "Oil painting of a stone staircase winding through a pine forest under a crescent moon with glowing lanterns",
    publishedAt: "2026-10-11T14:15:00Z",
    updatedAt: "2026-10-11T14:15:00Z",
    status: "published",
    tags: ["Solitude", "Night", "Silence", "Nature"],
    categories: ["Poetry"],
    collectionSlugs: ["thresholds-of-becoming"],
    rights: {
      declaredBy: "A. G. Varma",
      declarationType: "Original Creator",
      status: "Creator-Declared",
      notice: "Original work declared by the creator. All rights reserved."
    }
  },

  // 3. Bilingual Linked Pair - Hindi Edition
  {
    id: "poem-pair-hi",
    title: "समय की नदी",
    slug: "samay-ki-nadi",
    contentType: "poem",
    language: "hi",
    script: "Deva",
    creator: "ए. जी. वर्मा",
    excerpt: "समय कोई स्थिर तट नहीं है, यह तो बहता हुआ प्रवाह है जिसमें हम सब बहती हुई पत्तियां हैं...",
    body: `समय कोई स्थिर तट नहीं है,
यह तो बहता हुआ अनवरत प्रवाह है,
जिसमें हम सब तैरती हुई पत्तियां हैं
किनारे की तलाश में बेबस।

न अतीत ठहरता है हमारी मुट्ठी में,
न भविष्य की कोई निश्चित राह है;
जो है, वह बस यही एक श्वास है,
जो बहते पानी पर खींची गई लकीर है।

सुनो उस धारा का धीमा संगीत,
वह किसी का विलाप नहीं,
केवल निरंतर होने की
एक अनंत स्वीकृति है।`,
    coverImage: "/images/artworks/akshar_mandala.jpg",
    coverAlt: "देवनागरी लिपि में रचित वृत्ताकार कलात्मक मंडल",
    publishedAt: "2026-10-12T09:00:00Z",
    updatedAt: "2026-10-12T09:00:00Z",
    status: "published",
    tags: ["काल", "प्रवाह", "दर्शन", "द्विभाषी"],
    categories: ["कविता"],
    translatedEditionSlug: "the-river-of-time",
    translatedEditionTitle: "The River of Time (English Edition)",
    translatedEditionLang: "en",
    rights: {
      declaredBy: "ए. जी. वर्मा",
      declarationType: "Original Creator",
      status: "Creator-Declared",
      notice: "रचनाकार द्वारा घोषित मौलिक कृति। अंग्रेजी अनुवाद उपलब्ध।"
    }
  },

  // 4. Bilingual Linked Pair - English Edition
  {
    id: "poem-pair-en",
    title: "The River of Time",
    slug: "the-river-of-time",
    contentType: "poem",
    language: "en",
    script: "Latn",
    creator: "A. G. Varma",
    excerpt: "Time is no stationary embankment; it is a relentless rushing current where we are fallen leaves...",
    body: `Time is no stationary shore,
but an unceasing, sovereign tide
wherein we drift like autumn leaves
with neither anchor nor a guide.

The past slips through our tightened palms,
the future keeps no charted line;
all that remains is this brief breath,
a ripple carved in cold design.

Listen to the river’s quiet chant:
it mourns no loss, it seeks no throne,
it is the pure, unbroken grace
of moving forward all alone.`,
    coverImage: "/images/artworks/akshar_mandala.jpg",
    coverAlt: "Calligraphic geometric mandala on handmade paper",
    publishedAt: "2026-10-12T09:00:00Z",
    updatedAt: "2026-10-12T09:00:00Z",
    status: "published",
    tags: ["Time", "Stream", "Philosophy", "Bilingual"],
    categories: ["Poetry"],
    translatedEditionSlug: "samay-ki-nadi",
    translatedEditionTitle: "समय की नदी (हिंदी संस्करण)",
    translatedEditionLang: "hi",
    rights: {
      declaredBy: "A. G. Varma",
      declarationType: "Original Creator",
      status: "Creator-Declared",
      notice: "Original work declared by the creator. Hindi companion edition linked."
    }
  },

  // 5. English Long-Form Prose / Story
  {
    id: "prose-en-01",
    title: "The Keeper of Forgotten Manuscripts",
    slug: "the-keeper-of-forgotten-manuscripts",
    contentType: "story",
    language: "en",
    script: "Latn",
    creator: "A. G. Varma",
    excerpt: "In the high vaulted library overlooking the misty river bends, Master Hemant spent fifty winters mending letters that were never answered...",
    body: `In the high vaulted library overlooking the misty river bends, Master Hemant spent fifty winters mending letters that were never delivered. The archive did not collect treaties of kings or tax rolls of forgotten provinces. Its shelves held only intimate hesitations: unsent confessions penned on mulberry bark, apologies smudged with dried ink, and botanical notes scribbled on the margins of prayer books.

"A letter that reaches its destination," he would say, adjusting his bronze spectacles over tired eyes, "becomes a fact. But a letter that was folded, sealed, and kept in a cedar drawer remains a prayer. It never encounters the world's disappointment."

The room smelled perpetually of cedarwood oil, dried gum arabic, and damp river stones. Outside, the monsoon arrived with the roar of swollen currents, beating against the ironwood shutters. On his workbench lay an unbound manuscript from the seventeenth century—folios written in fluid Devanagari script, the ink formulated from crushed pomegranate rinds and soot.

He worked with camel-hair brushes and wheat-starch paste, feathering the frayed edges of each folio. To restore a page was not to erase its decay; it was to give its vulnerability enough strength to survive another human gaze.

When the twilight settled and the temple gongs resonated across the water, Hemant lit his small brass lantern. He believed that literature does not belong to the empires that commission it, but to the solitary readers who find within its cadence the courage to endure their own unrecorded nights.`,
    coverImage: "/images/artworks/twilight_melancholy.jpg",
    coverAlt: "Quiet riverside dwelling illuminated by a solitary lantern in the twilight rain",
    publishedAt: "2026-10-08T11:00:00Z",
    updatedAt: "2026-10-08T11:00:00Z",
    status: "published",
    readingTimeMinutes: 4,
    tags: ["Literature", "Memory", "Storytelling", "Archives"],
    categories: ["Prose & Stories"],
    collectionSlugs: ["monsoon-melancholy"],
    rights: {
      declaredBy: "A. G. Varma",
      declarationType: "Original Creator",
      status: "Creator-Declared",
      notice: "Original literary fiction declared by author A. G. Varma."
    }
  },

  // 6. Hindi Long-Form Literary Essay
  {
    id: "prose-hi-01",
    title: "मौन और शब्द: सृजन की आंतरिक यात्रा",
    slug: "maun-aur-shabd-srijan-ki-yatra",
    contentType: "essay",
    language: "hi",
    script: "Deva",
    creator: "ए. जी. वर्मा",
    excerpt: "साहित्य में जो कहा गया है, उसका महत्व है; परंतु जो अनकहा रह गया, वही रचना की आत्मा का विस्तार करता है...",
    body: `साहित्य और कला का इतिहास केवल शब्दों का संग्रह नहीं है; यह उस मौन का मानचित्र भी है जिसे वाणी ने स्पर्श करने का साहस किया। जब हम किसी महान कविता या गंभीर गद्य के सम्मुख होते हैं, तो जो ध्वनि कान में गूंजती है, वह केवल प्रवेश द्वार है। वास्तविक अर्थ तो उस ठहराव में खिलता है जो दो छंदों या दो वाक्यों के मध्य घटित होता है।

भारतीय काव्यशास्त्र में 'ध्वनि' का सिद्धांत इसी तथ्य को रेखांकित करता है। वाच्य अर्थ तो केवल स्थूल शरीर है, जबकि व्यंग्य—वह जो संकेतित है, जो शब्दों की सीमा के पार इंगित करता है—वही काव्य की सच्ची आत्मा है।

आज के इस कोलाहलपूर्ण युग में, जहाँ सूचना का अतिरेक विचार के अवकाश को संकुचित कर रहा है, लेखक और कलाकार का दायित्व केवल नए शब्द गढ़ना नहीं, बल्कि पाठकों के भीतर मौन के एकांत को पुनः प्रतिष्ठित करना है। एक शब्द तब तक सार्थक नहीं हो सकता जब तक उसके पीछे एक गहरा सन्नाटा न हो जो उसे आधार दे सके।

जब हम किसी चित्र के कोरे कैनवास को देखते हैं, या किसी कविता के अंत में लगे रिक्त स्थान को निहारते हैं, तो हमें ज्ञात होता है कि सृजन शून्य से नहीं उपजता; वह उस विस्मयकारी मौन की संतान है जो हमारे भीतर निरंतर बह रहा है।`,
    coverImage: "/images/artworks/silent_valley.jpg",
    coverAlt: "रात के सन्नाटे में देवदार के वनों से गुजरता पाषाण पथ",
    publishedAt: "2026-10-09T16:00:00Z",
    updatedAt: "2026-10-09T16:00:00Z",
    status: "published",
    readingTimeMinutes: 5,
    tags: ["दर्शन", "काव्यशास्त्र", "मौन", "सृजन"],
    categories: ["निबंध व विचार"],
    collectionSlugs: ["thresholds-of-becoming"],
    rights: {
      declaredBy: "ए. जी. वर्मा",
      declarationType: "Original Creator",
      status: "Creator-Declared",
      notice: "मौलिक निबंध रचनाकार द्वारा घोषित। सर्वाधिकार सुरक्षित।"
    }
  },

  // 7. Original Thought 1 (Hindi Devanagari)
  {
    id: "thought-hi-01",
    title: "मौन का अर्थ",
    slug: "maun-ka-arth",
    contentType: "thought",
    language: "hi",
    script: "Deva",
    creator: "ए. जी. वर्मा",
    excerpt: "कुछ बातें मौन में ही अपना अर्थ खोज पाती हैं...",
    body: "कुछ बातें मौन में ही अपना अर्थ खोज पाती हैं; शब्दों में आकर वे केवल गूँज बनकर रह जाती हैं।",
    publishedAt: "2026-10-13T08:00:00Z",
    updatedAt: "2026-10-13T08:00:00Z",
    status: "published",
    tags: ["विचार", "मौन", "अphorism"],
    categories: ["विचार व सूक्तियां"],
    rights: {
      declaredBy: "ए. जी. वर्मा",
      declarationType: "Original Creator",
      status: "Creator-Declared",
      notice: "मौलिक विचार रचनाकार द्वारा घोषित।"
    }
  },

  // 8. Original Thought 2 (Romanized Hindi)
  {
    id: "thought-ro-01",
    title: "Khaamoshiyon Ka Daur",
    slug: "khaamoshiyon-ka-daur",
    contentType: "thought",
    language: "hi",
    script: "Latn",
    creator: "A. G. Varma",
    excerpt: "Khaamoshiyon ka bhi ek daur hota hai...",
    body: "Khaamoshiyon ka bhi ek daur hota hai, jahan har lafz be-awaaz apna wajood dhoondhta hai.",
    publishedAt: "2026-10-13T10:30:00Z",
    updatedAt: "2026-10-13T10:30:00Z",
    status: "published",
    tags: ["Romanized Hindi", "Reflection", "Words"],
    categories: ["Thoughts & Quotations"],
    rights: {
      declaredBy: "A. G. Varma",
      declarationType: "Original Creator",
      status: "Creator-Declared",
      notice: "Original reflection in Romanized Hindi."
    }
  },

  // 9. Original Thought 3 (English)
  {
    id: "thought-en-01",
    title: "The Quiet Presence",
    slug: "the-quiet-presence",
    contentType: "thought",
    language: "en",
    script: "Latn",
    creator: "A. G. Varma",
    excerpt: "Solitude is not the absence of the world...",
    body: "Solitude is not the absence of the world, but the quiet arrival of one's own voice.",
    publishedAt: "2026-10-13T12:00:00Z",
    updatedAt: "2026-10-13T12:00:00Z",
    status: "published",
    tags: ["Solitude", "Voice", "Stillness"],
    categories: ["Thoughts & Quotations"],
    rights: {
      declaredBy: "A. G. Varma",
      declarationType: "Original Creator",
      status: "Creator-Declared",
      notice: "Original creator aphorism."
    }
  },

  // 10. Attributed Sourced Quotation 1 (Ghalib)
  {
    id: "quote-01",
    title: "मिर्ज़ा ग़ालिब का शेर",
    slug: "mirza-ghalib-na-tha-kuch-to-khuda-tha",
    contentType: "quote",
    language: "mixed",
    script: "Deva",
    creator: "Mirza Asadullah Khan Ghalib",
    excerpt: "न था कुछ तो ख़ुदा था कुछ न होता तो ख़ुदा होता...",
    body: `न था कुछ तो ख़ुदा था कुछ न होता तो ख़ुदा होता
डुबोया मुझ को होने ने न होता मैं तो क्या होता`,
    publishedAt: "2026-10-07T10:00:00Z",
    updatedAt: "2026-10-07T10:00:00Z",
    status: "published",
    tags: ["उर्दू शायरी", "ग़ालिब", "अस्तित्ववाद", "उद्धरण"],
    categories: ["विचार व सूक्तियां"],
    quoteSource: {
      author: "मिर्ज़ा असदुल्लाह ख़ान 'ग़ालिब' (1797–1869)",
      workTitle: "दीवान-ए-ग़ालिब (ग़ज़ल संख्या 32)",
      year: "1841",
      url: "https://www.rekhta.org/ghazals/na-tha-kuchh-to-khuda-tha-kuchh-na-hota-to-khuda-hota-mirza-ghalib-ghazals",
      isVerified: true
    },
    rights: {
      declaredBy: "Historical Source",
      declarationType: "Public Domain Attributed",
      status: "Attributed",
      notice: "सार्वजनिक कार्यक्षेत्र (Public Domain) से उद्धृत शास्त्रीय रचना। साहित्यिक सन्दर्भ हेतु प्रस्तुत।"
    }
  },

  // 11. Attributed Sourced Quotation 2 (Virginia Woolf)
  {
    id: "quote-02",
    title: "Virginia Woolf on Freedom of the Mind",
    slug: "virginia-woolf-lock-up-your-libraries",
    contentType: "quote",
    language: "en",
    script: "Latn",
    creator: "Virginia Woolf",
    excerpt: "Lock up your libraries if you like; but there is no gate, no lock, no bolt...",
    body: `"Lock up your libraries if you like; but there is no gate, no lock, no bolt that you can set upon the freedom of my mind."`,
    publishedAt: "2026-10-07T14:00:00Z",
    updatedAt: "2026-10-07T14:00:00Z",
    status: "published",
    tags: ["Literary Quotation", "Freedom", "Books", "Feminism"],
    categories: ["Thoughts & Quotations"],
    quoteSource: {
      author: "Virginia Woolf (1882–1941)",
      workTitle: "A Room of One's Own, Chapter 4",
      year: "1929",
      url: "https://www.gutenberg.org/ebooks/67104",
      isVerified: true
    },
    rights: {
      declaredBy: "Bibliographic Source",
      declarationType: "Public Domain Attributed",
      status: "Attributed",
      notice: "Quotation reproduced for literary reflection and commentary under fair dealing."
    }
  },

  // 12. Visual Artwork 1 (Landscape 16:9)
  {
    id: "art-01",
    title: "The Melancholy of Twilight",
    slug: "the-melancholy-of-twilight",
    contentType: "artwork",
    language: "en",
    script: "Latn",
    creator: "A. G. Varma",
    excerpt: "A solitary boatman bearing a glowing lantern on a misty monsoon river under twilight skies...",
    body: "Executed in transparent watercolor and gouache washes on handmade Arches cold-press cotton paper. The work captures the liminal stillness of dusk in rural Bengal, where water, mist, and the warm glow of kerosene lamplight merge into an emblem of solitary waiting.",
    coverImage: "/images/artworks/twilight_melancholy.jpg",
    coverAlt: "Watercolor painting of a lone figure with a lantern on a wooden river dock at dusk with a canoe",
    publishedAt: "2026-10-05T12:00:00Z",
    updatedAt: "2026-10-05T12:00:00Z",
    status: "published",
    tags: ["Watercolor", "Monsoon", "Twilight", "Atmospheric"],
    categories: ["Visual Art Gallery"],
    collectionSlugs: ["monsoon-melancholy"],
    artworkDetails: {
      medium: "Watercolor & Gouache on 300gsm Cotton Rag",
      yearCreated: 2026,
      dimensions: "56 × 32 cm",
      aspectRatio: "16:9"
    },
    rights: {
      declaredBy: "A. G. Varma",
      declarationType: "Original Creator",
      status: "Creator-Declared",
      notice: "Original artwork created by A. G. Varma. Reproduction without permission prohibited."
    }
  },

  // 13. Visual Artwork 2 (Square 1:1)
  {
    id: "art-02",
    title: "Devanagari Akshar Mandala",
    slug: "devanagari-akshar-mandala",
    contentType: "artwork",
    language: "hi",
    script: "Deva",
    creator: "ए. जी. वर्मा",
    excerpt: "देवनागरी वर्णमाला और दार्शनिक ऋचाओं का वृत्ताकार ज्यामितीय आलेखन...",
    body: "चाय के काढ़े से रंगे हस्तनिर्मित सन-पत्र (Parchment) पर काली स्याही और सिंदूरी रंग से अंकित पारंपरिक लिपि-मंडल। इसमें देवनागरी लिपि के ध्वन्यात्मक सौंदर्य और वृत्ताकार संतुलन का समन्वय किया गया है।",
    coverImage: "/images/artworks/akshar_mandala.jpg",
    coverAlt: "काली और सिंदूरी स्याही से हस्तनिर्मित कागज पर बना देवनागरी अक्षरों का वृत्ताकार मंडल",
    publishedAt: "2026-10-06T14:30:00Z",
    updatedAt: "2026-10-06T14:30:00Z",
    status: "published",
    tags: ["कैलीग्राफी", "देवनागरी", "मंडल", "हस्तकला"],
    categories: ["दृश्य कला वीथिका"],
    collectionSlugs: ["thresholds-of-becoming"],
    artworkDetails: {
      medium: "Traditional Iron-Gall Ink & Cinnabar on Tea-Stained Paper",
      yearCreated: 2026,
      dimensions: "45 × 45 cm",
      aspectRatio: "1:1"
    },
    rights: {
      declaredBy: "ए. जी. वर्मा",
      declarationType: "Original Creator",
      status: "Creator-Declared",
      notice: "मौलिक कलाकृति रचनाकार द्वारा घोषित। सर्वाधिकार सुरक्षित।"
    }
  },

  // 14. Visual Artwork 3 (Portrait 3:4)
  {
    id: "art-03",
    title: "Echoes of the Silent Valley",
    slug: "echoes-of-the-silent-valley",
    contentType: "artwork",
    language: "en",
    script: "Latn",
    creator: "A. G. Varma",
    excerpt: "An ancient stone stairway winding through shadowed Himalayan pines beneath a crescent moon...",
    body: "Heavy body oil painting on Belgian linen canvas with palette knife impasto textures. Explores the contemplative stillness of high mountain paths at night, anchored by the comforting amber beacon of trail lanterns.",
    coverImage: "/images/artworks/silent_valley.jpg",
    coverAlt: "Oil painting of a stone staircase winding through a pine forest under a crescent moon with glowing lanterns",
    publishedAt: "2026-10-07T17:00:00Z",
    updatedAt: "2026-10-07T17:00:00Z",
    status: "published",
    tags: ["Oil Painting", "Nightscape", "Mountains", "Impasto"],
    categories: ["Visual Art Gallery"],
    collectionSlugs: ["thresholds-of-becoming"],
    artworkDetails: {
      medium: "Oil on Linen Canvas",
      yearCreated: 2026,
      dimensions: "40 × 55 cm",
      aspectRatio: "3:4"
    },
    rights: {
      declaredBy: "A. G. Varma",
      declarationType: "Original Creator",
      status: "Creator-Declared",
      notice: "Original painting declared by A. G. Varma. All rights reserved."
    }
  }
];

export const COLLECTIONS: Collection[] = [
  {
    id: "col-01",
    slug: "monsoon-melancholy",
    title: "Monsoon Melancholy",
    titleHi: "सावन की स्मृतियाँ",
    description: "An anthology of rain-soaked verses, solitary river twilight, and letters preserved across generations.",
    curatorNote: "This collection brings together poetry, prose, and watercolor painting sharing the contemplative emotional register of Indian monsoon twilights.",
    coverImage: "/images/artworks/twilight_melancholy.jpg",
    itemSlugs: [
      "smritiyon-ki-dehari-par",
      "the-keeper-of-forgotten-manuscripts",
      "the-melancholy-of-twilight"
    ]
  },
  {
    id: "col-02",
    slug: "thresholds-of-becoming",
    title: "Thresholds of Becoming",
    titleHi: "सृजन की देहरी",
    description: "An exploration of creative solitude, philosophical silence, and calligraphic devotion.",
    curatorNote: "Exploring how silence and disciplined practice nurture the interior architecture of the maker.",
    coverImage: "/images/artworks/akshar_mandala.jpg",
    itemSlugs: [
      "the-architecture-of-solitude",
      "maun-aur-shabd-srijan-ki-yatra",
      "devanagari-akshar-mandala",
      "echoes-of-the-silent-valley",
      "the-quiet-presence"
    ]
  }
];
