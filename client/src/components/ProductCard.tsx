import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { categoryName } from '../lib/categories';
import { formatPrice } from '../lib/format';
import type { Product } from '../lib/types';
import { ProductImage } from './ProductImage';

export function ProductCard({ product }: { product: Product }) {
  const { add, items } = useCart();
  const inCart = items.find((i) => i.product_id === product.id)?.quantity ?? 0;
  const soldOut = product.quantity <= 0;
  const maxed = inCart >= product.quantity;

  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-card-img">
        <ProductImage src={product.image_url} alt={product.name} />
        {soldOut && <span className="tag tag-out">Sold out</span>}
        {!soldOut && product.quantity <= 5 && <span className="tag tag-low">Only {product.quantity} left</span>}
      </Link>
      <div className="product-card-body">
        <span className="eyebrow">{categoryName(product.category)}</span>
        <Link to={`/product/${product.id}`} className="product-card-title">
          {product.name}
        </Link>
        <div className="product-card-foot">
          <span className="price">{formatPrice(product.price)}</span>
          <button className="btn btn-sm" disabled={soldOut || maxed} onClick={() => add(product)}>
            {soldOut ? 'Sold out' : inCart ? `In cart · ${inCart}` : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
