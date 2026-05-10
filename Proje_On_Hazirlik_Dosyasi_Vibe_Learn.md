# Proje Ön Hazırlık Dosyası

## 1. Proje Tanımı
**Proje Adı:** Vibe Learn
**Amacı:** Öğretmenlerin veya moderatörlerin gerçek zamanlı interaktif sınavlar (Kahoot benzeri) düzenleyebileceği, kullanıcıların ise bu sınavlara katılıp anlık rekabet edebileceği; aynı zamanda dijital ve ortak çalışma panoları (Padlet benzeri) sunan web tabanlı, dinamik ve gerçek zamanlı bir eğitim platformudur.
**Hangi problemi çözmektedir:** Geleneksel ve tek yönlü eğitim sistemlerindeki etkileşim eksikliğini gidererek, öğrenmeyi oyunlaştırma ve anlık geri bildirimlerle eğlenceli hale getirir. Proje veya ödev odaklı grup çalışmalarını tek bir merkezi dijital panoda toplar.
**Kimler tarafından kullanılacaktır:** Öğrenciler, öğretmenler, moderatörler ve eğitim yöneticileri.
**Kullanıcı sistemi neden kullanmak isteyecektir:** Eğlenerek öğrenmek, interaktif testler aracılığıyla sınıf içi/dışı tatlı bir rekabet yaşamak ve dijital panolar sayesinde ortak çalışmaları kolayca yürütebilmek için.

## 2. Hedef Kullanıcılar
* **Öğretmen / Yönetici:** Sistemde hesap açabilir, sınav (quiz) oluşturabilir, soruları tek tek ekleyebileceği gibi Excel/CSV formatlarında toplu olarak da yükleyebilir. İşbirliği panoları oluşturabilir. Aktif sınav oturumlarını başlatıp yönetir, sınav bitiminde öğrenci ve soru bazlı detaylı istatistikleri (doğru, yanlış, boş oranları) inceler.
* **Öğrenci / Katılımcı:** Bir hesaba ihtiyaç duymadan, sağlanan PIN veya QR kod ile sınav lobisine katılır. Soruları kendi cihazından (telefon/bilgisayar) anlık olarak yanıtlayıp liderlik tablosunda yarışır. Ayrıca erişimi olan işbirliği panolarına gönderiler (post) ve çoklu medya/dosya (görsel, belge) ekleyerek grup çalışmasına katkıda bulunur.

## 3. Proje Kapsamı
Sistemde bulunacak temel özellikler aşağıda listelenmiştir:
* Kullanıcı kayıt ve giriş sistemi (JWT ve bcrypt destekli).
* Gerçek zamanlı sınav (quiz) oluşturma, düzenleme ve silme işlemleri.
* CSV ve Excel dosyalarından veri sanitizasyonu ile toplu soru yükleme.
* Socket.IO ile yönetilen, düşük gecikmeli, gerçek zamanlı sınav oturumları (lobi bekleme odası, PIN/QR Kod ile katılım, canlı skor takibi, otomatik soru geçişleri).
* Sınav sonu detaylı ve profesyonel başarı istatistikleri (öğrenci bazında ve soru bazında).
* Gerçek zamanlı ortak çalışma (işbirliği) panosu (Board) altyapısı.
* Panoya metin, çoklu dosya (belge) ve görsel eklentisi yapabilme özellikleri (JSON tabanlı esnek attachment sistemi).
* Tüm platform genelinde premium "Zümrüt Yeşili" (Emerald Green) estetiğinde, modern, yüksek yoğunluklu (full-width) ve interaktif kullanıcı arayüzü.

## 4. Sayfa ve Ekran Planı
| Sayfa Adı | Açıklama |
| --- | --- |
| **Ana Sayfa** | Platformu tanıtan, sisteme giriş/kayıt bağlantıları sunan ve devam eden oturumlara PIN/QR ile katılım alanı barındıran karşılama ekranı. |
| **Giriş Yap / Kayıt Ol** | Kullanıcıların sisteme giriş yaptığı ve yeni öğretmen/moderatör hesabı oluşturduğu ekranlar. |
| **Dashboard (Öğretmen Paneli)** | Kullanıcının önceden oluşturduğu tüm sınavların ve panoların (board) listelendiği, yeni sınav veya pano oluşturma kısayollarının yer aldığı merkezi yönetim sayfası. |
| **Sınav Oluştur / Düzenle** | Soruların manuel olarak tek tek eklendiği veya CSV/Excel ile toplu olarak içe aktarıldığı kapsamlı form ekranı. |
| **Lobi Ekranı** | Sınav henüz başlatılmadan önce, katılımcıların büyük bir QR Kod veya PIN okutarak bağlandıklarını ve beklediklerini gösteren hazırlık odası. |
| **Canlı Sınav Ekranı** | Soruların anlık olarak cihazlara düştüğü, sürenin aktığı, öğrencilerin renkli şıkları seçtiği yarışma sayfası. |
| **Liderlik Tablosu & İstatistikler** | Sınav sırasında her soru bitiminde anlık puan durumlarını; sınav komple bittiğinde ise kilitli ve profesyonel bir arayüzde doğru/yanlış cevapların detaylı analizini gösteren raporlama ekranı. |
| **İşbirliği Panosu (Board)** | Tüm ekranı kaplayan, kullanıcıların ortaklaşa içerik, çoklu medya ve belge ekleyebildiği, sağ tarafta aktif katılımcıların yer aldığı yüksek alan verimli etkileşimli duvar. |

## 5. Menü Yapısı
* **Ziyaretçi Menüsü (Üst Menü):**
  * Vibe Learn (Logo - Ana Sayfaya Gider)
  * Ana Sayfa
  * Giriş Yap
  * Kayıt Ol
* **Üye/Öğretmen Menüsü (Üst/Yan Menü):**
  * Vibe Learn (Logo)
  * Quizzes (Sınavlarım)
  * Boards (Panolarım)
  * İstatistikler
  * Profil
  * Çıkış Yap

## 6. Kullanıcı Senaryoları
* **Senaryo 1 (Sınav Hazırlama ve Başlatma):** Öğretmen sisteme güvenli şekilde giriş yapar. Panel üzerinden "Yeni Sınav Oluştur" butonuna tıklar. Bilgisayarındaki bir Excel dosyasını seçerek 20 soruluk bir quizi saniyeler içinde sisteme yükler. Ardından "Sınavı Başlat" komutu verir. Ekranda büyük bir QR Kod ve PIN belirir, sınıfın QR kodu okutmasını bekler.
* **Senaryo 2 (Sınava Katılma ve Yarışma):** Öğrenci akıllı telefonuyla sınıf tahtasındaki QR kodu okutur. Açılan web sayfasında takma adını (nickname) yazarak "Lobiye Katıl" der. Öğretmen sınavı başlattığında öğrencinin telefon ekranında şıklar belirir, doğru cevabı en hızlı şekilde seçerek en yüksek puanı almaya çalışır.
* **Senaryo 3 (İşbirliği Panosu Kullanımı):** Bir proje grubu, kendileri için oluşturulmuş Pano (Board) linkine tıklar. Sayfanın sağ tarafındaki listede o an panoda olan arkadaşlarını görürler. Pano üzerine araştırma notlarını, buldukları referans görsellerini ve proje PDF'lerini "Yeni Post Ekle" formuyla eklerler; tüm değişiklikler herkesin ekranında sayfa yenilenmeden anlık olarak görünür.

## 7. Veri Planı
Platformda kullanılacak MySQL veritabanındaki ana tablolar ve kolonları şöyledir:

* **Users (Kullanıcılar Tablosu)**
  * `id`: Kullanıcı numarası (Primary Key)
  * `name`: Kullanıcının ad ve soyadı
  * `email`: Kullanıcı e-posta adresi (Benzersiz)
  * `password`: Şifrelenmiş (Bcrypt) parola
  * `role`: Kullanıcı yetkisi (Öğretmen, Admin vb.)
* **Quizzes (Sınavlar Tablosu)**
  * `id`: Sınav numarası
  * `user_id`: Sınavı oluşturan kullanıcı id
  * `title`: Sınav başlığı
  * `description`: Sınavın kısa açıklaması
  * `created_at`: Oluşturulma tarihi
* **Questions (Sorular Tablosu)**
  * `id`: Soru numarası
  * `quiz_id`: Bağlı olduğu sınavın id'si
  * `question_text`: Soru metni
  * `options`: Şıkların bulunduğu alan (JSON formatında saklanır)
  * `correct_option`: Doğru cevabın hangisi olduğu
  * `time_limit`: Sorunun çözülmesi için verilen süre (saniye)
* **QuizResults (Sınav Sonuçları)**
  * `id`: Sonuç kayıt numarası
  * `quiz_id`: Bağlı olduğu sınav
  * `participant_name`: Katılımcı takma adı
  * `score`: Toplam puan
  * `correct_count`, `incorrect_count`, `empty_count`: İstatistik detayları
* **Boards (Panolar) ve BoardPosts (Pano Gönderileri)**
  * `id`, `board_id`, `user_id`: Bağlantı numaraları
  * `content`: Gönderinin metni
  * `attachments`: Gönderiye eklenen çoklu görsel veya belgelerin verileri (JSON Array).

## 8. Formlar ve Giriş Alanları
Platformda bulunacak temel giriş alanları:
* **Kayıt Formu:** Ad Soyad, E-posta Adresi, Şifre, Şifre Tekrar.
* **Giriş Formu:** E-posta Adresi, Şifre.
* **Manuel Soru Ekleme Formu:** Soru Metni, A Şıkkı, B Şıkkı, C Şıkkı, D Şıkkı, Doğru Cevap Seçimi (Açılır Menü), Süre (Saniye - Varsayılan 20).
* **Toplu Soru Yükleme Formu:** Dosya Seçme Alanı (Sadece .csv, .xls, .xlsx destekli).
* **Pano (Board) Post Ekleme Formu:** İçerik Metni (Textarea), Dosya Ekleme Butonu (Görsel ve belge çoklu seçimi için).
* **Lobi Katılım Formu:** Sınav PIN Kodu, Kullanıcı (Takma) Adı.

## 9. Taslak Ekran Çizimleri
(Bu bölümün proje tesliminden önce çizim araçlarıyla Figma, Word vs. doldurulması gerekmektedir. Ekranlar Vibe Learn'ün zümrüt yeşili temasına uygun modern yapıda olacaktır.)
* **Ana Sayfa:** Üstte Logo ve Navbar. Sayfa ortasında büyük bir "Oyuna Katıl" (PIN Gir) kutucuğu, altında özelliklerin tanıtıldığı kartlar.
* **Öğretmen Paneli:** Solda dikey yönlendirme menüsü. Sağ geniş alanda kullanıcının önceden oluşturduğu sınavların istatistik özetleriyle birlikte bulunduğu şık bilgi kartları.
* **Lobi:** Ekranın büyük kısmını kaplayan dev bir QR Kod ve hemen altında PIN numarası. En altta ise lobiye giren katılımcıların isimlerinin baloncuklar halinde dinamik olarak eklenip listelendiği alan.
* **Board (Pano):** İçeriğe maksimum yer açmak için tam ekran genişliğinde grid yapı. Gönderiler duvar üzerinde hizalanmış kartlar halinde durur. Sağ tarafta aktif katılımcı listesinin ve panoya katılma QR kodunun yer aldığı dikey bir kenar çubuğu.

## 10. Kullanılacak Teknolojiler
Projenin ölçeklenebilir ve eşzamanlı çalışabilmesi için modern bir teknoloji yığını seçilmiştir:
* **Frontend (İstemci):** React.js, Vite (hızlı derleme), Tailwind CSS (hızlı ve modern UI şekillendirme), React Router DOM (sayfa yönlendirmesi), Axios (API istekleri), Socket.IO-Client, Papaparse ve XLSX (Dosya okuma kütüphaneleri).
* **Backend (Sunucu):** Node.js, Express.js (Rest API yapısı), Socket.IO (Gerçek zamanlı websocket bağlantıları), Multer (Çoklu medya yükleme yönetimi), JSONWebToken (JWT) ve Bcrypt.js (Güvenlik).
* **Veritabanı:** MySQL (Veri ilişkilerini sağlamak için `mysql2` driver'ı kullanılacaktır).

## 11. Proje Klasör Yapısı
Proje klasik bir Monorepo tarzına benzer olarak iki ana klasöre ayrılarak organize edilmiştir:
```text
vibe-learn-project/
│
├── client/                     # Frontend Projesi (React + Vite)
│   ├── public/                 # Statik dosyalar ve iconlar
│   ├── src/
│   │   ├── components/         # Tekrar kullanılabilir arayüz bileşenleri (Navbar, Card, Button)
│   │   ├── pages/              # Ana sayfalar (Home, QuizList, LiveQuiz, Board, Login vs.)
│   │   ├── utils/              # Yardımcı modüller (API config, WebSockets bağlantısı)
│   │   ├── App.jsx             # Ana yönlendirme kapsayıcısı
│   │   ├── index.css           # Tailwind ve Global CSS dosyası
│   │   └── main.jsx            # React root tetikleyicisi
│   ├── package.json
│   └── tailwind.config.js      # Tema ve zümrüt yeşili palet konfigürasyonları
│
└── server/                     # Backend Projesi (Node.js + Express)
    ├── config/                 # Veritabanı ve Socket.io ortam değişkenleri/bağlantı ayarları
    ├── controllers/            # İş mantığı (User, Quiz, Board kontrolleri)
    ├── middlewares/            # JWT doğrulama, hata ayıklama ve dosya yükleme (Multer) işlemleri
    ├── routes/                 # API Uç Noktaları (Endpoints)
    ├── uploads/                # Sunucuya yüklenen medya ve dokümanların klasörü
    ├── server.js               # Ana sunucu başlangıç ve Socket dinleyici dosyası
    └── package.json
```
