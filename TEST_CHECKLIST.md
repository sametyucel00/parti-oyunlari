# Party Games Test Checklist

Bu liste, tum oyunlari tek tek hatasiz ve tutarli calistigini dogrulamak icin hazirlandi.

## Genel Kontroller

- Uygulama acilisinda ana menu ve oyun listesi sorunsuz yukleniyor.
- Her oyunda Oyunculari Belirle ekranindan en az 2 oyuncu ile baslanabiliyor.
- Tur, puan ve oyuncu gecisleri oyun sonunda dogru ilerliyor.
- Duraklat / devam / cikis modal akisi tum oyunlarda calisiyor.
- Oyun bitiminde siralama ve yuksek skor kaydi dogru gorunuyor.
- Mobilde tasma, tasarim bozulmasi, buton cakismasi olmuyor.

## Oyun Bazli Kontroller

### Tabu
- Kartta ana kelime ve yasakli kelimeler dogru gorunur.
- Dogru / Pas / Tabu butonlari puani dogru etkiler.

### Casus
- Roller gizli dagitilir.
- Casus ve normal oyuncu ekranlari ayrik calisir.
- Sure ve oylama asamasi sorunsuz gecilir.

### Alnina Koy
- Kelime tam ekran okunur.
- Pas ve dogru akisi puanlar.

### Bomba
- Rastgele sureyle bomba patlar.
- Patlama sonrasi tur dogru biter.

### Kim Daha
- Soru okunur, geri sayim calisir.
- Oylama sonucu akisi turu sonlandirir.

### Dudak Okuma
- Cümleler anlamli ve okunabilir.
- Pas/dogru ile kelime havuzu ilerler.

### Mirildan Bul
- Sarki ve ipucu metni gorunur.
- Dogru/pas akisi puanlar.

### Sessiz Sinema
- Icerik film bazli ve anlamli cikiyor.
- Sure, pas ve dogru akislari stabil.

### Iki Gercek Bir Yalan
- Asama gecisleri (anlatim -> oylama) sorunsuz.
- Sonuc puanlamasi dogru.

### Ciz ve Tahmin Et
- Kelimeyi goster/gizle tasarimi bozmuyor.
- Cizim canvas'i mobil ve desktopta stabil.

### Hikaye Zinciri
- Baslangic cumlesi anlamli gelir.
- Sure bitince ve tur gecisinde hata olmaz.

### Hizli Parmaklar
- Bekle/dokun ekranlari dogru renkte calisir.
- Erken dokunma cezasi isler.

### Kelime Iliski
- Kelime havuzu anlamsiz tekrar uretmez.
- Sure bitisi ve puanlama dogru.

### Kelime Zinciri
- Baslangic kelimesi dogru gelir.
- 60 saniye akisi ve puanlama dogru ilerler.

### Anketor
- Gizli oylama sirali ilerler.
- Sonuc listesi oy sayisina gore dogru siralanir.

### Akil Okuma (Telepati)
- Partner secimi dogru filtrelenir.
- Geri sayim ve sonuc ekrani calisir.

### Sifreli Konusma
- Sifreli metin uretilir.
- Gercek cumle gorunur, pas/dogru akisi calisir.

### Emoji Bulmacasi
- Emoji ve cevap anlamsal olarak uyumludur.
- Cevabi goster akisi tasarimi bozmaz.

### Vampir Koylu
- Rol dagitimi, gece ve oylama asamalari sorunsuz.
- Sonuc bildirimi dogru oyuncuyu hedefler.

### 5 Saniye
- Soru formati "5 saniyede 3 ..." yapisinda.
- Sure ve grup onayi puanlamasi dogru.

### Sicak Soguk
- Gizli nesne gorunur.
- Sicak/soguk geri bildirim butonlari calisir.

### Sarki Tamamlama
- Baslangic sozu ve devam sozu gorunur.
- Cevabi goster sonrasi puanlama dogru.

### Bunu Yapar Miydin
- Iki secenek net ayri gorunur.
- Secim sonrasi tartisma ve tur gecisi sorunsuz.

### Manset At
- Promptler anlamli ve tekrar etmiyor.
- Grup onayi puani dogru verir.

### Yuz Ifadesi
- Durumlar mimikle anlatmaya uygun.
- Sure ve puan akisi dogru.

### Tek Hece
- Kelimeler anlatima uygun secilir.
- Hata/pas/dogru butonlari puani dogru etkiler.

### Heykel
- Promptler poz vermeye uygundur.
- Basari/hatali sonuclari dogru ilerler.

### Kod Adi
- Kartlar renkli dagilir.
- Suikastci secilince tur dogru biter.

### Gulmeme Challenge
- Saka metinleri okunur ve anlamli.
- Guldum / Gulmedim akisi puanlamayi dogru etkiler.

## Regresyon Kontrolu

- Oyundan cikip tekrar girince local pool hatasi olusmaz.
- Eski veriden gelen bozuk icerikler tekrar gorunmez.
- Build komutu hatasiz tamamlanir.
