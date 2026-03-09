import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the EventTara team for questions, feedback, or support.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
