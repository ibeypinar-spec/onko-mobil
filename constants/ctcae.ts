import type { SemptomTanim } from '../types';

// Onkoloji hastasına özel, en sık görülen CTCAE semptomları
// Grade açıklamaları hastanın anlayacağı sade Türkçe ile yazıldı

export const SEMPTOMLAR: SemptomTanim[] = [
  {
    id: 'nausea',
    ad: 'Bulantı',
    emoji: '🤢',
    aciklama: 'Mide bulantısı hissi',
    gradeAciklamalari: [
      'Hiç yok',
      'Hafif — iştah biraz azaldı, yemek yiyebiliyorum',
      'Orta — yemek yiyemiyorum ama sıvı alıyorum',
      'Şiddetli — sıvı alamıyorum, çok rahatsızım',
      'Çok şiddetli — hastane gerekiyor',
    ],
    acilGrade: 3,
  },
  {
    id: 'vomiting',
    ad: 'Kusma',
    emoji: '🤮',
    aciklama: '24 saatteki kusma sayısı',
    gradeAciklamalari: [
      'Hiç yok',
      '1–2 kez kustum',
      '3–5 kez kustum',
      '6 kereden fazla kustum / IV sıvı gerekiyor',
      'Hayatı tehdit edici',
    ],
    acilGrade: 3,
  },
  {
    id: 'fatigue',
    ad: 'Yorgunluk',
    emoji: '😴',
    aciklama: 'Genel halsizlik ve yorgunluk',
    gradeAciklamalari: [
      'Hiç yok',
      'Hafif — günlük işlerimi yapabiliyorum',
      'Orta — bazı işlerimi yapamıyorum',
      'Şiddetli — bakıma ihtiyacım var',
      'Yataktan kalkamıyorum',
    ],
    acilGrade: 4,
  },
  {
    id: 'pain',
    ad: 'Ağrı',
    emoji: '🤕',
    aciklama: 'Genel vücut veya tedaviye bağlı ağrı',
    gradeAciklamalari: [
      'Hiç ağrı yok',
      'Hafif ağrı — ilaç gerektirmiyor',
      'Orta ağrı — ağrı kesici kullanıyorum',
      'Şiddetli ağrı — güçlü ağrı kesici gerekiyor',
      'Dayanılmaz ağrı',
    ],
    acilGrade: 3,
  },
  {
    id: 'diarrhea',
    ad: 'İshal',
    emoji: '🚽',
    aciklama: 'Günlük dışkılama sayısı',
    gradeAciklamalari: [
      'Normal',
      'Normalden 1–3 kez fazla',
      'Normalden 4–6 kez fazla',
      'Normalden 7+ kez fazla / IV tedavi gerekiyor',
      'Hayatı tehdit edici',
    ],
    acilGrade: 3,
  },
  {
    id: 'neuropathy',
    ad: 'Uyuşma/Karıncalanma',
    emoji: '⚡',
    aciklama: 'Ellerde veya ayaklarda uyuşma, karıncalanma',
    gradeAciklamalari: [
      'Hiç yok',
      'Hafif uyuşma var ama günlük işlerimi yapıyorum',
      'Orta — bazı ince işleri yapamıyorum',
      'Şiddetli — günlük işlerimi yapamıyorum',
      'Kalıcı hasar',
    ],
    acilGrade: 4,
  },
  {
    id: 'mucositis',
    ad: 'Ağız Yarası',
    emoji: '👄',
    aciklama: 'Ağız içi ağrı veya yara',
    gradeAciklamalari: [
      'Hiç yok',
      'Hafif — yutmak biraz ağrılı',
      'Orta — sadece sıvı alabiliyorum',
      'Şiddetli — hiçbir şey yiyemiyorum',
      'Hayatı tehdit edici',
    ],
    acilGrade: 3,
  },
  {
    id: 'hand_foot',
    ad: 'El-Ayak Sendromu',
    emoji: '🖐️',
    aciklama: 'Ellerde veya ayaklarda kızarıklık, ağrı, kabarcık',
    gradeAciklamalari: [
      'Hiç yok',
      'Hafif kızarıklık, karıncalanma var',
      'Ağrılı kızarıklık — günlük işleri etkiliyor',
      'Şiddetli ağrı — deri soyuluyor',
      'Yürüyemiyorum',
    ],
    acilGrade: 3,
  },
  {
    id: 'dyspnea',
    ad: 'Nefes Darlığı',
    emoji: '😮‍💨',
    aciklama: 'Nefes almakta güçlük',
    gradeAciklamalari: [
      'Hiç yok',
      'Orta tempoda yürürken oluyor',
      'Az yürürken veya merdiven çıkarken oluyor',
      'Dinlenirken bile var — yardıma ihtiyacım var',
      'Acil yardım gerekiyor',
    ],
    acilGrade: 3,
  },
  {
    id: 'fever',
    ad: 'Ateş',
    emoji: '🌡️',
    aciklama: 'Vücut sıcaklığı yüksekliği',
    gradeAciklamalari: [
      'Normal (36–37°C)',
      '38.0–39.0°C arası',
      '39.1–40.0°C arası',
      '40°C üzeri',
      'Hayatı tehdit edici',
    ],
    acilGrade: 2,
  },
  {
    id: 'appetite_loss',
    ad: 'İştah Kaybı',
    emoji: '🍽️',
    aciklama: 'Yemek yemek istememe',
    gradeAciklamalari: [
      'Normal iştahım var',
      'İştahım biraz azaldı',
      'İştahım çok azaldı, az yiyorum',
      'Yemek yiyemiyorum — beslenme desteği gerekiyor',
      'Hayatı tehdit edici',
    ],
    acilGrade: 4,
  },
  {
    id: 'constipation',
    ad: 'Kabızlık',
    emoji: '😣',
    aciklama: 'Tuvalet yapamama',
    gradeAciklamalari: [
      'Normal',
      '3–4 gün tuvaletsizlik — ilaç almadan geçti',
      'İlaç aldım ama geçmedi',
      'Şiddetli — müdahale gerekiyor',
      'Hayatı tehdit edici',
    ],
    acilGrade: 3,
  },
];

export const SEMPTOM_MAP = Object.fromEntries(SEMPTOMLAR.map(s => [s.id, s]));

// Grade renk ve emoji eşleştirmeleri
export const GRADE_RENK: Record<number, string> = {
  0: '#22c55e',   // yeşil
  1: '#84cc16',   // açık yeşil
  2: '#f59e0b',   // sarı-turuncu
  3: '#ef4444',   // kırmızı
  4: '#7c3aed',   // mor (acil)
};

export const GRADE_EMOJI: Record<number, string> = {
  0: '😊',
  1: '🙂',
  2: '😐',
  3: '😟',
  4: '😰',
};

export const GRADE_ETIKET: Record<number, string> = {
  0: 'Yok',
  1: 'Hafif',
  2: 'Orta',
  3: 'Şiddetli',
  4: 'Acil',
};
