import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import "../styles/Register.css";

const ADMIN_KEY = "ADMIN123";
const API_URL = import.meta.env.VITE_API_URL + "/auth/register";

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;

    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (role === "admin") {
      if (form.adminKey.value !== ADMIN_KEY) {
        alert("Invalid Admin Key");
        return;
      }
    }

    const user = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      password: password,
      role: role,
    };

    try {
      setLoading(true);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));

      alert("Account created successfully!");
      navigate("/");
    } catch (err) {
      alert("Backend error. Please check server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <h1>Join Local Service Finder</h1>
        <p>
          Discover trusted professionals for home, education and personal
          services near you.
        </p>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h2>Register</h2>

          <form onSubmit={handleSubmit}>
            <input name="name" placeholder="Full name" required />
            <input name="email" type="email" placeholder="Email" required />
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
            />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              required
            />

            <select required onChange={(e) => setRole(e.target.value)}>
              <option value="">Select role</option>
              <option value="receiver">Receiver</option>
              <option value="admin">Admin</option>
            </select>

            {role === "admin" && (
              <input
                name="adminKey"
                placeholder="Admin Key"
                required
              />
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <Link to="/">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;

