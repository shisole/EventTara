import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your EventTara password.",
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
