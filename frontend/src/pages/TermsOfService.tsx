import { useNavigate } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import Footer from '../components/Footer'
import NavigationButton from '../components/NavigationButton'
import Title from '../components/Title'
import { useAuth } from '../contexts/auth.context'

const TermsOfService = () => {
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
                        Terms of Service
                    </h1>
                    <p className="text-white/50 text-sm text-left">Effective since March 1, 2026 &mdash; Version 2.0</p>
                </div>
            </section>

            {/* Content */}
            <section className="px-4 sm:px-6 md:px-12 pb-16 sm:pb-24">
                <div className="max-w-3xl mx-auto space-y-10 text-left">

                    {/* Preamble */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Preamble</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>These Terms of Service (hereinafter "ToS") govern access to and use of the CookShare website and application (hereinafter "the Site"), published by the CookShare team.</p>
                            <p>By accessing the Site or creating an account, the User acknowledges having read these ToS and accepts them without reservation. If you do not accept these terms, please do not use CookShare.</p>
                        </div>
                    </article>

                    {/* Definitions */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 1 &mdash; Definitions</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-2">
                            <p><span className="text-white/70 font-medium">"Site"</span>: refers to the CookShare web platform accessible at cookshare.me and all of its pages and features.</p>
                            <p><span className="text-white/70 font-medium">"User"</span>: refers to any person accessing the Site, whether registered or not.</p>
                            <p><span className="text-white/70 font-medium">"Member"</span>: refers to a registered User with a personal account.</p>
                            <p><span className="text-white/70 font-medium">"Content"</span>: refers to recipes, photos, comments, messages, and any other information published by a Member.</p>
                            <p><span className="text-white/70 font-medium">"Publisher"</span>: refers to the team responsible for publishing and managing the Site.</p>
                        </div>
                    </article>

                    {/* Purpose */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 2 &mdash; Purpose</h2>
                        <p className="text-white/50 text-sm leading-relaxed">
                            These ToS define the conditions for accessing and using the Site by the User, as well as the rights and obligations of the parties. CookShare is a culinary social network that allows Members to share recipes, interact with other cooking enthusiasts, and benefit from an AI-powered culinary assistant.
                        </p>
                    </article>

                    {/* Access */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 3 &mdash; Access to the Site</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>The Site is freely accessible from any device with an Internet connection. All costs related to accessing the Site (hardware, Internet connection) are borne by the User.</p>
                            <p>The Publisher makes reasonable efforts to ensure continuous access to the Site. However, access may be interrupted at any time for maintenance, updates, or in the event of force majeure, without entitlement to any compensation.</p>
                            <p>Non-member Users may browse the Site but cannot access features reserved for Members (recipe publishing, messaging, AI assistant).</p>
                        </div>
                    </article>

                    {/* Registration */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 4 &mdash; Registration and Account</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>Registration is restricted to individuals aged 13 and over. In the European Union, users aged 13 to 16 must have parental consent in accordance with the GDPR.</p>
                            <p>The Member agrees to provide accurate and complete information during registration and to keep it up to date. Only one account per person is permitted. Duplicate or fictitious accounts may be suspended.</p>
                            <p>The Member is solely responsible for the confidentiality of their login credentials and all activity conducted from their account.</p>
                        </div>
                    </article>

                    {/* User Content */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 5 &mdash; User Content and Ownership</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>The Member retains full intellectual property rights over the Content they create and publish on CookShare.</p>
                            <p>By publishing Content, the Member grants the Publisher a non-exclusive, worldwide, royalty-free license to display, distribute, and promote said Content on the platform. This license terminates upon deletion of the Content or the account.</p>
                            <p>The Member warrants that they are the author of the published Content or hold the necessary rights. They agree not to publish recipes with deliberately misleading or dangerous instructions.</p>
                        </div>
                    </article>

                    {/* Intellectual Property */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 6 &mdash; Site Intellectual Property</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>All elements of the Site (structure, design, logo, original texts, source code, databases) are protected by intellectual property laws.</p>
                            <p>Any reproduction, representation, modification, or adaptation of all or part of the Site without the prior written consent of the Publisher is strictly prohibited and constitutes infringement punishable under intellectual property law.</p>
                        </div>
                    </article>

                    {/* Community Rules */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 7 &mdash; Community Rules</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>The Member agrees to use the Site respectfully and in accordance with its purpose. The following are prohibited:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Harassment, hate speech, discriminatory or defamatory remarks</li>
                                <li>Publication of violent, sexual, or illegal content</li>
                                <li>Spam, unauthorized advertising, or unrelated promotional content</li>
                                <li>Impersonation of another user or public figure</li>
                                <li>Uploading malware or any attempt to exploit vulnerabilities</li>
                                <li>Scraping, crawling, or automated data collection without authorization</li>
                                <li>Manipulating the AI assistant to generate harmful or non-cooking-related content</li>
                            </ul>
                            <p>Any violation may result in removal of the relevant Content, temporary suspension, or permanent ban of the account.</p>
                        </div>
                    </article>

                    {/* AI Assistant */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 8 &mdash; AI Culinary Assistant</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>CookShare provides an AI-powered culinary assistant. This tool is provided for informational purposes only.</p>
                            <p>AI-generated responses may contain inaccuracies. The assistant does not replace professional medical, dietary, or allergological advice. Users are encouraged to verify information and consult official sources for food safety matters.</p>
                            <p>Conversations with the AI may be anonymously logged to improve the service.</p>
                        </div>
                    </article>

                    {/* Hyperlinks */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 9 &mdash; Hyperlinks</h2>
                        <p className="text-white/50 text-sm leading-relaxed">
                            The Site may contain links to third-party websites. The Publisher exercises no control over the content of these sites and disclaims all responsibility for their content, availability, or the privacy practices of their publishers. The User accesses these external sites at their own risk.
                        </p>
                    </article>

                    {/* Liability */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 10 &mdash; Limitation of Liability</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>The Publisher strives to provide reliable information on the Site. However, it cannot be held responsible for errors, omissions, or results obtained from the use of this information.</p>
                            <p>The Site is provided "as is" and "as available," without warranty of any kind. The Publisher does not guarantee uninterrupted or error-free operation.</p>
                            <p>Recipes published by Members are not verified for nutritional accuracy or allergens. The Publisher disclaims all responsibility for the outcome of recipes prepared through the platform.</p>
                            <p>To the extent permitted by law, the Publisher's total liability shall not exceed the amounts paid by the User in the preceding 12 months.</p>
                        </div>
                    </article>

                    {/* Termination */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 11 &mdash; Account Termination</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>The Member may delete their account at any time from the Settings page. Deletion results in the erasure of the profile, recipes, and personal data within 30 days.</p>
                            <p>The Publisher may suspend or terminate an account in case of violation of these ToS. In case of serious infringement (fraud, harassment, illegal activity), suspension may be immediate. For minor infractions, a warning is issued before any suspension. The affected User will be notified by email with the reason and appeal procedure.</p>
                        </div>
                    </article>

                    {/* Modifications */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 12 &mdash; Modifications to the ToS</h2>
                        <p className="text-white/50 text-sm leading-relaxed">
                            The Publisher reserves the right to modify these ToS at any time. Substantial changes will be communicated by email and in-app notification at least 30 days before taking effect. Continued use of the Site after the effective date constitutes acceptance of the new terms. In case of disagreement, the Member may delete their account before that date.
                        </p>
                    </article>

                    {/* Applicable Law */}
                    <article>
                        <h2 className="text-xl font-semibold text-white mb-4">Article 13 &mdash; Applicable Law and Dispute Resolution</h2>
                        <div className="text-white/50 text-sm leading-relaxed space-y-3">
                            <p>These ToS are governed by French law. In the event of a dispute relating to the interpretation or performance of these terms, the parties agree to seek an amicable solution before any legal action.</p>
                            <p>Failing amicable resolution within 30 days, the dispute may be submitted to mediation, then to the competent courts of Paris, France.</p>
                            <p>If any provision of these ToS is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.</p>
                        </div>
                    </article>

                    {/* CTA */}
                    {!isAuthenticated ? (
                        <div className="border border-white/10 rounded-2xl p-5 sm:p-7 mt-6 text-left">
                            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Ready to join CookShare?</h2>
                            <p className="text-white/50 text-sm leading-relaxed mb-5">
                                By signing up, you agree to these terms and our Privacy Policy.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <NavigationButton to="/register" variant="primary" width="w-auto px-5" height="h-10">
                                    Create an account
                                </NavigationButton>
                                <NavigationButton to="/privacy-policy" variant="outline">
                                    Privacy Policy
                                </NavigationButton>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-white/10 rounded-2xl p-5 sm:p-7 mt-6 text-left">
                            <p className="text-white/50 text-sm leading-relaxed mb-3">
                                See also our Privacy Policy for details on how we handle your data.
                            </p>
                            <NavigationButton to="/privacy-policy" variant="outline">
                                Privacy Policy
                            </NavigationButton>
                        </div>
                    )}

                </div>
            </section>

            <footer className="px-4 sm:px-6 md:px-12 pb-8 max-w-3xl mx-auto">
                <Footer />
            </footer>
            </div>
        </div>
    )
}

export default TermsOfService
