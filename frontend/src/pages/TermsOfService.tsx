import React from 'react';
import { Link } from 'react-router-dom';
import { Radar, ArrowLeft, Scale, Shield, FileText, Users, CreditCard, AlertTriangle } from 'lucide-react';

const TermsOfService = () => {
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Terms of Service</h1>
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
                <Scale className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Agreement Overview</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Welcome to Bizradar! These Terms of Service ("Terms") govern your use of the Bizradar platform, 
                including our website, applications, and services (collectively, the "Service"). By accessing or 
                using our Service, you agree to be bound by these Terms.
              </p>
            </div>

            {/* Table of Contents */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Table of Contents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm">
                <a href="#acceptance" className="text-blue-600 hover:text-blue-700">1. Acceptance of Terms</a>
                <a href="#description" className="text-blue-600 hover:text-blue-700">2. Service Description</a>
                <a href="#accounts" className="text-blue-600 hover:text-blue-700">3. User Accounts</a>
                <a href="#subscriptions" className="text-blue-600 hover:text-blue-700">4. Subscriptions & Billing</a>
                <a href="#usage" className="text-blue-600 hover:text-blue-700">5. Acceptable Use</a>
                <a href="#content" className="text-blue-600 hover:text-blue-700">6. Content & Data</a>
                <a href="#intellectual" className="text-blue-600 hover:text-blue-700">7. Intellectual Property</a>
                <a href="#privacy" className="text-blue-600 hover:text-blue-700">8. Privacy & Data Protection</a>
                <a href="#disclaimers" className="text-blue-600 hover:text-blue-700">9. Disclaimers</a>
                <a href="#limitation" className="text-blue-600 hover:text-blue-700">10. Limitation of Liability</a>
                <a href="#termination" className="text-blue-600 hover:text-blue-700">11. Termination</a>
                <a href="#general" className="text-blue-600 hover:text-blue-700">12. General Provisions</a>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-6 sm:space-y-8">
              
              {/* Section 1 */}
              <section id="acceptance">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span>1. Acceptance of Terms</span>
                </h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>
                    By creating an account, accessing, or using Bizradar, you acknowledge that you have read, 
                    understood, and agree to be bound by these Terms and our Privacy Policy. If you do not 
                    agree to these Terms, you may not use our Service.
                  </p>
                  <p>
                    These Terms constitute a legally binding agreement between you and Bizradar. We may 
                    update these Terms from time to time, and your continued use of the Service constitutes 
                    acceptance of any changes.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="description">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Radar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span>2. Service Description</span>
                </h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>
                    Bizradar is a Software-as-a-Service (SaaS) platform that provides:
                  </p>
                  <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2 sm:ml-4 text-sm sm:text-base">
                    <li>Access to government contract opportunities sourced from SAM.gov (System for Award Management)</li>
                    <li>AI-powered analysis and recommendations for business opportunities</li>
                    <li>Automated RFP (Request for Proposal) response generation tools</li>
                    <li>Document processing and analysis capabilities</li>
                    <li>Business intelligence and analytics dashboards</li>
                    <li>Opportunity tracking and management tools</li>
                  </ul>
                  <p>
                    Our Service aggregates publicly available government contracting data and provides 
                    analytical tools to help businesses identify and pursue relevant opportunities.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section id="accounts">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span>3. User Accounts</span>
                </h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p><strong>Account Creation:</strong> You must create an account to access our Service. You agree to:</p>
                  <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2 sm:ml-4 text-sm sm:text-base">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain and update your account information</li>
                    <li>Keep your login credentials secure and confidential</li>
                    <li>Notify us immediately of any unauthorized access</li>
                  </ul>
                  <p><strong>Account Responsibility:</strong> You are responsible for all activities that occur under your account.</p>
                  <p><strong>Eligibility:</strong> You must be at least 18 years old and have the legal capacity to enter into contracts.</p>
                </div>
              </section>

              {/* Section 4 */}
              <section id="subscriptions">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span>4. Subscriptions & Billing</span>
                </h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p><strong>Subscription Plans:</strong> We offer multiple subscription tiers:</p>
                  <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2 sm:ml-4 text-sm sm:text-base">
                    <li>Basic Plan ($9.99/month): Limited opportunity searches and basic features</li>
                    <li>Premium Plan ($29.99/month): Enhanced features including AI-generated RFP responses</li>
                    <li>Enterprise Plan ($99.99/month): Full feature access and team collaboration</li>
                  </ul>
                  <p><strong>Free Trial:</strong> New users receive a 15-day free trial with full access to Premium features.</p>
                  <p><strong>Billing:</strong></p>
                  <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2 sm:ml-4 text-sm sm:text-base">
                    <li>Subscriptions are billed monthly in advance</li>
                    <li>All fees are non-refundable except as required by law</li>
                    <li>We use Stripe for secure payment processing</li>
                    <li>You authorize us to charge your payment method for all applicable fees</li>
                  </ul>
                  <p><strong>Cancellation:</strong> You may cancel your subscription at any time. Access continues until the end of your billing period.</p>
                </div>
              </section>

              {/* Section 5 */}
              <section id="usage">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span>5. Acceptable Use</span>
                </h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p><strong>Permitted Use:</strong> You may use our Service for legitimate business purposes in compliance with all applicable laws.</p>
                  <p><strong>Prohibited Activities:</strong> You agree not to:</p>
                  <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2 sm:ml-4 text-sm sm:text-base">
                    <li>Violate any laws, regulations, or third-party rights</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Reverse engineer, decompile, or disassemble our software</li>
                    <li>Use automated tools to scrape or harvest data beyond normal use</li>
                    <li>Share your account credentials with others</li>
                    <li>Upload malicious code, viruses, or harmful content</li>
                    <li>Interfere with or disrupt our Service or servers</li>
                    <li>Use the Service for any illegal or fraudulent purposes</li>
                  </ul>
                </div>
              </section>

              {/* Section 6 */}
              <section id="content">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">6. Content & Data</h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p><strong>Government Data:</strong> Opportunity data is sourced from SAM.gov and other public government databases. This data is provided "as-is" and we make no warranties about its accuracy or completeness.</p>
                  <p><strong>User Content:</strong> You retain ownership of content you upload (documents, company information, etc.). By uploading content, you grant us a license to process and analyze it to provide our Service.</p>
                  <p><strong>AI-Generated Content:</strong> Content generated by our AI tools is provided for informational purposes. You are responsible for reviewing and validating all AI-generated content before use.</p>
                </div>
              </section>

              {/* Section 7 */}
              <section id="intellectual">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">7. Intellectual Property</h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>
                    Bizradar and its original content, features, and functionality are owned by us and are 
                    protected by international copyright, trademark, patent, trade secret, and other 
                    intellectual property laws.
                  </p>
                  <p>
                    You may not copy, modify, distribute, sell, or lease any part of our Service or 
                    included software, nor may you reverse engineer or attempt to extract the source code.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="privacy">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">8. Privacy & Data Protection</h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>
                    Your privacy is important to us. Our Privacy Policy explains how we collect, use, 
                    and protect your information. By using our Service, you agree to the collection 
                    and use of information in accordance with our Privacy Policy.
                  </p>
                  <p>
                    We implement appropriate security measures to protect your personal information 
                    and comply with applicable data protection laws including GDPR and CCPA.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="disclaimers">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
                  <span>9. Disclaimers</span>
                </h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p className="font-semibold">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.</p>
                  <p>We disclaim all warranties, express or implied, including:</p>
                  <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-2 sm:ml-4 text-sm sm:text-base">
                    <li>Merchantability, fitness for a particular purpose, and non-infringement</li>
                    <li>Accuracy, completeness, or timeliness of government data</li>
                    <li>Uninterrupted or error-free service</li>
                    <li>Results or outcomes from using our Service</li>
                  </ul>
                  <p>
                    Government contracting involves inherent risks and uncertainties. Our Service provides 
                    information and tools but does not guarantee business success or contract awards.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section id="limitation">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">10. Limitation of Liability</h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, BIZRADAR SHALL NOT BE LIABLE FOR ANY 
                    INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING 
                    BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.
                  </p>
                  <p>
                    Our total liability to you for all claims shall not exceed the amount you paid 
                    us in the twelve months preceding the claim.
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section id="termination">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">11. Termination</h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p>
                    Either party may terminate this agreement at any time. We may suspend or terminate 
                    your access immediately for violations of these Terms or for any other reason.
                  </p>
                  <p>
                    Upon termination, your right to use the Service ceases immediately. We may delete 
                    your account and data, though we may retain some information as required by law.
                  </p>
                </div>
              </section>

              {/* Section 12 */}
              <section id="general">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">12. General Provisions</h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                  <p><strong>Governing Law:</strong> These Terms are governed by the laws of [Your State/Country].</p>
                  <p><strong>Dispute Resolution:</strong> Disputes will be resolved through binding arbitration.</p>
                  <p><strong>Severability:</strong> If any provision is found unenforceable, the remainder remains in effect.</p>
                  <p><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between us.</p>
                  <p><strong>Contact Information:</strong> For questions about these Terms, contact us at legal@bizradar.com</p>
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
                    to="/privacy" 
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Privacy Policy
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

export default TermsOfService;
