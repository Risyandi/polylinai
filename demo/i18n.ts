/**
 * PolylinAI - Demo Localization Dictionary (i18n)
 *
 * Created by Risyandi in collaboration with AI.
 * Contact: hello@risyandi.com
 * Licensed under the MIT License.
 */

export type SupportedLocale = 'en' | 'id';

export const translations: Record<SupportedLocale, Record<string, string>> = {
  en: {
    brandTag: 'v0.1.0 (Production Core)',
    undo: '↺ Undo',
    redo: '↻ Redo',
    clearAll: 'Clear All',
    feedTitle: 'Simulated CCTV Feed (1920x1080 Aspect Ratio)',
    drawPolygon: '⬡ Draw Polygon Zone',
    drawPolyline: '⟋ Draw Tripwire Line',
    finishZone: '✓ Complete Zone',
    cancel: '✕ Cancel',
    interactionTips:
      'Interaction Tips: Click on video to add points. Double-click or click first point to close polygon. Select a zone to drag vertices or click on edge midpoints to dynamically insert vertices. Right-click any vertex to remove it.',
    zoneConfig: 'Zone Configuration',
    zoneConfigPlaceholder:
      'Select or draw a zone to edit directional flows and attributes.',
    definedZones: 'Defined Zones',
    noActiveZones: 'No active zones.',
    cvExport: 'Computer Vision Export',
    selectAiSchema: 'Select AI Pipeline Schema:',
    copyClipboard: 'Copy to Clipboard',
    copied: 'Copied!',
    loadPreset: 'Load Preset',
    liveAnalytics: 'Live Tripwire Analytics',
    resetCounts: 'Reset Counts',
    noTripwiresActive: 'Draw a tripwire across the road to begin real-time vehicle counting.',
    zoneName: 'Zone Name',
    zoneColor: 'Zone Color',
    countingFlow: 'Counting Flow Direction',
    deleteZone: 'Delete Zone',
    noneOmnidirectional: 'None (Omnidirectional Alert)',
    themeDark: 'Dark Mode',
    themeLight: 'Light Mode',
    inflow: 'IN',
    outflow: 'OUT',
    total: 'TOTAL',
    confirmClear: 'Clear all drawn zones?',
    yoloOption: 'YOLO Segmentation (Normalized)',
    opencvOption: 'OpenCV Scaled Points (JSON)',
    pythonOption: 'OpenCV Python Code Snippet',
    supervisionOption: 'Roboflow / Supervision JSON',
    nativeOption: 'PolylinAI Native JSON',
    polygonType: 'Polygon',
    tripwireType: 'Tripwire',
  },
  id: {
    brandTag: 'v0.1.0 (Inti Produksi)',
    undo: '↺ Urungkan',
    redo: '↻ Ulangi',
    clearAll: 'Hapus Semua',
    feedTitle: 'Umpan CCTV Simulasi (Rasio Aspek 1920x1080)',
    drawPolygon: '⬡ Gambar Zona Poligon',
    drawPolyline: '⟋ Gambar Garis Tripwire',
    finishZone: '✓ Selesaikan Zona',
    cancel: '✕ Batal',
    interactionTips:
      'Petunjuk Interaksi: Klik pada video untuk menambah titik. Klik dua kali atau klik titik pertama untuk menutup poligon. Pilih zona untuk menggeser simpul atau klik titik tengah garis untuk menyisipkan simpul baru secara dinamis. Klik kanan pada simpul mana pun untuk menghapusnya.',
    zoneConfig: 'Konfigurasi Zona',
    zoneConfigPlaceholder:
      'Pilih atau gambar zona untuk mengedit arus arah dan atribut.',
    definedZones: 'Zona Terdefinisi',
    noActiveZones: 'Belum ada zona aktif.',
    cvExport: 'Ekspor Computer Vision',
    selectAiSchema: 'Pilih Skema Pipeline AI:',
    copyClipboard: 'Salin ke Papan Klip',
    copied: 'Tersalin!',
    loadPreset: 'Muat Preset',
    liveAnalytics: 'Analisis Tripwire Langsung',
    resetCounts: 'Reset Hitungan',
    noTripwiresActive: 'Gambar garis tripwire melintasi jalan untuk memulai penghitungan kendaraan langsung.',
    zoneName: 'Nama Zona',
    zoneColor: 'Warna Zona',
    countingFlow: 'Arah Arus Penghitungan',
    deleteZone: 'Hapus Zona',
    noneOmnidirectional: 'Tidak Ada (Peringatan Segala Arah)',
    themeDark: 'Mode Gelap',
    themeLight: 'Mode Terang',
    inflow: 'MASUK',
    outflow: 'KELUAR',
    total: 'TOTAL',
    confirmClear: 'Hapus semua zona yang telah digambar?',
    yoloOption: 'Segmentasi YOLO (Ternormalisasi)',
    opencvOption: 'Titik Skala OpenCV (JSON)',
    pythonOption: 'Cuplikan Kode Python OpenCV',
    supervisionOption: 'JSON Roboflow / Supervision',
    nativeOption: 'JSON Asli PolylinAI',
    polygonType: 'Poligon',
    tripwireType: 'Tripwire',
  },
};

let currentLocale: SupportedLocale =
  (localStorage.getItem('polylinai-lang') as SupportedLocale) || 'en';

export function getLocale(): SupportedLocale {
  return currentLocale;
}

export function setLocale(locale: SupportedLocale): void {
  currentLocale = locale;
  localStorage.setItem('polylinai-lang', locale);
}

export function t(key: string): string {
  return translations[currentLocale]?.[key] || translations.en[key] || key;
}
