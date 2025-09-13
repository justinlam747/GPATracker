import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, AlertTriangle } from 'lucide-react';

const TermsOfService = () => {
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
                            <Shield className="h-8 w-8 text-slate-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
                                <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    {/* Legal Disclaimer */}
                    <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium">Legal Notice</p>
                                <p className="mt-1">
                                    This application is provided "as is" without warranties of any kind.
                                    Users are responsible for their own academic decisions and outcomes.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Terms Content */}
                    <div className="prose prose-gray max-w-none">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-700 mb-6">
                            By accessing and using GPAConnect ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
                        <p className="text-gray-700 mb-6">
                            GPAConnect is an educational tool designed to help students track academic performance, calculate GPAs, and manage course information. The Service is intended for educational purposes only and should not be considered as professional academic advice.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
                        <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                            <li>You are responsible for the accuracy of all information you input into the Service</li>
                            <li>You must maintain the confidentiality of your account credentials</li>
                            <li>You agree not to use the Service for any unlawful purpose</li>
                            <li>You are responsible for all activities that occur under your account</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Academic Disclaimer</h2>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-800 text-sm font-medium">
                                IMPORTANT: GPAConnect is an educational tool only. We do not guarantee the accuracy of GPA calculations, grade predictions, or any academic outcomes. Users should:
                            </p>
                            <ul className="list-disc pl-6 text-red-700 text-sm mt-2 space-y-1">
                                <li>Verify all calculations independently</li>
                                <li>Consult with academic advisors for official guidance</li>
                                <li>Not rely solely on this tool for academic decisions</li>
                                <li>Understand that academic policies vary by institution</li>
                            </ul>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Limitation of Liability</h2>
                        <p className="text-gray-700 mb-6">
                            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, GPAConnect SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">6. No Warranty</h2>
                        <p className="text-gray-700 mb-6">
                            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data and Privacy</h2>
                        <p className="text-gray-700 mb-6">
                            While we implement reasonable security measures, we cannot guarantee the absolute security of your data. You acknowledge that you provide information at your own risk. Please review our Privacy Policy for detailed information about data handling.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Third-Party Services</h2>
                        <p className="text-gray-700 mb-6">
                            The Service may integrate with third-party services. We are not responsible for the content, privacy policies, or practices of any third-party services.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Termination</h2>
                        <p className="text-gray-700 mb-6">
                            We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Governing Law</h2>
                        <p className="text-gray-700 mb-6">
                            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the Service operates, without regard to its conflict of law provisions.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
                        <p className="text-gray-700 mb-6">
                            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
                        <p className="text-gray-700 mb-6">
                            If you have any questions about these Terms, please contact us through the Service's support channels.
                        </p>

                        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 text-center">
                                By using GPAConnect, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <Link
                                to="/privacy-policy"
                                className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
                            >
                                <FileText className="h-4 w-4" />
                                <span>Privacy Policy</span>
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

export default TermsOfService;

