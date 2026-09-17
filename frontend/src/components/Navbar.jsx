import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/customers/logout");
    } finally {
      navigate("/login");
    }
  };

  return (
    <nav className="navbar">
      <Link to="/products" className="brand">
        ShopKart
      </Link>

      <div className="nav-actions">
        <Link to="/home">Home</Link>
        <Link to="/products">Products</Link>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;