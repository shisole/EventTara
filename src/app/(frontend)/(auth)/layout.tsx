import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in or create an account on EventTara to book outdoor adventure events.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-cursive font-bold text-lime-600 dark:text-lime-400"
            style={{ WebkitTextStroke: "0.5px currentColor" }}
          >
            EventTara
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tara na! — Book Your Next Adventure
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
