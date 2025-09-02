"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../../styles/Signup.css";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ✅ Client-side checks
    if (name.trim().length < 2) {
      alert("Name must be at least 2 characters");
      setLoading(false);
      return;
    }
    if (username.trim().length < 3) {
      alert("Username must be at least 3 characters");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      await axios.post("http://127.0.0.1:4000/signup", {
        name,
        email,
        username,
        password,
      });

      alert("Signup successful! Please login.");
      router.push("/login");
    } catch (err) {
      alert(err.response?.data?.detail || "Signup failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSignup}>
        <h2 className="title">Create Account</h2>

        {/* Full Name */}
        <label>Full Name</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Email */}
        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Username */}
        <label>Username</label>
        <input
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {/* Password */}
        <label>Password</label>
        <input
          type="password"
          placeholder="Password (min 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Confirm Password */}
        <label>Re-enter Password</label>
        <input
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {/* Submit Button */}
        <button type="submit" disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        {/* Already have account */}
        <p className="switch-link">
          Already have an account?{" "}
          <Link href="/login" style={{ fontWeight: "bold", color: "#0070f3" }}>
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
