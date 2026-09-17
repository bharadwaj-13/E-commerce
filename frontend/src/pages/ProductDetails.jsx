import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data.product);
      } catch (error) {
        setError("Product could not be found.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return (
    <>
      <Navbar />

      <main className="details-page">
        {loading && <p className="state-message">Loading product...</p>}

        {error && <p className="error-message">{error}</p>}

        {!loading && product && (
          <section className="details-card">
            <img src={product.image} alt={product.name} />

            <div>
              <p className="category">{product.category}</p>
              <h1>{product.name}</h1>
              <p className="details-description">{product.description}</p>
              <p className="price">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
              <p>
                <strong>Stock:</strong> {product.stock} units available
              </p>

              <p>
                <Link to="/products">← Back to products</Link>
              </p>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

export default ProductDetails;
