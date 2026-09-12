import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthCard } from "../components/auth/AuthCard";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

export function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signUp(fullName, email, password);
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as Record<string, unknown>;
        const firstError =
          data.error ??
          Object.values(data).flat().find(Boolean) ??
          "Something went wrong. Please try again.";
        setError(String(firstError));
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Sign up to start ordering custom 3D printed products."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/signin"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Full name"
          type="text"
          name="full_name"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="font-body text-sm text-accent-warm">{error}</p>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? "Creating account..." : "Sign Up"}
        </Button>
      </form>
    </AuthCard>
  );
}
