export const RENKLER = {
  // Marka
  birincil:     '#1e3a5f',   // koyu lacivert
  ikincil:      '#2563eb',   // mavi
  vurgu:        '#0ea5e9',   // açık mavi

  // Arka plan
  arkaplan:     '#f0f4f8',
  kart:         '#ffffff',
  kenarlık:     '#e2e8f0',

  // Metin
  metinBirincil:  '#1e293b',
  metinIkincil:   '#64748b',
  metinAcik:      '#94a3b8',

  // Durum
  basari:       '#22c55e',
  uyari:        '#f59e0b',
  hata:         '#ef4444',
  bilgi:        '#3b82f6',

  // Tab bar
  tabAktif:     '#1e3a5f',
  tabPasif:     '#94a3b8',
  tabArkaplan:  '#ffffff',

  // Grade
  grade0:       '#22c55e',
  grade1:       '#84cc16',
  grade2:       '#f59e0b',
  grade3:       '#ef4444',
  grade4:       '#7c3aed',

  // İlaç türü
  oral:         '#0ea5e9',
  iv:           '#8b5cf6',
  sc:           '#f97316',
} as const;

export const GOLGE = {
  kucuk: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orta: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
