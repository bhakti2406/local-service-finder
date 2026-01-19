import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Login.css";

const API_URL = import.meta.env.VITE_API_URL + "/auth/login";

function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        setLoading(false);
        return;
      }

      const userData = {
        _id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        location: data.user.location,
        token: data.token,
      };

      login(userData);
      navigate(userData.role === "admin" ? "/admin" : "/receiver");
    } catch (err) {
      alert("Backend error. Is server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <h1>Local Service Finder</h1>
        <p>
          Discover trusted professionals for home, education and personal
          services near you.
        </p>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h2>Login</h2>

          <form onSubmit={handleSubmit}>
            <input name="email" type="email" placeholder="Email" required />
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <Link to="/register">New user? Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;

