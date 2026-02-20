import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | EventTara",
  description:
    "Learn how EventTara collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Privacy Policy
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
            EventTara (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a
            Philippine outdoor adventure event booking platform for hiking,
            mountain biking, road biking, running, and trail running. This
            Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our website and services.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            2. Information We Collect
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
            We may collect the following types of information:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>
              <strong>Account information:</strong> When you sign up or log in
              using Facebook or other providers, we receive your name, email
              address, and profile photo.
            </li>
            <li>
              <strong>Profile data:</strong> Information you provide to
              complete your profile, such as your username and contact details.
            </li>
            <li>
              <strong>Booking and event activity:</strong> Records of events
              you book, attend, or organize, including check-in data.
            </li>
            <li>
              <strong>Badge awards:</strong> Badges earned through event
              participation and achievements.
            </li>
            <li>
              <strong>Device and usage data:</strong> Browser type, IP
              address, and pages visited, collected automatically through
              standard web server logs.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>
              <strong>Account creation and authentication:</strong> To create
              and manage your account, including login via Facebook OAuth.
            </li>
            <li>
              <strong>Event booking and management:</strong> To process your
              event registrations and provide booking confirmations.
            </li>
            <li>
              <strong>Communication:</strong> To send transactional emails
              such as booking confirmations, event updates, and badge award
              notifications.
            </li>
            <li>
              <strong>Badge system:</strong> To track and award badges based
              on your event participation.
            </li>
            <li>
              <strong>Service improvement:</strong> To understand how our
              platform is used and improve the user experience.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            4. Third-Party Services
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
            We use the following third-party services to operate our platform:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>
              <strong>Supabase:</strong> For authentication, database storage,
              and file storage. Your account data and event information are
              stored securely on Supabase infrastructure.
            </li>
            <li>
              <strong>Resend:</strong> For sending transactional emails such
              as booking confirmations and badge award notifications.
            </li>
            <li>
              <strong>Facebook Login:</strong> If you choose to log in with
              Facebook, we receive the profile information you authorize. We
              do not post to your Facebook account or access your friends
              list.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            5. Data Sharing
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            We do not sell, rent, or trade your personal information. Your
            information may be shared only in the following circumstances:
          </p>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mt-3">
            <li>
              <strong>Event organizers:</strong> When you book an event, the
              organizer receives your name and contact information necessary
              to manage the event.
            </li>
            <li>
              <strong>Legal requirements:</strong> We may disclose information
              if required by law or in response to valid legal process.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            6. Cookies and Session Data
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            We use authentication session cookies managed by Supabase to keep
            you logged in securely. These cookies are essential for the
            functioning of the service and are not used for advertising or
            tracking purposes.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            7. Data Retention and Deletion
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            We retain your personal information for as long as your account is
            active or as needed to provide our services. If you wish to
            request deletion of your account and associated data, please
            contact us at{" "}
            <a
              href="mailto:privacy@eventtara.com"
              className="text-teal-600 dark:text-teal-400 underline hover:text-teal-700 dark:hover:text-teal-300"
            >
              privacy@eventtara.com
            </a>
            . We will process your request within 30 days.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            8. Children&apos;s Privacy
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Our service is not directed at individuals under the age of 13. We
            do not knowingly collect personal information from children under
            13. If we become aware that we have collected data from a child
            under 13, we will take steps to delete that information promptly.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            9. Changes to This Policy
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            We may update this Privacy Policy from time to time. When we do,
            we will revise the &quot;Last updated&quot; date at the top of
            this page. We encourage you to review this policy periodically to
            stay informed about how we protect your information.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
            10. Contact Us
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            If you have any questions or concerns about this Privacy Policy or
            our data practices, please contact us at{" "}
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
