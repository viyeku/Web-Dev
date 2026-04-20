from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from PIL import Image, ImageDraw, ImageFont

from api.models import Category, Product, UserProfile


PRODUCTS_BY_CATEGORY = {
    "Smartphones": [
        {
            "name": "iPhone 15 128GB",
            "price": "389990",
            "quantity": 12,
            "description": "Смартфон с ярким OLED-дисплеем, быстрым процессором и камерой для детальных фото днем и вечером.",
        },
        {
            "name": "Samsung Galaxy S24 256GB",
            "price": "429990",
            "quantity": 9,
            "description": "Флагманский Android-смартфон с плавным экраном 120 Гц, отличной автономностью и защитой от влаги.",
        },
        {
            "name": "Xiaomi Redmi Note 13 Pro",
            "price": "149990",
            "quantity": 18,
            "description": "Практичный смартфон для учебы, работы и игр: большой экран, быстрая зарядка и хорошая основная камера.",
        },
        {
            "name": "Google Pixel 8",
            "price": "329990",
            "quantity": 7,
            "description": "Компактный смартфон с чистым Android, сильной обработкой фото и стабильной работой на каждый день.",
        },
        {
            "name": "Honor 90 Lite",
            "price": "119990",
            "quantity": 20,
            "description": "Легкий смартфон с большим объемом памяти, аккуратным дизайном и экраном для фильмов и соцсетей.",
        },
    ],
    "Laptops": [
        {
            "name": "MacBook Air 13 M2",
            "price": "549990",
            "quantity": 5,
            "description": "Тонкий ноутбук для учебы, работы с документами, браузером и легкой обработки фото без лишнего шума.",
        },
        {
            "name": "Lenovo IdeaPad Slim 5",
            "price": "319990",
            "quantity": 10,
            "description": "Универсальный ноутбук с быстрым SSD, удобной клавиатурой и хорошим запасом производительности.",
        },
        {
            "name": "ASUS VivoBook 15 OLED",
            "price": "359990",
            "quantity": 8,
            "description": "Ноутбук с насыщенным OLED-экраном для работы, фильмов, презентаций и повседневных задач.",
        },
        {
            "name": "HP Pavilion 14",
            "price": "289990",
            "quantity": 11,
            "description": "Компактный ноутбук для офиса и учебы с легким корпусом, веб-камерой и стабильной автономностью.",
        },
        {
            "name": "Acer Nitro V 15",
            "price": "479990",
            "quantity": 6,
            "description": "Игровой ноутбук начального уровня с дискретной графикой, экраном 144 Гц и эффективным охлаждением.",
        },
    ],
    "Audio": [
        {
            "name": "Sony WH-1000XM5",
            "price": "179990",
            "quantity": 14,
            "description": "Беспроводные наушники с активным шумоподавлением, мягкими амбушюрами и чистым звуком для поездок.",
        },
        {
            "name": "Apple AirPods Pro 2",
            "price": "129990",
            "quantity": 16,
            "description": "Компактные TWS-наушники с шумоподавлением, прозрачным режимом и удобной посадкой на каждый день.",
        },
        {
            "name": "JBL Flip 6",
            "price": "59990",
            "quantity": 21,
            "description": "Портативная колонка с влагозащитой, плотным басом и запасом громкости для дома и прогулок.",
        },
        {
            "name": "Marshall Major IV",
            "price": "69990",
            "quantity": 13,
            "description": "Накладные Bluetooth-наушники в классическом дизайне с долгой автономностью и насыщенным звучанием.",
        },
        {
            "name": "HyperX SoloCast",
            "price": "39990",
            "quantity": 15,
            "description": "USB-микрофон для звонков, стримов и записи голоса с простой настройкой и чистой передачей речи.",
        },
    ],
    "Gaming": [
        {
            "name": "PlayStation 5 Slim",
            "price": "359990",
            "quantity": 4,
            "description": "Игровая консоль нового поколения с быстрым SSD, поддержкой 4K и большим каталогом эксклюзивов.",
        },
        {
            "name": "Xbox Series S 512GB",
            "price": "189990",
            "quantity": 9,
            "description": "Компактная консоль для цифровых игр, Game Pass и комфортного гейминга в разрешении до 1440p.",
        },
        {
            "name": "Logitech G Pro X Superlight",
            "price": "74990",
            "quantity": 17,
            "description": "Очень легкая игровая мышь с точным сенсором, быстрым откликом и удобной формой для шутеров.",
        },
        {
            "name": "Razer BlackWidow V4",
            "price": "89990",
            "quantity": 8,
            "description": "Механическая клавиатура с яркой подсветкой, быстрыми переключателями и прочным корпусом.",
        },
        {
            "name": "Samsung Odyssey G5 27",
            "price": "149990",
            "quantity": 7,
            "description": "Игровой монитор 27 дюймов с высокой частотой обновления, изогнутой матрицей и четкой картинкой.",
        },
    ],
    "Accessories": [
        {
            "name": "Anker PowerCore 20000",
            "price": "29990",
            "quantity": 19,
            "description": "Емкий внешний аккумулятор для смартфона, наушников и других гаджетов в поездках и учебе.",
        },
        {
            "name": "UGREEN USB-C Hub 7-in-1",
            "price": "24990",
            "quantity": 22,
            "description": "Многофункциональный USB-C хаб с HDMI, USB-портами и кардридером для ноутбуков и планшетов.",
        },
        {
            "name": "Baseus GaN Charger 65W",
            "price": "19990",
            "quantity": 25,
            "description": "Компактное зарядное устройство на 65 Вт для ноутбука, смартфона и аксессуаров одновременно.",
        },
        {
            "name": "Logitech MX Master 3S",
            "price": "54990",
            "quantity": 12,
            "description": "Эргономичная беспроводная мышь для работы с тихими кнопками, точным колесом и несколькими профилями.",
        },
        {
            "name": "Samsung T7 Shield 1TB",
            "price": "64990",
            "quantity": 10,
            "description": "Портативный SSD на 1 ТБ с быстрым подключением, защитным корпусом и удобством для резервных копий.",
        },
    ],
}


CATEGORY_COLORS = {
    "Smartphones": ("#D9F0FF", "#2A6F97"),
    "Laptops": ("#FFF0C9", "#A65F00"),
    "Audio": ("#E8F7E8", "#2F7D46"),
    "Gaming": ("#F4E7FF", "#6A3FA0"),
    "Accessories": ("#FFE6D8", "#C75A2C"),
}


class Command(BaseCommand):
    help = "Seed every seller with five realistic products per category and generated images."

    def handle(self, *args, **options):
        sellers = User.objects.filter(profile__role=UserProfile.SELLER).order_by("id")
        categories = {category.name: category for category in Category.objects.all()}

        if not sellers:
            self.stdout.write(self.style.WARNING("No sellers found."))
            return

        missing_categories = sorted(set(PRODUCTS_BY_CATEGORY) - set(categories))
        if missing_categories:
            self.stdout.write(self.style.WARNING(f"Missing categories: {', '.join(missing_categories)}"))
            return

        image_dir = Path(settings.MEDIA_ROOT) / "products" / "seed"
        image_dir.mkdir(parents=True, exist_ok=True)

        created = 0
        updated = 0

        for seller_index, seller in enumerate(sellers, start=1):
            for category_name, products in PRODUCTS_BY_CATEGORY.items():
                category = categories[category_name]

                for product_index, product_data in enumerate(products, start=1):
                    seller_price_offset = Decimal("1.00") + Decimal(seller_index - 1) * Decimal("0.03")
                    price = (Decimal(product_data["price"]) * seller_price_offset).quantize(Decimal("1"))
                    quantity = product_data["quantity"] + seller_index + product_index
                    image_name = self.create_image(
                        image_dir=image_dir,
                        seller=seller.username,
                        category_name=category_name,
                        product_name=product_data["name"],
                    )

                    product, was_created = Product.objects.update_or_create(
                        owner=seller,
                        category=category,
                        name=product_data["name"],
                        defaults={
                            "description": product_data["description"],
                            "price": price,
                            "quantity": quantity,
                            "is_active": True,
                            "is_deleted": False,
                            "image": f"products/seed/{image_name}",
                        },
                    )

                    created += int(was_created)
                    updated += int(not was_created)

        self.stdout.write(self.style.SUCCESS(f"Seed complete: {created} created, {updated} updated."))

    def create_image(self, image_dir, seller, category_name, product_name):
        safe_name = self.slugify(f"{seller}-{category_name}-{product_name}") + ".jpg"
        image_path = image_dir / safe_name

        bg_color, accent_color = CATEGORY_COLORS.get(category_name, ("#F4F1E8", "#10212B"))
        image = Image.new("RGB", (1200, 900), bg_color)
        draw = ImageDraw.Draw(image)
        title_font = self.get_font(74)
        subtitle_font = self.get_font(34)
        small_font = self.get_font(26)

        draw.rounded_rectangle((70, 70, 1130, 830), radius=70, fill="#FFFAF1", outline=accent_color, width=6)
        draw.rounded_rectangle((120, 130, 1080, 500), radius=54, fill=accent_color)
        draw.ellipse((830, 180, 1010, 360), fill=bg_color)
        draw.rectangle((170, 390, 720, 430), fill=bg_color)

        initials = "".join(part[0] for part in product_name.split()[:2]).upper()
        draw.text((600, 315), initials[:3], fill="#FFFAF1", font=title_font, anchor="mm")
        draw.text((150, 565), category_name.upper(), fill=accent_color, font=small_font)
        draw.text((150, 635), product_name, fill="#10212B", font=title_font)
        draw.text((150, 745), f"seller: {seller}", fill="#385163", font=subtitle_font)

        image.save(image_path, format="JPEG", quality=88)
        return safe_name

    def get_font(self, size):
        for font_name in ("arial.ttf", "DejaVuSans.ttf"):
            try:
                return ImageFont.truetype(font_name, size)
            except OSError:
                continue

        return ImageFont.load_default()

    def slugify(self, value):
        allowed = []
        for char in value.lower():
            if char.isalnum():
                allowed.append(char)
            elif char in (" ", "-", "_"):
                allowed.append("-")

        slug = "".join(allowed)
        while "--" in slug:
            slug = slug.replace("--", "-")
        return slug.strip("-")
