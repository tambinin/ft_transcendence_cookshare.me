import { useNavigate } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import Footer from '../components/Footer'
import NavigationButton from '../components/NavigationButton'
import Title from '../components/Title'
import { useAuth } from '../contexts/auth.context'

const PrivacyPolicy = () => {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()

    return (
        <div className="h-screen flex flex-col bg-[#18191a] text-left overflow-hidden">
            {/* Navigation — fixed at top */}
            <nav className="shrink-0 flex flex-row justify-between items-center py-4 px-4 sm:px-6 md:px-12 bg-[#18191a] z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400
                            hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                        aria-label="Retour"
                    >
                        <FiChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <Title slogan="primary" variant="primary" />
                </div>
                {!isAuthenticated && (
                    <div className="flex items-center gap-2 sm:gap-3">
                        <NavigationButton to="/login" variant="primary" width="w-28 sm:w-32" height="h-10 sm:h-12">Login</NavigationButton>
                    </div>
                )}
            </nav>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <section className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-12 pb-10 sm:pb-16">
                <div className="max-w-3xl mx-auto text-left">
                    <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4 text-left">
                        Privacy Policy
                    </h1>
                    <p className="text-white/50 text-sm text-left">Effective since March 1, 2026</p>
                </div>
            </section>

            {/* Content */}
            <section className="px-4 sm:px-6 md:px-12 pb-16 sm:pb-24">
                <div className="max-w-3xl mx-auto space-y-10 text-left">

                    {/* Preamble */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Preamble</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>This Privacy Policy describes how CookShare (hereinafter "the Site") collects, uses, stores, and protects the personal data of its users, in accordance with the General Data Protection Regulation (GDPR) and the French Data Protection Act.</p>
                            <p>By using CookShare, you agree to the practices described in this policy. We invite you to read it carefully.</p>
                        </div>
                    </article>

                    {/* Data Controller */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 1 &mdash; Data Controller</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-2">
                            <p>The data controller for personal data is the CookShare team.</p>
                        </div>
                    </article>

                    {/* Data Collected */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 2 &mdash; Data Collected</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>We collect the following categories of data:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><span className="text-white/70">Identification data</span>: name, first name, username, email address, profile picture</li>
                                <li><span className="text-white/70">Published content</span>: recipes, comments, private messages, ratings</li>
                                <li><span className="text-white/70">Interaction data</span>: subscriptions, favorites, friend invitations, search history</li>
                                <li><span className="text-white/70">Technical data</span>: IP address, browser type, operating system, pages visited</li>
                                <li><span className="text-white/70">Connection data</span>: session identifiers, authentication tokens</li>
                            </ul>
                        </div>
                    </article>

                    {/* Purposes */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 3 &mdash; Purposes of Processing</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>Your data is processed for the following purposes:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Creation and management of your user account</li>
                                <li>Provision and personalization of Site features (news feed, recommendations)</li>
                                <li>Operation of social services: messaging, subscriptions, recipe sharing</li>
                                <li>Operation of the AI culinary assistant</li>
                                <li>Sending notifications related to your account activity</li>
                                <li>Performance improvement and bug fixing</li>
                                <li>Detection and prevention of fraud, spam, and abusive behavior</li>
                                <li>Compliance with our legal obligations</li>
                            </ul>
                            <p>We never use your data for advertising purposes.</p>
                        </div>
                    </article>

                    {/* Legal Basis */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 4 &mdash; Legal Basis for Processing</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-2">
                            <p>The processing of your data is based on:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><span className="text-white/70">Contract performance</span>: data necessary for the operation of your account and services</li>
                                <li><span className="text-white/70">Legitimate interest</span>: Site improvement, security, and abuse prevention</li>
                                <li><span className="text-white/70">Consent</span>: non-essential cookies and optional notifications</li>
                                <li><span className="text-white/70">Legal obligation</span>: retention of certain data required by law</li>
                            </ul>
                        </div>
                    </article>

                    {/* Data Sharing */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 5 &mdash; Data Sharing</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>We never sell your personal data.</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Your profile and recipes are visible to the CookShare community</li>
                                <li>Your private messages and conversations remain strictly confidential</li>
                                <li>Trusted technical service providers (hosting, infrastructure) may access data under confidentiality agreements</li>
                                <li>Competent authorities may access data only upon legal request (court order, requisition)</li>
                            </ul>
                        </div>
                    </article>

                    {/* Cookies */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 6 &mdash; Cookies</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>The Site uses the following cookies:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><span className="text-white/70">Essential cookies</span> (required): authentication, security tokens, session management</li>
                                <li><span className="text-white/70">Preference cookies</span> (optional): theme, language, dietary filters</li>
                                <li><span className="text-white/70">Analytics cookies</span> (optional): traffic and performance statistics</li>
                            </ul>
                            <p>No advertising or cross-site tracking cookies are used. You can manage your cookie preferences in your browser settings.</p>
                        </div>
                    </article>

                    {/* Security */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 7 &mdash; Data Security</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>We implement technical and organizational measures in line with industry standards:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>TLS/SSL encryption for all data in transit</li>
                                <li>Encryption at rest for sensitive data</li>
                                <li>Password hashing with bcrypt (never stored in plain text)</li>
                                <li>Brute-force protection and rate limiting</li>
                                <li>Web Application Firewall (WAF)</li>
                            </ul>
                        </div>
                    </article>

                    {/* Retention */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 8 &mdash; Data Retention</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-2">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><span className="text-white/70">Active account data</span>: retained for the lifetime of the account</li>
                                <li><span className="text-white/70">After account deletion</span>: permanently erased within 30 days</li>
                                <li><span className="text-white/70">Server logs</span>: automatically purged after 90 days</li>
                                <li><span className="text-white/70">Analytics data</span>: anonymized and aggregated after 12 months</li>
                                <li><span className="text-white/70">Backups</span>: overwritten on a 60-day rotation cycle</li>
                            </ul>
                        </div>
                    </article>

                    {/* Your Rights */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 9 &mdash; Your Rights</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>In accordance with the GDPR, you have the following rights over your personal data:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><span className="text-white/70">Right of access</span>: view and download all your data</li>
                                <li><span className="text-white/70">Right to rectification</span>: correct inaccurate information</li>
                                <li><span className="text-white/70">Right to erasure</span>: request deletion of your account and data</li>
                                <li><span className="text-white/70">Right to portability</span>: export your recipes and profile in a standard format</li>
                                <li><span className="text-white/70">Right to object</span>: object to processing in certain circumstances</li>
                                <li><span className="text-white/70">Right to restriction</span>: request restriction of processing</li>
                                <li><span className="text-white/70">Withdrawal of consent</span>: at any time, without affecting the lawfulness of prior processing</li>
                            </ul>
                            <p>To exercise these rights, contact us through the Settings page of your account. We respond within 30 days.</p>
                        </div>
                    </article>

                    {/* Minors */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 10 &mdash; Protection of Minors</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>CookShare is intended for users aged 13 and over. In the European Union, users aged 13 to 16 must have parental consent in accordance with the GDPR.</p>
                            <p>If we discover that data has been collected from a minor under 13, it will be immediately deleted. Parents or guardians may contact us to request the deletion of a minor's data.</p>
                        </div>
                    </article>

                    {/* Modifications */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 11 &mdash; Changes to this Policy</h2>
                        <p className="text-white/50 text-sm leading-relaxed">
                            We may update this Privacy Policy to reflect changes in our practices or legal requirements. Significant changes will be announced by email and in-app notification. Continued use of CookShare after modification constitutes acceptance of the updated policy. Previous versions remain available upon request.
                        </p>
                    </article>

                    {/* Complaint */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 12 &mdash; Complaints</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>If you believe that the processing of your data does not comply with regulations, you may file a complaint with the CNIL (French National Commission for Information Technology and Civil Liberties).</p>
                        </div>
                    </article>

                    {/* CTA */}
                    <div className="border border-white/10 rounded-2xl p-5 sm:p-7 mt-6 text-left">
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Questions about your data?</h2>
                        <p className="text-white/50 text-sm leading-relaxed mb-5">
                            You can manage your data preferences and exercise your rights from the Settings page of your account.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <NavigationButton to="/terms-of-service" variant="outline">
                                Terms of Service
                            </NavigationButton>
                        </div>
                    </div>

                </div>
            </section>

            <footer className="px-4 sm:px-6 md:px-12 pb-8 max-w-3xl mx-auto">
                <Footer />
            </footer>
            </div>
        </div>
    )
}

export default PrivacyPolicy
