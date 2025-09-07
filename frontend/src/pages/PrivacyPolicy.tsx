import React from 'react';
import { Link } from 'react-router-dom';
import { Radar, ArrowLeft, Shield, Eye, Lock, Database, Globe, UserCheck, AlertCircle, Cookie } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">Back to Home</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            <div className="relative">
              <Radar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div className="absolute inset-0 bg-blue-100 rounded-full -z-10"></div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4 sm:py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
          <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
            
            {/* Introduction */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Your Privacy Matters</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                At Bizradar, we are committed to protecting your privacy and ensuring the security of your 
                personal information. This Privacy Policy explains how we collect, use, disclose, and 
                safeguard your information when you use our platform and services.
              </p>
            </div>

            {/* Quick Summary */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3">Privacy at a Glance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-800">We collect only necessary data to provide our services</span>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-800">Your data is encrypted and securely stored</span>
                </div>
                <div className="flex items-start gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-800">You control your data and can request deletion</span>
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-800">We comply with GDPR, CCPA, and other privacy laws</span>
                </div>
              </div>
            </div>

            {/* Table of Contents */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Table of Contents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm">
                <a href="#information-collect" className="text-blue-600 hover:text-blue-700">1. Information We Collect</a>
                <a href="#how-we-use" className="text-blue-600 hover:text-blue-700">2. How We Use Your Information</a>
                <a href="#information-sharing" className="text-blue-600 hover:text-blue-700">3. Information Sharing</a>
                <a href="#data-security" className="text-blue-600 hover:text-blue-700">4. Data Security</a>
                <a href="#data-retention" className="text-blue-600 hover:text-blue-700">5. Data Retention</a>
                <a href="#your-rights" className="text-blue-600 hover:text-blue-700">6. Your Privacy Rights</a>
                <a href="#cookies" className="text-blue-600 hover:text-blue-700">7. Cookies & Tracking</a>
                <a href="#third-party" className="text-blue-600 hover:text-blue-700">8. Third-Party Services</a>
                <a href="#international" className="text-blue-600 hover:text-blue-700">9. International Transfers</a>
                <a href="#children" className="text-blue-600 hover:text-blue-700">10. Children's Privacy</a>
                <a href="#changes" className="text-blue-600 hover:text-blue-700">11. Policy Changes</a>
                <a href="#contact" className="text-blue-600 hover:text-blue-700">12. Contact Us</a>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-6 sm:space-y-8">
              
              {/* Section 1 */}
              <section id="information-collect">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span>1. Information We Collect</span>
                </h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Personal Information You Provide:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li><strong>Account Information:</strong> Name, email address, phone number, company details</li>
                      <li><strong>Profile Data:</strong> Company description, website URL, business capabilities</li>
                      <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely by Stripe)</li>
                      <li><strong>Communications:</strong> Messages, support requests, feedback you send to us</li>
                      <li><strong>Documents:</strong> RFP documents, proposals, and other files you upload for analysis</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Information We Collect Automatically:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li><strong>Usage Data:</strong> Pages visited, features used, time spent, search queries</li>
                      <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                      <li><strong>Location Data:</strong> General geographic location based on IP address</li>
                      <li><strong>Log Data:</strong> Server logs, error reports, performance metrics</li>
                      <li><strong>Session Data:</strong> Login times, session duration, security events</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Third-Party Data:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li><strong>Government Data:</strong> Public contract opportunities from SAM.gov and other government databases</li>
                      <li><strong>Business Data:</strong> Publicly available company information for opportunity matching</li>
                      <li><strong>Analytics Data:</strong> Aggregated usage statistics from analytics providers</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section id="how-we-use">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span>2. How We Use Your Information</span>
                </h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>We use your information for the following purposes:</p>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Service Provision:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li>Provide access to government contract opportunities</li>
                      <li>Generate AI-powered RFP responses and recommendations</li>
                      <li>Process and analyze uploaded documents</li>
                      <li>Maintain your account and subscription</li>
                      <li>Provide customer support and technical assistance</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Communication:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li>Send service-related notifications and updates</li>
                      <li>Respond to your inquiries and support requests</li>
                      <li>Send marketing communications (with your consent)</li>
                      <li>Notify you of new features and opportunities</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Improvement & Analytics:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li>Analyze usage patterns to improve our services</li>
                      <li>Develop new features and functionality</li>
                      <li>Conduct research and analytics</li>
                      <li>Monitor and ensure service security</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Legal & Compliance:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li>Comply with legal obligations and regulations</li>
                      <li>Protect our rights and prevent fraud</li>
                      <li>Enforce our Terms of Service</li>
                      <li>Respond to legal requests and court orders</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="information-sharing">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">3. Information Sharing and Disclosure</h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>We do not sell, trade, or rent your personal information. We may share your information in the following limited circumstances:</p>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Service Providers:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li><strong>Payment Processing:</strong> Stripe for secure payment processing</li>
                      <li><strong>Cloud Infrastructure:</strong> Supabase for database and authentication services</li>
                      <li><strong>AI Services:</strong> OpenAI for AI-powered content generation</li>
                      <li><strong>Analytics:</strong> Analytics providers for usage insights</li>
                      <li><strong>Email Services:</strong> Email service providers for communications</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Legal Requirements:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li>When required by law, regulation, or court order</li>
                      <li>To protect our rights, property, or safety</li>
                      <li>To prevent fraud or security threats</li>
                      <li>In connection with legal proceedings</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Business Transfers:</h4>
                    <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction, subject to the same privacy protections.</p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section id="data-security">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span>4. Data Security</span>
                </h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>We implement comprehensive security measures to protect your information:</p>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Technical Safeguards:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li>End-to-end encryption for data transmission (TLS/SSL)</li>
                      <li>Encryption at rest for stored data</li>
                      <li>Secure authentication with multi-factor options</li>
                      <li>Regular security audits and penetration testing</li>
                      <li>Automated backup and disaster recovery systems</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Administrative Safeguards:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li>Access controls and role-based permissions</li>
                      <li>Employee training on data protection</li>
                      <li>Incident response and breach notification procedures</li>
                      <li>Regular security policy updates</li>
                    </ul>
                  </div>

                  <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-amber-800 font-medium text-sm sm:text-base">Security Notice</p>
                        <p className="text-amber-700 text-xs sm:text-sm mt-1">
                          While we implement strong security measures, no system is 100% secure. 
                          Please help protect your account by using strong passwords and keeping 
                          your login credentials confidential.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section id="data-retention">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">5. Data Retention</h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>We retain your information for as long as necessary to provide our services and comply with legal obligations:</p>
                  
                  <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2 sm:ml-4 text-sm sm:text-base">
                    <li><strong>Account Data:</strong> Retained while your account is active and for 3 years after closure</li>
                    <li><strong>Usage Data:</strong> Aggregated data retained for analytics purposes (anonymized after 2 years)</li>
                    <li><strong>Payment Data:</strong> Billing records retained for 7 years for tax and legal compliance</li>
                    <li><strong>Support Communications:</strong> Retained for 3 years for quality assurance</li>
                    <li><strong>Legal Hold:</strong> Data may be retained longer if required for legal proceedings</li>
                  </ul>

                  <p>
                    You can request deletion of your data at any time, subject to legal retention requirements. 
                    We will securely delete or anonymize your information when no longer needed.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="your-rights">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span>6. Your Privacy Rights</span>
                </h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>Depending on your location, you may have the following rights regarding your personal information:</p>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Universal Rights:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li><strong>Access:</strong> Request a copy of your personal information</li>
                      <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                      <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                      <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                      <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">GDPR Rights (EU Residents):</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li><strong>Restriction:</strong> Limit how we process your information</li>
                      <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                      <li><strong>Automated Decision-Making:</strong> Opt-out of automated profiling</li>
                      <li><strong>Supervisory Authority:</strong> File complaints with data protection authorities</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">CCPA Rights (California Residents):</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li><strong>Know:</strong> Know what personal information is collected and how it's used</li>
                      <li><strong>Delete:</strong> Request deletion of personal information</li>
                      <li><strong>Opt-out:</strong> Opt-out of the sale of personal information (we don't sell data)</li>
                      <li><strong>Non-discrimination:</strong> Equal service regardless of privacy choices</li>
                    </ul>
                  </div>

                  <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 font-medium text-sm sm:text-base">Exercising Your Rights</p>
                    <p className="text-blue-700 text-xs sm:text-sm mt-1">
                      To exercise any of these rights, contact us at privacy@bizradar.com or through your 
                      account settings. We will respond within 30 days and may require identity verification.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 7 */}
              <section id="cookies">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Cookie className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span>7. Cookies and Tracking Technologies</span>
                </h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>We use cookies and similar technologies to enhance your experience:</p>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Types of Cookies:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                      <li><strong>Essential Cookies:</strong> Required for basic site functionality and security</li>
                      <li><strong>Performance Cookies:</strong> Help us understand how you use our service</li>
                      <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                      <li><strong>Analytics Cookies:</strong> Provide insights into usage patterns</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Managing Cookies:</h4>
                    <p>
                      You can control cookies through your browser settings. Note that disabling certain 
                      cookies may affect site functionality. We also provide cookie preference controls 
                      in your account settings.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Third-Party Tracking:</h4>
                    <p>
                      We use Google Analytics and other analytics services that may set their own cookies. 
                      These services are subject to their own privacy policies.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 8 */}
              <section id="third-party">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">8. Third-Party Services</h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>Our service integrates with third-party providers who have their own privacy policies:</p>
                  
                  <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2 sm:ml-4 text-sm sm:text-base">
                    <li><strong>Supabase:</strong> Database and authentication services</li>
                    <li><strong>Stripe:</strong> Payment processing (PCI DSS compliant)</li>
                    <li><strong>OpenAI:</strong> AI-powered content generation</li>
                    <li><strong>SAM.gov:</strong> Government contract data (public information)</li>
                    <li><strong>Analytics Providers:</strong> Usage analytics and performance monitoring</li>
                  </ul>

                  <p>
                    We carefully select partners who maintain high privacy and security standards. 
                    However, we are not responsible for their privacy practices. We encourage you 
                    to review their privacy policies.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="international">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span>9. International Data Transfers</span>
                </h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>
                    Your information may be transferred to and processed in countries other than your own. 
                    We ensure appropriate safeguards are in place:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                    <li>Standard Contractual Clauses (SCCs) for EU data transfers</li>
                    <li>Adequacy decisions where applicable</li>
                    <li>Binding Corporate Rules for intra-group transfers</li>
                    <li>Certification schemes and codes of conduct</li>
                  </ul>

                  <p>
                    We primarily process data within the United States and European Union, using 
                    cloud providers with global compliance certifications.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section id="children">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">10. Children's Privacy</h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>
                    Our service is not intended for children under 18 years of age. We do not knowingly 
                    collect personal information from children under 18. If we become aware that we have 
                    collected personal information from a child under 18, we will take steps to delete 
                    such information.
                  </p>
                  <p>
                    If you are a parent or guardian and believe your child has provided us with personal 
                    information, please contact us immediately.
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section id="changes">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">11. Changes to This Privacy Policy</h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>
                    We may update this Privacy Policy from time to time to reflect changes in our 
                    practices, technology, legal requirements, or other factors. We will notify you 
                    of any material changes by:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4 text-sm sm:text-base">
                    <li>Posting the updated policy on our website</li>
                    <li>Sending email notification to registered users</li>
                    <li>Displaying a prominent notice in our application</li>
                  </ul>

                  <p>
                    Your continued use of our service after the effective date of the updated policy 
                    constitutes acceptance of the changes.
                  </p>
                </div>
              </section>

              {/* Section 12 */}
              <section id="contact">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">12. Contact Us</h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>
                    If you have any questions, concerns, or requests regarding this Privacy Policy 
                    or our data practices, please contact us:
                  </p>
                  
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="space-y-2">
                      <p className="text-sm sm:text-base"><strong>Email:</strong> privacy@bizradar.com</p>
                      <p className="text-sm sm:text-base"><strong>Data Protection Officer:</strong> dpo@bizradar.com</p>
                      <p className="text-sm sm:text-base"><strong>Support:</strong> Through your account settings or support@bizradar.com</p>
                      <p className="text-sm sm:text-base"><strong>Response Time:</strong> We aim to respond within 48 hours</p>
                    </div>
                  </div>

                  <p>
                    For GDPR-related requests, you may also contact your local data protection authority.
                  </p>
                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Version 1.0
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <Link 
                    to="/terms" 
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Terms of Service
                  </Link>
                  <Link 
                    to="/" 
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
