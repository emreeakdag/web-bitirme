from fpdf import FPDF
import os

class PDF(FPDF):
    def header(self):
        self.set_font("Arial", "B", 16)
        self.cell(0, 10, "Vibe Learn - Proje Ön Hazırlık Dosyası", ln=True, align="C")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(0, 10, f"Sayfa {self.page_no()}", align="C")

def create_pdf():
    pdf = PDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Add Turkish font support
    font_path = r"C:\Windows\Fonts\arial.ttf"
    pdf.add_font("Arial", "", font_path)
    pdf.add_font("Arial", "B", r"C:\Windows\Fonts\arialbd.ttf")
    pdf.add_font("Arial", "I", r"C:\Windows\Fonts\ariali.ttf")
    
    pdf.add_page()
    pdf.set_font("Arial", "", 12)

    content = [
        ("1. Proje Tanımı", "B"),
        ("Proje Adı: Vibe Learn\n"
         "Amacı: Öğretmenlerin veya moderatörlerin gerçek zamanlı interaktif sınavlar düzenleyebileceği, kullanıcıların ise bu sınavlara katılıp anlık rekabet edebileceği; aynı zamanda dijital ve ortak çalışma panoları sunan web tabanlı, dinamik ve gerçek zamanlı bir eğitim platformudur.\n"
         "Hangi problemi çözmektedir: Geleneksel ve tek yönlü eğitim sistemlerindeki etkileşim eksikliğini gidererek, öğrenmeyi oyunlaştırma ve anlık geri bildirimlerle eğlenceli hale getirir. Proje veya ödev odaklı grup çalışmalarını tek bir merkezi dijital panoda toplar.\n"
         "Kimler tarafından kullanılacaktır: Öğrenciler, öğretmenler, moderatörler ve eğitim yöneticileri.\n"
         "Kullanıcı sistemi neden kullanmak isteyecektir: Eğlenerek öğrenmek, interaktif testler aracılığıyla sınıf içi/dışı tatlı bir rekabet yaşamak ve dijital panolar sayesinde ortak çalışmaları kolayca yürütebilmek için.", ""),
        
        ("2. Hedef Kullanıcılar", "B"),
        ("* Öğretmen / Yönetici: Sistemde hesap açabilir, sınav (quiz) oluşturabilir, soruları tek tek ekleyebileceği gibi Excel/CSV formatlarında toplu olarak da yükleyebilir. İşbirliği panoları oluşturabilir. Aktif sınav oturumlarını başlatıp yönetir, sınav bitiminde öğrenci ve soru bazlı detaylı istatistikleri (doğru, yanlış, boş oranları) inceler.\n"
         "* Öğrenci / Katılımcı: Bir hesaba ihtiyaç duymadan, sağlanan PIN veya QR kod ile sınav lobisine katılır. Soruları kendi cihazından (telefon/bilgisayar) anlık olarak yanıtlayıp liderlik tablosunda yarışır. Ayrıca erişimi olan işbirliği panolarına gönderiler (post) ve çoklu medya/dosya (görsel, belge) ekleyerek grup çalışmasına katkıda bulunur.", ""),

        ("3. Proje Kapsamı", "B"),
        ("Sistemde bulunacak temel özellikler:\n"
         "- Kullanıcı kayıt ve giriş sistemi (JWT ve bcrypt destekli).\n"
         "- Gerçek zamanlı sınav (quiz) oluşturma, düzenleme ve silme işlemleri.\n"
         "- CSV ve Excel dosyalarından veri sanitizasyonu ile toplu soru yükleme.\n"
         "- Socket.IO ile yönetilen, düşük gecikmeli, gerçek zamanlı sınav oturumları.\n"
         "- Sınav sonu detaylı ve profesyonel başarı istatistikleri.\n"
         "- Gerçek zamanlı ortak çalışma (işbirliği) panosu (Board) altyapısı.\n"
         "- Panoya metin, çoklu dosya (belge) ve görsel eklentisi (JSON tabanlı).\n"
         "- Yüksek kullanıcı deneyimi odaklı, şık ve dinamik modern arayüz tasarımı.", ""),

        ("4. Sayfa ve Ekran Planı", "B"),
        ("Ana Sayfa: Karşılama ve PIN/QR ile katılım alanı.\n"
         "Giriş Yap / Kayıt Ol: Kullanıcı giriş/kayıt ekranları.\n"
         "Dashboard: Sınav ve pano yönetim merkezi.\n"
         "Sınav Oluştur / Düzenle: Manuel veya toplu soru ekleme ekranı.\n"
         "Lobi Ekranı: Katılımcıların beklediği hazırlık odası (QR/PIN).\n"
         "Canlı Sınav Ekranı: Anlık soru ve cevap yarışma sayfası.\n"
         "Liderlik Tablosu & İstatistikler: Puan durumları ve detaylı analizler.\n"
         "İşbirliği Panosu (Board): Ortak içerik ve dosya ekleme duvarı.", ""),

        ("5. Menü Yapısı", "B"),
        ("Ziyaretçi: Ana Sayfa, Giriş Yap, Kayıt Ol.\n"
         "Üye/Öğretmen: Quizzes, Boards, İstatistikler, Profil, Çıkış Yap.", ""),

        ("6. Kullanıcı Senaryoları", "B"),
        ("Senaryo 1: Öğretmen giriş yapar, Excel ile quiz yükler, sınavı başlatır ve QR kodu gösterir.\n"
         "Senaryo 2: Öğrenci QR kodu okutur, lakabını girer, telefonundan soruları yanıtlar.\n"
         "Senaryo 3: Proje grubu panoya girer, katılımcıları görür, not ve dosya ekler.", ""),

        ("7. Veri Planı", "B"),
        ("Veritabanı Tabloları:\n"
         "- Users: id, name, email, password, role.\n"
         "- Quizzes: id, user_id, title, description, created_at.\n"
         "- Questions: id, quiz_id, text, options (JSON), correct_option, time_limit.\n"
         "- QuizResults: id, quiz_id, participant_name, score, stats.\n"
         "- Boards & BoardPosts: id, board_id, content, attachments (JSON).", ""),

        ("8. Formlar ve Giriş Alanları", "B"),
        ("Kayıt/Giriş Formları: Ad, E-posta, Şifre.\n"
         "Soru Ekleme Formu: Metin, Şıklar, Doğru Cevap, Süre.\n"
         "Toplu Yükleme: CSV/Excel dosya seçimi.\n"
         "Pano Post Formu: İçerik, Dosya ekleme.", ""),

        ("9. Taslak Ekran Çizimleri", "B"),
        ("Tüm ekranlar modern, kullanıcı dostu ve kurumsal bir görsel kimliğe uygun olarak tasarlanacaktır. (Ana sayfa, Dashboard, Lobi, Canlı Sınav ve Pano ekranları.)", ""),

        ("10. Kullanılacak Teknolojiler", "B"),
        ("Frontend: React.js, Vite, Tailwind CSS, Socket.IO-Client, Axios.\n"
         "Backend: Node.js, Express.js, Socket.IO, Multer, JWT, Bcrypt.\n"
         "Veritabanı: MySQL (mysql2 driver).", ""),

        ("11. Proje Klasör Yapısı", "B"),
        ("Proje Klasör Yapısı:\n"
         "vibe-learn-project/\n"
         "├── client/                  # Frontend Uygulaması\n"
         "│   ├── public/              # Statik Dosyalar\n"
         "│   ├── src/\n"
         "│   │   ├── components/      # Arayüz Bileşenleri\n"
         "│   │   ├── pages/           # Sayfalar\n"
         "│   │   ├── utils/           # API ve Socket Bağlantıları\n"
         "│   │   ├── App.jsx\n"
         "│   │   └── main.jsx\n"
         "│   ├── package.json\n"
         "│   └── tailwind.config.js\n"
         "└── server/                  # Backend Uygulaması\n"
         "    ├── config/              # Veritabanı Ayarları\n"
         "    ├── controllers/         # İş Mantığı Kontrolcüleri\n"
         "    ├── middlewares/         # Güvenlik ve Dosya Yükleme\n"
         "    ├── routes/              # API Uç Noktaları\n"
         "    ├── uploads/             # Medya Dosyaları\n"
         "    ├── server.js            # Sunucu Başlangıç Dosyası\n"
         "    └── package.json", ""),
    ]

    for title, style in content:
        if style == "B":
            pdf.ln(5)
            pdf.set_font("Arial", "B", 12)
            pdf.cell(0, 10, title, ln=True)
            pdf.set_font("Arial", "", 11)
        else:
            pdf.multi_cell(0, 7, title)
            pdf.ln(2)

    output_path = "Proje_On_Hazirlik_Dosyasi_Vibe_Learn.pdf"
    pdf.output(output_path)
    print(f"PDF başarıyla oluşturuldu: {output_path}")

if __name__ == "__main__":
    create_pdf()
