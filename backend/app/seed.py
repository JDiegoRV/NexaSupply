"""
Seed de datos para NexaSupply Demo.

Ejecutar: python -m app.seed
"""
import os
import uuid
from datetime import datetime, timezone
from app.core.database import SessionLocal, engine, Base
from app.models import *  # noqa
from app.core.security import hash_password
from app.models.product_image import ProductImage
from app.models.product_variant import ProductVariant

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "products")
os.makedirs(UPLOAD_DIR, exist_ok=True)

CATEGORY_COLORS = {
    "Bebidas": "#1E88E5",
    "Snacks": "#FB8C00",
    "Lácteos": "#43A047",
    "Abarrotes": "#6D4C41",
    "Limpieza": "#00ACC1",
    "Estacional": "#E53935",
}

SHOT_TYPES = [
    ("fondo-blanco", "Producto sobre fondo blanco"),
    ("contexto-bodega", "Producto en contexto de bodega"),
    ("detalle-etiqueta", "Detalle de etiqueta y marca"),
    ("escala", "Producto en escala con envase"),
    ("variante", "Variante adicional del producto"),
]


def _generate_svg_placeholder(product_name: str, category: str, shot_label: str, index: int) -> str:
    color = CATEGORY_COLORS.get(category, "#757575")
    emoji_map = {
        "Bebidas": "🥤", "Snacks": "🍪", "Lácteos": "🥛",
        "Abarrotes": "📦", "Limpieza": "🧹", "Estacional": "🎄",
    }
    emoji = emoji_map.get(category, "📦")
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="{color}" opacity="0.08"/>
  <rect x="100" y="100" width="600" height="400" rx="20" fill="{color}" opacity="0.15"/>
  <text x="400" y="220" text-anchor="middle" font-size="80">{emoji}</text>
  <text x="400" y="320" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="#333">{product_name}</text>
  <text x="400" y="370" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">{shot_label}</text>
  <text x="400" y="420" text-anchor="middle" font-family="Arial" font-size="14" fill="#999">NexaSupply · Placeholder {index + 1}/5</text>
</svg>"""


def _create_placeholder_images(db, product_id: uuid.UUID, product_name: str, category: str):
    images = []
    for i, (shot_key, shot_label) in enumerate(SHOT_TYPES):
        filename = f"{product_id.hex}_{shot_key}.svg"
        filepath = os.path.join(UPLOAD_DIR, filename)
        svg_content = _generate_svg_placeholder(product_name, category, shot_label, i)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(svg_content)

        img = ProductImage(
            product_id=product_id,
            url=f"uploads/products/{filename}",
            alt_text=f"{product_name} — {shot_label}",
            sort_order=i + 1,
        )
        db.add(img)
        images.append(img)
    return images


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clean all tables
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
        print("Cleaned tables.")

        # ── Stores ──
        store1_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
        store2_id = uuid.UUID("22222222-2222-2222-2222-222222222222")

        stores = [
            Store(
                id=store1_id,
                name="Bodega Don Roberto",
                ruc="10456789012",
                address="Av. España 123, Trujillo",
                phone="987654321",
                owner_name="Roberto Sánchez",
                email="roberto@bodega.com",
                password_hash=hash_password("demo123"),
                plan="premium",
                subscription_status="active",
            ),
            Store(
                id=store2_id,
                name="Minimarket La Esquina",
                ruc="10789012345",
                address="Jr. Pizarro 456, Trujillo",
                phone="987123456",
                owner_name="María López",
                email="maria@minimarket.com",
                password_hash=hash_password("demo123"),
                plan="basic",
                subscription_status="active",
            ),
        ]
        db.add_all(stores)
        db.flush()

        # ── Products ──
        products_data = [
            {"id": "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "name": "Cerveza Cristal 355ml x 6", "desc": "Pack de 6 unidades. La cerveza más tradicional del Perú.", "price": 18.50, "cat": "Bebidas", "stock": 50},
            {"id": "b2c3d4e5-f6a7-b8c9-d0e1-f2a3b4c5d6e7", "name": "Galletas Oreo 12 unidades", "desc": "Pack clásico de galletas Oreo con crema sabor vainilla.", "price": 5.90, "cat": "Snacks", "stock": 30},
            {"id": "c3d4e5f6-a7b8-c9d0-e1f2-a3b4c5d6e7f8", "name": "Leche Ideal 400g", "desc": "Leche evaporada Ideal, ideal para cocinar y endulzar.", "price": 4.20, "cat": "Lácteos", "stock": 20},
            {"id": "d4e5f6a7-b8c9-d0e1-f2a3-b4c5d6e7f8a9", "name": "Arroz Costeño 1kg", "desc": "Arroz extra premium, el favorito de las familias peruanas.", "price": 3.80, "cat": "Abarrotes", "stock": 100},
            {"id": "e5f6a7b8-c9d0-e1f2-a3b4-c5d6e7f8a9b0", "name": "Aceite Primor 1L", "desc": "Aceite vegetal Primor, ideal para freír y cocinar.", "price": 8.90, "cat": "Abarrotes", "stock": 45},
            {"id": "f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0c1", "name": "Inca Kola 500ml", "desc": "La gaseosa peruana más emblemática, sabor inconfundible.", "price": 2.50, "cat": "Bebidas", "stock": 80},
            {"id": "a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1d2", "name": "Detergente Sapolio 500g", "desc": "Detergente en polvo con poder de limpieza profunda.", "price": 4.50, "cat": "Limpieza", "stock": 60},
            {"id": "b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2e3", "name": "Panetón D'Onofrio 900g", "desc": "Panetón clásico con frutas confitadas, tradición navideña.", "price": 25.00, "cat": "Estacional", "stock": 15},
            {"id": "c9d0e1f2-a3b4-c5d6-e7f8-a9b0c1d2e3f4", "name": "Chocolate Sublime 30g", "desc": "Chocolate con leche Sublime, el clásico peruano.", "price": 1.50, "cat": "Snacks", "stock": 200},
            {"id": "d0e1f2a3-b4c5-d6e7-f8a9-b0c1d2e3f4a5", "name": "Aceitunas Don Lucho 250g", "desc": "Aceitunas verdes enteras, perfectas para pizzas y ensaladas.", "price": 6.50, "cat": "Abarrotes", "stock": 40},
            {"id": "e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6", "name": "Fideos Don Vittorio 1kg", "desc": "Fideos spaghetti, ideal para toda la familia.", "price": 3.20, "cat": "Abarrotes", "stock": 70},
            {"id": "f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7", "name": "Yogurt Gloria 1L", "desc": "Yogurt bebible sabor fresa, cremoso y delicioso.", "price": 7.50, "cat": "Lácteos", "stock": 35},
        ]

        for p in products_data:
            pid = uuid.UUID(p["id"])
            prod = Product(
                id=pid,
                name=p["name"],
                description=p["desc"],
                price=p["price"],
                category=p["cat"],
                stock=p["stock"],
                is_active=True,
            )
            db.add(prod)
            db.flush()

            # Create 5 placeholder images per product
            images = _create_placeholder_images(db, pid, p["name"], p["cat"])
            # Set first image as thumbnail
            prod.image_url = images[0].url

            # Create variants for applicable products
            if p["name"] == "Cerveza Cristal 355ml x 6":
                db.add(ProductVariant(product_id=pid, name="Botella 355ml", price_modifier=0, stock=50))
                db.add(ProductVariant(product_id=pid, name="Lata 355ml", price_modifier=-2.00, stock=80))
                db.add(ProductVariant(product_id=pid, name="Retornable 620ml", price_modifier=3.50, stock=25))
            elif p["name"] == "Inca Kola 500ml":
                db.add(ProductVariant(product_id=pid, name="Botella 500ml", price_modifier=0, stock=80))
                db.add(ProductVariant(product_id=pid, name="Botella 1.5L", price_modifier=3.50, stock=40))
                db.add(ProductVariant(product_id=pid, name="Lata 355ml", price_modifier=-0.50, stock=60))
            elif p["name"] == "Detergente Sapolio 500g":
                db.add(ProductVariant(product_id=pid, name="Lavanda 500g", price_modifier=0, stock=60))
                db.add(ProductVariant(product_id=pid, name="Limón 500g", price_modifier=0, stock=45))
                db.add(ProductVariant(product_id=pid, name="Original 500g", price_modifier=0, stock=55))
            elif p["name"] == "Galletas Oreo 12 unidades":
                db.add(ProductVariant(product_id=pid, name="Clásico 12und", price_modifier=0, stock=30))
                db.add(ProductVariant(product_id=pid, name="Doble Crema 12und", price_modifier=1.50, stock=25))
                db.add(ProductVariant(product_id=pid, name="Mini 24und", price_modifier=4.00, stock=20))

        db.commit()
        print(f"Seed completado: {len(stores)} bodegas, {len(products_data)} productos")
        print(f"   Store 1: roberto@bodega.com / demo123 (Premium)")
        print(f"   Store 2: maria@minimarket.com / demo123 (Basic)")
        print(f"   Admin:   admin@nexasupply.store / admin123")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
