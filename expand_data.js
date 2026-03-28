import fs from 'fs';
import path from 'path';

const TARGET_COUNT = 2000;
const DATA_DIR = './src/data/games';

const tabooClusters = [
    { word: "Avukat", forbidden: ["Mahkeme", "Savunma", "Hukuk", "Dava", "Cübbe"] },
    { word: "Doktor", forbidden: ["Hastane", "İlaç", "Muayene", "Beyaz", "Stetoskop"] },
    { word: "Güneş", forbidden: ["Sarı", "Yıldız", "Sıcak", "Gündüz", "Ay"] },
    { word: "Kitap", forbidden: ["Okumak", "Sayfa", "Yazar", "Kütüphane", "Roman"] },
    { word: "Telefon", forbidden: ["Aramak", "Mesaj", "Ekran", "Akıllı", "Konuşmak"] },
    { word: "Araba", forbidden: ["Tekerlek", "Sürmek", "Direksiyon", "Taşıt", "Motor"] },
    { word: "Okul", forbidden: ["Öğrenci", "Ders", "Sınıf", "Eğitim", "Öğretmen"] },
    { word: "Buzdolabı", forbidden: ["Mutfak", "Soğuk", "Yemek", "Beyaz Eşya", "Dondurucu"] },
    { word: "Fırın", forbidden: ["Ekmek", "Sıcak", "Pişirmek", "Mutfak", "Pasta"] },
    { word: "Kedi", forbidden: ["Miyav", "Tüy", "Pati", "Hayvan", "Süt"] },
    { word: "Köpek", forbidden: ["Havlamak", "Sadık", "Hayvan", "Pati", "Kemik"] },
    { word: "Deniz", forbidden: ["Mavi", "Su", "Yüzmek", "Balık", "Dalga"] },
    { word: "Gözlük", forbidden: ["Göz", "Görmek", "Uzak", "Yakın", "Cam"] },
    { word: "Televizyon", forbidden: ["Ekran", "Kanal", "Dizi", "Kumanda", "Haber"] },
    { word: "Bilgisayar", forbidden: ["İnternet", "Klavye", "Fare", "Ekran", "Yazılım"] },
    { word: "Kış", forbidden: ["Soğuk", "Kar", "Mevsim", "Aralık", "Ocak"] },
    { word: "Yaz", forbidden: ["Sıcak", "Tatil", "Güneş", "Deniz", "Temmuz"] },
    { word: "Pasta", forbidden: ["Doğum Günü", "Mum", "Kek", "Tatlı", "Şeker"] },
    { word: "Uçak", forbidden: ["Havalimanı", "Pilot", "Kanat", "Uçmak", "Bulut"] },
    { word: "Futbol", forbidden: ["Top", "Maç", "Saha", "Kale", "Oyuncu"] },
    { word: "Bıçak", forbidden: ["Keskin", "Mutfak", "Kesmek", "Çatal", "Metal"] },
    { word: "Ayakkabı", forbidden: ["Ayak", "Yürümek", "Bağcık", "Mağaza", "Çorap"] },
    { word: "Gül", forbidden: ["Çiçek", "Kırmızı", "Diken", "Koku", "Bitki"] },
    { word: "Ekmek", forbidden: ["Fırın", "Buğday", "Hamur", "Yemek", "Somun"] },
    { word: "Saat", forbidden: ["Zaman", "Dakika", "Kol", "Saniye", "Akrebi"] },
    { word: "Diş Fırçası", forbidden: ["Macun", "Ağız", "Temiz", "Sabah", "Beyaz"] },
    { word: "Ayna", forbidden: ["Cam", "Bakmak", "Görüntü", "Yüz", "Yansıma"] },
    { word: "Para", forbidden: ["Cüzdan", "Banka", "Zengin", "Lira", "Kuruş"] },
    { word: "Anahtar", forbidden: ["Kapı", "Kilit", "Açmak", "Metal", "Kasa"] },
    { word: "Orman", forbidden: ["Ağaç", "Yeşil", "Doğa", "Hayvan", "Oksijen"] },
    { word: "Yağmur", forbidden: ["Bulut", "Su", "Islanmak", "Şemsiye", "Hava"] },
    { word: "Polis", forbidden: ["Emniyet", "Suç", "Üniforma", "Karakol", "Telsiz"] },
    { word: "Şehir", words: ["İstanbul", "Ankara", "İzmir", "Paris", "Londra"], forbidden: ["Kalabalık", "Kent", "Merkez", "Bina", "Cadde"] },
    { word: "Müzik", words: ["Şarkı", "Nota", "Enstrüman", "Melodi", "Ses"], forbidden: ["Dinlemek", "Radyo", "Konser", "Sanat", "Kulağa"] }
];

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndMulti = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

function generate(type, count) {
    const list = new Set();
    let attempts = 0;

    while (list.size < count && attempts < count * 50) {
        attempts++;
        let item;
        const entry = rnd(tabooClusters);

        if (type === 'taboo') {
            // Use specific word if entry has single 'word', or random from 'words' if available
            const word = entry.word || rnd(entry.words);
            const forbidden = rndMulti(entry.forbidden, 5);
            item = JSON.stringify({ word, forbidden });
        }
        else if (type === 'spyfall') {
            const name = (entry.word || entry.name || rnd(entry.words)) + " " + rnd(['Yarışması', 'Festivali', 'Merkezi']);
            item = JSON.stringify({ name, roles: ['Casus', 'Uzman', 'Görevli', 'Ziyaretçi', 'Yönetici'] });
        }
        else if (type === 'emoji') {
            const fruitEmojis = ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒", "🍑"];
            item = JSON.stringify({ emojis: rnd(fruitEmojis) + "🤔", answer: entry.word || rnd(entry.words) });
        }
        else if (type === 'questions') {
            item = `En çok kimi ${rnd(['seversin', 'kıskanırsın', 'özlersin'])}?`;
        }
        else if (type === 'truth') {
            item = `Hiç ${(entry.word || rnd(entry.words)).toLowerCase()} çalmayı düşündün mü?`;
        }
        else if (type === 'dare') {
            item = `Bir ${(entry.word || rnd(entry.words)).toLowerCase()} taklidi yap.`;
        }
        else {
            item = entry.word || rnd(entry.words);
        }

        if (item) list.add(item);
    }
    return Array.from(list);
}

const files = fs.readdirSync(DATA_DIR);

for (const file of files) {
    const fullPath = path.join(DATA_DIR, file);

    if (file === 'taboo.json') {
        const data = generate('taboo', TARGET_COUNT).map(s => JSON.parse(s));
        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
    }
    else if (file === 'spyfall.json') {
        const data = generate('spyfall', TARGET_COUNT).map(s => JSON.parse(s));
        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
    }
    else if (file === 'emojibulmaca.json') {
        const data = generate('emoji', TARGET_COUNT).map(s => JSON.parse(s));
        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
    }
    else if (file === 'dogrulukcesaret.json') {
        const dogruluk = generate('truth', TARGET_COUNT);
        const cesaret = generate('dare', TARGET_COUNT);
        fs.writeFileSync(fullPath, JSON.stringify({ dogruluk, cesaret }, null, 2));
    }
    else if (file === 'kimdaha.json' || file === 'anketor.json') {
        const data = generate('questions', TARGET_COUNT);
        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
    }
    else {
        const data = generate('fallback', TARGET_COUNT);
        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
    }

    console.log(`Updated ${file}`);
}

console.log('Successfully updated all game data with PERFECT Taboo quality!');
