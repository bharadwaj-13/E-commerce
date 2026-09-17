import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import api from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/products", {
          params: {
            search: search || undefined,
            category: category || undefined,
          },
        });

        setProducts(response.data.products);
      } catch (error) {
        setError("Something went wrong while loading products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, category]);

  return (
    <>
      <Navbar />

      <main className="products-page">
        <header className="products-header">
          <div>
            <p className="eyebrow">SHOPKART CATALOG</p>
            <h1>Discover Products</h1>
          </div>

          <div className="filters">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Books">Books</option>
              <option value="Home">Home</option>
            </select>
          </div>
        </header>

        {loading && <p className="state-message">Loading products...</p>}

        {error && <p className="error-message">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p className="state-message">No products found.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <section className="products-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </section>
        )}
      </main>
    </>
  );
}

export default Products;