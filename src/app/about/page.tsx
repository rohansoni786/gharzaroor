'use client'

import { motion } from 'framer-motion'
import { User, LogIn, Search, MessageCircle, ShieldCheck, Lock, Landmark, Gift, Heart, HelpCircle, AlertCircle } from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
}

const stepItems = [
  {
    icon: User,
    title: 'Sign in / Create account',
    desc: 'Get verified with your phone number. Takes 30 seconds.'
  },
  {
    icon: Search,
    title: 'Browse or Post listings',
    desc: 'Search by landmark or post your room/vacancy for free.'
  },
  {
    icon: MessageCircle,
    title: 'Connect securely',
    desc: 'Click "Reveal Contact" after 48h privacy window.'
  }
]

const whyBadges = [
  {
    icon: ShieldCheck,
    title: '100% Verified Owners',
    desc: 'Phone verified only. No fakes.'
  },
  {
    icon: Lock,
    title: 'Confidential Connections',
    desc: 'Privacy firewall until you approve.'
  },
  {
    icon: Landmark,
    title: 'Karachi Specialists',
    desc: 'Local landmarks & universities.'
  },
  {
    icon: Gift,
    title: 'Free Forever',
    desc: 'Basic listings always free.'
  }
]

const faqs = [
  {
    q: 'Is Gharzaroor free?',
    a: 'Yes, basic listings are free forever. Post rooms or wanted ads at no cost.'
  },
  {
    q: 'How do I contact an owner?',
    a: 'After signing in, click "Reveal Contact" on listing detail (48h privacy).'
  },
  {
    q: "Can I post both vacancies and 'wanted' ads?",
    a: 'Yes! Use /post-listing for rooms available, /wanted/post for roommate wanted.'
  },
  {
    q: 'What areas are covered?',
    a: 'All major Karachi landmarks – KU, IBA, NED, DHA, Gulistan, Clifton, and 70+ more.'
  },
  {
    q: 'How do I report a listing?',
    a: "Use the 'Report' button on the listing detail page. We'll review within 24h."
  }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        
        {/* Hero */}
        <motion.section {...fadeInUp} className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent mb-6">
            About Gharzaroor.pk
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto">
            Karachi&apos;s trusted shared flats platform
          </p>
        </motion.section>

        {/* How It Works */}
        <motion.section 
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mb-20"
        >
          <motion.h2 {...fadeInUp} className="text-3xl font-bold text-gray-900 text-center mb-16">
            How It Works
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {stepItems.map((step, i) => (
              <motion.div 
                key={i}
                {...fadeInUp}
                whileHover={{ y: -8 }}
                className="group bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-300"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Why Choose */}
        <motion.section 
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mb-20"
        >
          <motion.h2 {...fadeInUp} className="text-3xl font-bold text-gray-900 text-center mb-16">
            Why Choose Gharzaroor
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyBadges.map((badge, i) => (
              <motion.div 
                key={i}
                {...fadeInUp}
                className="bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <badge.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <h4 className="font-bold text-lg mb-2">{badge.title}</h4>
                <p className="text-sm text-gray-600">{badge.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Safety Guide */}
        <motion.section {...fadeInUp} className="mb-20">
          <div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-emerald-600" />
              Safety Guide
            </h2>
            <ul className="space-y-4 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                <span>Meet the owner/roommate in a public place first.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                <span>Never pay a deposit or advance rent without visiting the property.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                <span>Verify electricity, water, and gas connections in person.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                <span>Ask for a written rent agreement or receipt.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                <span>Check fire exits, locks, and overall security.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                <span>Share the address and owner details with a trusted friend before visiting.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                <span>Trust your instincts – if something feels off, walk away.</span>
              </li>
            </ul>
          </div>
        </motion.section>

        {/* Disclaimer */}
        <motion.section {...fadeInUp} className="mb-20">
          <div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-3xl p-8 md:p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Disclaimer</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Gharzaroor.pk provides phone‑verified listings only. We do not pre‑screen rooms,
              and we are not responsible for the condition of the property, the owner&apos;s behavior,
              or any transactions between users. All users are urged to perform their own due diligence.
              By using this platform, you agree to our terms of service.
            </p>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section 
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mb-20"
        >
          <motion.h2 {...fadeInUp} className="text-3xl font-bold text-gray-900 text-center mb-16">
            Frequently Asked Questions
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <motion.div 
                key={i}
                {...fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
              >
                <h4 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-indigo-600 transition">
                  {faq.q}
                </h4>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Founder&apos;s Note */}
        <motion.section {...fadeInUp} className="text-center">
          <div className="bg-gradient-to-r from-indigo-500 to-emerald-600 bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl rounded-3xl p-12 max-w-2xl mx-auto">
            <Heart className="w-16 h-16 text-white mx-auto mb-6 opacity-90" />
            <h3 className="text-2xl font-bold text-white mb-6">Founder&apos;s Note</h3>
            <p className="text-white/90 text-lg leading-relaxed">
              As the founder, I built Gharzaroor.pk because I was tired of WhatsApp chaos, fake listings, 
              and endless spam groups. This platform is for real Karachi students and professionals 
              who just want a safe, simple way to find verified shared flats near their university or workplace.
            </p>
            <p className="text-white/80 mt-6 font-semibold">– Rohan, Karachi</p>
          </div>
        </motion.section>

      </div>
    </div>
  )
}
