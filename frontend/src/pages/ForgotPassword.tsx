import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthCard } from "../components/auth/AuthCard";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { forgotPassword, resetPassword } from "../lib/auth";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await forgotPassword(email);
      setMessage(data.message);
      setStep("reset");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword({ email, otp, new_password: newPassword });
      navigate("/signin");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "request") {
    return (
      <AuthCard
        title="Forgot password"
        subtitle="Enter your email and we'll send you a reset code."
        footerText="Remembered your password?"
        footerLinkText="Sign in"
        footerLinkTo="/signin"
      >
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="font-body text-sm text-accent-warm">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? "Sending..." : "Send Reset Code"}
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle={message ?? "Enter the code we sent you and your new password."}
      footerText="Remembered your password?"
      footerLinkText="Sign in"
      footerLinkTo="/signin"
    >
      <form onSubmit={handleReset} className="flex flex-col gap-5">
        <Input
          label="Reset code"
          type="text"
          name="otp"
          inputMode="numeric"
          maxLength={6}
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <Input
          label="New password"
          type="password"
          name="new_password"
          autoComplete="new-password"
          minLength={8}
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        {error && <p className="font-body text-sm text-accent-warm">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
    </AuthCard>
  );
}
