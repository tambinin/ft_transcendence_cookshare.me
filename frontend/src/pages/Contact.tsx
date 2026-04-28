import Footer from '../components/Footer'
import NavigationButton from '../components/NavigationButton'
import Title from '../components/Title'

const Contact = () => {
    return (
        <div className="min-h-screen bg-[#18191a]">
            <nav className="flex flex-row justify-between items-center py-4 px-4 sm:px-6 md:px-12">
                <Title slogan="primary" variant="primary" />
                <div className="flex items-center gap-2 sm:gap-3">
                    <NavigationButton to="/" variant="outline">Home</NavigationButton>
                    <NavigationButton to="/login" variant="primary" width="w-28 sm:w-32" height="h-10 sm:h-12">Login</NavigationButton>
                </div>
            </nav>

            <section className="px-4 sm:px-6 md:px-12 pt-8 sm:pt-12 pb-10 sm:pb-16">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4">
                        Contact
                    </h1>
                    <p className="text-white/50 text-sm">
                        Have a question, suggestion, or issue? Our team is here to help.
                    </p>
                </div>
            </section>

            <section className="px-4 sm:px-6 md:px-12 pb-16 sm:pb-24">
                <div className="max-w-3xl mx-auto space-y-6">

                    <div className="border border-white/10 rounded-2xl p-5 sm:p-7">
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">General Support</h2>
                        <p className="text-white/50 text-sm leading-relaxed mb-3">
                            For any questions about using CookShare, your account, or our features.
                        </p>
                        <p className="text-orange-400 text-sm">support@cookshare.me</p>
                    </div>

                    <div className="border border-white/10 rounded-2xl p-5 sm:p-7">
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Personal Data</h2>
                        <p className="text-white/50 text-sm leading-relaxed mb-3">
                            To exercise your GDPR rights or any questions about the processing of your data.
                        </p>
                        <p className="text-orange-400 text-sm">privacy@cookshare.me</p>
                    </div>

                    <div className="border border-white/10 rounded-2xl p-5 sm:p-7">
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Security</h2>
                        <p className="text-white/50 text-sm leading-relaxed mb-3">
                            Report vulnerabilities or unauthorized access to your account.
                        </p>
                        <p className="text-orange-400 text-sm">security@cookshare.me</p>
                    </div>

                    <div className="border border-white/10 rounded-2xl p-5 sm:p-7">
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Legal Inquiries</h2>
                        <p className="text-white/50 text-sm leading-relaxed mb-3">
                            Intellectual property, content reporting, or legal requests.
                        </p>
                        <p className="text-orange-400 text-sm">legal@cookshare.me</p>
                    </div>

                    <div className="border border-white/10 rounded-2xl p-5 sm:p-7">
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Response Time</h2>
                        <p className="text-white/50 text-sm leading-relaxed">
                            Our team typically responds within 48 business hours.
                            For urgent security matters, we aim to respond within 24 hours.
                        </p>
                    </div>

                </div>
            </section>

            <footer className="px-4 sm:px-6 md:px-12 pb-8 max-w-3xl mx-auto">
                <Footer />
            </footer>
        </div>
    )
}

export default Contact
