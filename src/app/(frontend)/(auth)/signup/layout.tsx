import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your EventTara account and start booking outdoor adventure events.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
