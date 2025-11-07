export const metadata = {
  title: 'LandlordHub | Data Deletion Instructions',
  description:
    'Learn how to request deletion of your LandlordHub account and data in compliance with Facebook Login requirements.',
}

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-[#E7F2EF] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8 sm:p-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0A2540] mb-6">
          LandlordHub Data Deletion Instructions
        </h1>
        <p className="text-base sm:text-lg text-[#3d5a68] leading-relaxed mb-4">
          If you signed in to LandlordHub using Facebook Login and would like to request
          deletion of your account and associated data, please follow the steps below.
        </p>

        <ol className="list-decimal list-inside space-y-4 text-[#3d5a68] text-base sm:text-lg leading-relaxed">
          <li>
            Send an email to <strong>support@landlordhub.com</strong> from the email address linked to your
            LandlordHub account. Include the subject line <em>“Data Deletion Request”</em>.
          </li>
          <li>
            In the body of the email, provide the name associated with your account and, if you used Facebook
            Login, your Facebook profile URL or the email tied to your Facebook account.
          </li>
          <li>
            Our support team will acknowledge your request within 48 hours and complete the deletion process within
            7 business days. Once completed, we will send a confirmation email.
          </li>
        </ol>

        <p className="text-base sm:text-lg text-[#3d5a68] leading-relaxed mt-6">
          If you have any additional questions, please contact us at{' '}
          <a href="mailto:support@landlordhub.com" className="text-[#1C7C63] font-semibold underline">
            support@landlordhub.com
          </a>
          .
        </p>
      </div>
    </main>
  )
}
