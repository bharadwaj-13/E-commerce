import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Home() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const response = await api.get("/customers/me");
        setCustomer(response.data);
      } catch (error) {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [navigate]);

  if (loading) {
    return <p className="loading">Loading your profile...</p>;
  }

  if (!customer) {
    return null;
  }

  return (
    <>
      <Navbar />

      <main className="home-page">
        <section className="profile-card">
          <p className="eyebrow">ACCOUNT</p>
          <h1>Welcome, {customer.fullName}!</h1>
          <p>You are logged in to ShopKart.</p>

          <div className="profile-details">
            <p>
              <strong>Email:</strong> {customer.email}
            </p>
            <p>
              <strong>Phone:</strong> {customer.phone}
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

export default Home;