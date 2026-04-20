import json
import re
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.management.base import BaseCommand

from api.models import Product


COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "MarketaCourseProject/1.0 (local educational marketplace seeding)"


QUERY_OVERRIDES = {
    "iPhone 15 128GB": ["iPhone 15", "iPhone smartphone"],
    "Samsung Galaxy S24 256GB": ["Samsung Galaxy S24", "Samsung Galaxy smartphone"],
    "Xiaomi Redmi Note 13 Pro": ["Xiaomi Redmi Note smartphone", "Xiaomi smartphone"],
    "Google Pixel 8": ["Google Pixel 8", "Google Pixel smartphone"],
    "Honor 90 Lite": ["Honor smartphone", "Android smartphone"],
    "MacBook Air 13 M2": ["MacBook Air", "Apple MacBook laptop"],
    "Lenovo IdeaPad Slim 5": ["Lenovo IdeaPad laptop", "Lenovo laptop"],
    "ASUS VivoBook 15 OLED": ["ASUS VivoBook laptop", "ASUS laptop"],
    "HP Pavilion 14": ["HP Pavilion laptop", "HP laptop"],
    "Acer Nitro V 15": ["Acer Nitro laptop", "gaming laptop"],
    "Sony WH-1000XM5": ["Sony WH-1000XM5", "Sony headphones"],
    "Apple AirPods Pro 2": ["AirPods Pro", "wireless earbuds"],
    "JBL Flip 6": ["JBL Flip speaker", "portable bluetooth speaker"],
    "Marshall Major IV": ["Marshall headphones", "headphones"],
    "HyperX SoloCast": ["USB microphone", "microphone"],
    "PlayStation 5 Slim": ["PlayStation 5 console", "PlayStation 5"],
    "Xbox Series S 512GB": ["Xbox Series S", "Xbox console"],
    "Logitech G Pro X Superlight": ["Logitech gaming mouse", "gaming mouse"],
    "Razer BlackWidow V4": ["Razer keyboard", "gaming keyboard"],
    "Samsung Odyssey G5 27": ["gaming monitor", "computer monitor"],
    "Anker PowerCore 20000": ["power bank", "portable battery charger"],
    "UGREEN USB-C Hub 7-in-1": ["USB-C hub", "USB hub"],
    "Baseus GaN Charger 65W": ["USB-C charger", "battery charger"],
    "Logitech MX Master 3S": ["Logitech MX Master", "computer mouse"],
    "Samsung T7 Shield 1TB": ["portable SSD", "external SSD"],
}


CATEGORY_FALLBACKS = {
    "Smartphones": ["smartphone", "mobile phone"],
    "Laptops": ["laptop computer", "notebook computer"],
    "Audio": ["headphones", "audio speaker"],
    "Gaming": ["video game console", "gaming computer accessories"],
    "Accessories": ["computer accessories", "USB charger"],
}


class Command(BaseCommand):
    help = "Replace generated seed images with real open-license images from Wikimedia Commons."

    def add_arguments(self, parser):
        parser.add_argument(
            "--sleep",
            type=float,
            default=0.25,
            help="Delay between requests to avoid hammering Wikimedia Commons.",
        )

    def handle(self, *args, **options):
        products = Product.objects.filter(is_deleted=False, image__startswith="products/seed/").select_related(
            "category", "owner"
        )
        output_dir = Path(settings.MEDIA_ROOT) / "products" / "real"
        output_dir.mkdir(parents=True, exist_ok=True)

        updated = 0
        failed = []
        cache = {}

        for product in products:
            queries = self.get_queries(product)
            saved = False

            for query in queries:
                if query not in cache:
                    cache[query] = self.find_image(query)
                    time.sleep(options["sleep"])

                image_info = cache[query]
                if not image_info:
                    continue

                file_name = self.file_name(product, image_info["url"])
                file_path = output_dir / file_name

                try:
                    if not file_path.exists():
                        self.download(image_info["url"], file_path)
                        time.sleep(options["sleep"])
                except (HTTPError, URLError, TimeoutError, OSError) as error:
                    self.stdout.write(self.style.WARNING(f"Download skipped for {product.name}: {error}"))
                    continue

                product.image = f"products/real/{file_name}"
                product.save(update_fields=["image"])
                updated += 1
                saved = True

                self.stdout.write(f"{product.owner.username}: {product.name} -> real image saved")
                break

            if not saved:
                failed.append(product.name)
                self.stdout.write(self.style.WARNING(f"No image found for {product.owner.username}: {product.name}"))
                continue

        self.stdout.write(self.style.SUCCESS(f"Real image update complete: {updated} products updated."))
        if failed:
            self.stdout.write(self.style.WARNING(f"Failed: {', '.join(sorted(set(failed)))}"))

    def get_queries(self, product):
        queries = QUERY_OVERRIDES.get(product.name, [product.name])
        return queries + CATEGORY_FALLBACKS.get(product.category.name, [])

    def find_image(self, query):
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrnamespace": 6,
            "gsrlimit": 8,
            "gsrsearch": f"filetype:bitmap {query}",
            "prop": "imageinfo",
            "iiprop": "url|mime",
            "iiurlwidth": 1200,
        }
        url = f"{COMMONS_API_URL}?{urlencode(params)}"
        data = self.fetch_json(url)
        pages = data.get("query", {}).get("pages", {})

        for page in pages.values():
            title = page.get("title", "")
            image_infos = page.get("imageinfo") or []
            if not image_infos:
                continue

            image_info = image_infos[0]
            mime = image_info.get("mime", "")
            image_url = image_info.get("thumburl") or image_info.get("url")

            if mime not in {"image/jpeg", "image/png", "image/webp"}:
                continue
            if not image_url:
                continue
            if self.is_bad_title(title):
                continue

            return {"title": title, "url": image_url, "mime": mime}

        return None

    def fetch_json(self, url):
        request = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(request, timeout=25) as response:
            return json.loads(response.read().decode("utf-8"))

    def download(self, url, file_path):
        request = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(request, timeout=35) as response:
            file_path.write_bytes(response.read())

    def file_name(self, product, url):
        suffix = Path(url.split("?")[0]).suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
            suffix = ".jpg"

        return f"{self.slugify(product.owner.username)}-{self.slugify(product.name)}{suffix}"

    def slugify(self, value):
        value = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower())
        return value.strip("-")

    def is_bad_title(self, title):
        lowered = title.lower()
        bad_words = ("logo", "icon", "svg", "diagram", "map", "qr", "screenshot")
        return any(word in lowered for word in bad_words)
