export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-lg text-gray-600 mb-8 border-b border-gray-200 pb-4">
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 border-l-4 border-blue-500 pl-4">1. Information We Collect</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="space-y-6">
              <div className="bg-white p-4 rounded border-l-4 border-green-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Information</h3>
                <p className="text-gray-700 leading-relaxed">
                  When you create an account, we collect your name, email address, and password. We also collect any additional information you provide when using our services.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Property Information</h3>
                <p className="text-gray-700 leading-relaxed">
                  We store information about your rental properties, including property details, tenant information, lease dates, and rent amounts.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded border-l-4 border-purple-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Financial Information</h3>
                <p className="text-gray-700 leading-relaxed">
                  We collect and store information about your rental income, expenses, and maintenance costs to help you manage your properties.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded border-l-4 border-orange-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Usage Information</h3>
                <p className="text-gray-700 leading-relaxed">
                  We collect information about how you use our service, including pages visited, features used, and time spent on the platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 border-l-4 border-blue-500 pl-4">2. How We Use Your Information</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-lg text-gray-700 mb-4">We use your information to:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Provide and maintain our property management services</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Process payments and manage your subscription</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Generate reports and analytics for your properties</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Send you important updates about your account</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Provide customer support and respond to your inquiries</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Improve our services and develop new features</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 border-l-4 border-blue-500 pl-4">3. Information Sharing</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-lg text-gray-700 mb-6">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Providers</h3>
                <p className="text-gray-700">We may share information with trusted third-party service providers who assist us in operating our platform (e.g., payment processors, email services)</p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Requirements</h3>
                <p className="text-gray-700">We may disclose information when required by law or to protect our rights and the rights of others</p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Transfers</h3>
                <p className="text-gray-700">In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 border-l-4 border-blue-500 pl-4">4. Data Security</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-lg text-gray-700 mb-6">
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Encryption of data in transit and at rest</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Regular security audits and updates</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Access controls and authentication</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Secure data centers and infrastructure</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 border-l-4 border-blue-500 pl-4">5. Data Retention</h2>
          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
            <p className="text-lg text-gray-700 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you with our services. We may retain certain information for longer periods to comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 border-l-4 border-blue-500 pl-4">6. Your Rights</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-lg text-gray-700 mb-6">You have the right to:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Access and update your personal information</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Delete your account and associated data</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Opt out of marketing communications</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Request a copy of your data</span>
                </div>
              </div>
            </div>
            <div className="mt-6 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <p className="text-gray-700">
                <strong>To exercise these rights:</strong> Please contact us using the information provided in the "Contact Us" section below.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 border-l-4 border-blue-500 pl-4">7. Cookies and Tracking</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-lg text-gray-700 mb-6">
              We use cookies and similar tracking technologies to enhance your experience on our platform. These technologies help us:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Remember your preferences and settings</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Analyze how you use our service</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Improve our platform's performance</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Provide personalized content</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-gray-700">
                <strong>Note:</strong> You can control cookie settings through your browser preferences, though this may affect some functionality of our service.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 border-l-4 border-blue-500 pl-4">8. Third-Party Services</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-lg text-gray-700 mb-6">
              Our service integrates with third-party services including:
            </p>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Stripe</h3>
                <p className="text-gray-700">For payment processing and subscription management</p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Supabase</h3>
                <p className="text-gray-700">For data storage and authentication</p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Vercel</h3>
                <p className="text-gray-700">For hosting and deployment</p>
              </div>
            </div>
            <div className="mt-6 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <p className="text-gray-700">
                <strong>Important:</strong> These services have their own privacy policies, and we encourage you to review them.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 border-l-4 border-blue-500 pl-4">9. Children's Privacy</h2>
          <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
            <p className="text-lg text-gray-700 leading-relaxed">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 border-l-4 border-blue-500 pl-4">10. Changes to This Policy</h2>
          <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
            <p className="text-lg text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 border-l-4 border-blue-500 pl-4">11. Contact Us</h2>
          <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
            <p className="text-lg text-gray-700 mb-6">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Email: </span>
                  <span className="text-blue-600 ml-2">support@landlordhubapp.com</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Subject Line: </span>
                  <span className="text-gray-700 ml-2">Privacy Policy Inquiry</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
