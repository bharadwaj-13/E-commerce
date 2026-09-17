import { Link } from "react-router-dom";

function ProductCard({ product }) {
  return (
    <article className="product-card">
      <img src={product.image} alt={product.name} />

      <div className="product-card-content">
        <p className="category">{product.category}</p>
        <h3>{product.name}</h3>
        <p className="price">
          ₹{product.price.toLocaleString("en-IN")}
        </p>
        <p className={product.stock > 0 ? "in-stock" : "out-of-stock"}>
          {product.stock > 0
            ? `${product.stock} units left`
            : "Out of stock"}
        </p>

        <Link to={`/products/${product._id}`} className="details-link">
          View Details
        </Link>
      </div>
    </article>
  );
}

export default ProductCard;