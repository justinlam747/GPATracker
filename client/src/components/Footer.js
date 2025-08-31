import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, FileText, Lock, Shield } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-black" />
                            </div>
                            <span className="text-xl font-semibold text-gray-900">GPAConnect</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Your comprehensive academic performance tracking tool.
                            Monitor grades, calculate GPAs, and stay on top of your educational journey.
                        </p>
                        <p className="text-xs text-gray-500">
                            © {new Date().getFullYear()} GPAConnect. All rights reserved.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                            Quick Links
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/courses" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                    Courses
                                </Link>
                            </li>
                            <li>
                                <Link to="/calendar" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                    Calendar
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                            Legal
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/terms-of-service"
                                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2"
                                >
                                    <FileText className="h-3 w-3" />
                                    <span>Terms of Service</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/privacy-policy"
                                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2"
                                >
                                    <Lock className="h-3 w-3" />
                                    <span>Privacy Policy</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-6 text-xs text-gray-500">
                            <span>Made with ❤️ for students</span>
                            <span>•</span>
                            <span>Educational tool only</span>
                            <span>•</span>
                            <span>Not professional advice</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Shield className="h-3 w-3" />
                            <span>Secure & Private</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

