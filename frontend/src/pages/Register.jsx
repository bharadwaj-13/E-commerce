import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.fullName || !form.email || !form.password || !form.phone) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      await api.post("/customers/register", form);
      navigate("/login");
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create ShopKart Account</h1>
        <p>Register to start shopping.</p>

        {error && <p className="error-message">{error}</p>}

        <label>
          Full Name
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Your full name"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
          />
        </label>

        <label>
          Phone Number
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="9876543210"
          />
        </label>

        <button disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}

export default Register;