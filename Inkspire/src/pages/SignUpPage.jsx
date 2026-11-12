import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";

function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiRequest("/users/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });
      navigate("/signin", { state: { message: "Account created. Please sign in." } });
    } catch (error) {
      console.error("Error creating account:", error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-shell py-16">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-coral">
            Join the circle
          </p>
          <h1 className="mt-3 font-display text-5xl sm:text-6xl">
            Make room for your ideas.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-ink/55">
            Create your writer profile. Share your thoughts, and connect with other writers in the community.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="card mt-10 space-y-5 p-6 sm:p-9"
        >
          {error && (
            <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="firstName">
                First name
              </label>
              <input
                className="field"
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                required
                placeholder="Amara"
                value={form.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label" htmlFor="lastName">
                Last name
              </label>
              <input
                className="field"
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                required
                placeholder="Okafor"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="signup-email">
              Email address
            </label>
            <input
              className="field"
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label" htmlFor="signup-password">
              Password
            </label>
            <input
              className="field"
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength="6"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
            />
          </div>
          <label className="flex items-start gap-3 text-sm leading-6 text-ink/65">
            <input type="checkbox" required className="mt-1 accent-ink" /> I
            agree to keep the conversation thoughtful and kind.
          </label>
          <button className="btn-primary w-full" type="submit" disabled={saving}>
            {saving ? "Creating account..." : "Create my account"} <ArrowRight size={17} />
          </button>
        </form>
        <p className="mt-7 text-center text-sm text-ink/55">
          Already have an account?{" "}
          <Link
            className="font-semibold text-ink underline underline-offset-4"
            to="/signin"
          >
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}

export default SignUpPage;
