import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion | EventTara",
  description:
    "Learn how to request deletion of your personal data from EventTara.",
};

export default function DataDeletionPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Data Deletion Instructions
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Last updated: February 20, 2026
      </p>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            1. Introduction
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            At EventTara, we respect your right to control your personal data.
            You can request deletion of your data at any time by following the
            instructions below.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            2. What Data We Store
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
            When you use EventTara, we may store the following data associated
            with your account:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>
              <strong>Account information:</strong> Your name, email address, and
              profile photo obtained through Facebook Login or other sign-in
              methods.
            </li>
            <li>
              <strong>Bookings:</strong> Records of events you have registered
              for or booked.
            </li>
            <li>
              <strong>Badges:</strong> Badges earned through event participation
              and achievements.
            </li>
            <li>
              <strong>Check-ins:</strong> Records of event check-ins confirming
              your attendance.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            3. How to Request Data Deletion
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
            To request deletion of your data, send an email to{" "}
            <a
              href="mailto:privacy@eventtara.com?subject=Data%20Deletion%20Request"
              className="text-teal-600 dark:text-teal-400 underline hover:text-teal-700 dark:hover:text-teal-300"
            >
              privacy@eventtara.com
            </a>{" "}
            with the following details:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>
              <strong>Subject line:</strong> &quot;Data Deletion Request&quot;
            </li>
            <li>
              <strong>Include:</strong> The email address associated with your
              EventTara account
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            4. What Happens Next
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Once we receive your request, we will verify your identity and
            process the deletion within 30 days. You will receive a confirmation
            email when the deletion is complete. Please note that once your data
            is deleted, this action cannot be undone and you will need to create
            a new account to use EventTara again.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            5. Removing Facebook Connection
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
            In addition to requesting data deletion from us, you can also revoke
            EventTara&apos;s access to your Facebook account:
          </p>
          <ol className="list-decimal pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>
              Go to your{" "}
              <a
                href="https://www.facebook.com/settings?tab=applications"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 dark:text-teal-400 underline hover:text-teal-700 dark:hover:text-teal-300"
              >
                Facebook Settings &gt; Apps and Websites
              </a>
            </li>
            <li>Find &quot;EventTara&quot; in the list of active apps</li>
            <li>
              Click &quot;Remove&quot; to revoke access and delete any
              information Facebook shared with us
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            6. Contact Us
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            If you have any questions about data deletion or our data practices,
            please contact us at{" "}
            <a
              href="mailto:privacy@eventtara.com"
              className="text-teal-600 dark:text-teal-400 underline hover:text-teal-700 dark:hover:text-teal-300"
            >
              privacy@eventtara.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
