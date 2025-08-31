import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Lock, Eye, Database } from 'lucide-react';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/"
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="flex items-center space-x-3">
                            <Lock className="h-8 w-8 text-green-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
                                <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    {/* Privacy Notice */}
                    <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-green-800">
                                <p className="font-medium">Privacy Commitment</p>
                                <p className="mt-1">
                                    We are committed to protecting your privacy and ensuring the security of your personal information.
                                    This policy explains how we collect, use, and safeguard your data.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Policy Content */}
                    <div className="prose prose-gray max-w-none">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <h3 className="font-medium text-blue-900 mb-2">Personal Information:</h3>
                            <ul className="list-disc pl-6 text-blue-800 text-sm space-y-1">
                                <li>Email address and first name for account creation</li>
                                <li>Academic information (courses, grades, assignments)</li>
                                <li>Study logs and academic progress data</li>
                                <li>Account preferences and settings</li>
                            </ul>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
                        <p className="text-gray-700 mb-6">
                            We use the collected information to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                            <li>Provide and maintain the GPAConnect service</li>
                            <li>Calculate GPAs and academic performance metrics</li>
                            <li>Send password reset emails and account notifications</li>
                            <li>Improve our service and user experience</li>
                            <li>Comply with legal obligations</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Data Security</h2>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start space-x-3">
                                <Lock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-green-800">
                                    <p className="font-medium">Security Measures:</p>
                                    <ul className="list-disc pl-6 mt-2 space-y-1">
                                        <li>All data is encrypted in transit using HTTPS</li>
                                        <li>Passwords are hashed using industry-standard algorithms</li>
                                        <li>Database access is restricted and monitored</li>
                                        <li>Regular security audits and updates</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
                        <p className="text-gray-700 mb-6">
                            We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                            <li>With your explicit consent</li>
                            <li>To comply with legal requirements or court orders</li>
                            <li>To protect our rights, property, or safety</li>
                            <li>In connection with a business transfer or merger</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
                        <p className="text-gray-700 mb-6">
                            We retain your personal information for as long as your account is active or as needed to provide services.
                            You may request deletion of your account and associated data at any time.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                            <p className="text-purple-800 text-sm font-medium mb-2">
                                You have the right to:
                            </p>
                            <ul className="list-disc pl-6 text-purple-700 text-sm space-y-1">
                                <li>Access and review your personal information</li>
                                <li>Update or correct inaccurate information</li>
                                <li>Request deletion of your account and data</li>
                                <li>Opt-out of non-essential communications</li>
                                <li>Export your data in a portable format</li>
                            </ul>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking</h2>
                        <p className="text-gray-700 mb-6">
                            We use essential cookies to maintain your login session and preferences. We do not use tracking cookies
                            or third-party analytics that could compromise your privacy.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Third-Party Services</h2>
                        <p className="text-gray-700 mb-6">
                            Our service may integrate with third-party services (such as email providers for password resets).
                            These services have their own privacy policies, and we are not responsible for their practices.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
                        <p className="text-gray-700 mb-6">
                            GPAConnect is not intended for children under 13 years of age. We do not knowingly collect personal
                            information from children under 13. If you are a parent or guardian and believe your child has provided
                            us with personal information, please contact us immediately.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
                        <p className="text-gray-700 mb-6">
                            Your information may be transferred to and processed in countries other than your own. We ensure
                            appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
                        <p className="text-gray-700 mb-6">
                            We may update this Privacy Policy from time to time. We will notify you of any material changes
                            by posting the new policy on this page and updating the "Last updated" date.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
                        <p className="text-gray-700 mb-6">
                            If you have any questions about this Privacy Policy or our data practices, please contact us
                            through the Service's support channels.
                        </p>

                        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 text-center">
                                By using GPAConnect, you acknowledge that you have read and understood this Privacy Policy
                                and consent to the collection and use of your information as described herein.
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <Link
                                to="/terms-of-service"
                                className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
                            >
                                <FileText className="h-4 w-4" />
                                <span>Terms of Service</span>
                            </Link>
                            <Link
                                to="/"
                                className="text-gray-600 hover:text-gray-700 font-medium"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;

