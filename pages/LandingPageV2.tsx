import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import PricingBase from '@/components/ui/pricing-base';
import { ArrowDown, ShieldAlert, Radar, FileCheck, Printer, Menu, X } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function LandingPageV2() {
  const revealRefs = useRef<(HTMLElement | null)[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    });

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  return (
    <div className="font-mono bg-[#F0F4F8] text-[#050505] selection:bg-[#0038FF] selection:text-white overflow-x-hidden min-h-screen">
      {/* NAV */}
      <nav className="fixed w-full z-40 top-0 left-0 px-6 py-4 md:px-10 md:py-6 backdrop-blur-md bg-[#F0F4F8]/80 border-b border-[#0038FF]/10">
        <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <img src="/IronStampLogov3.png" alt="IronStamp" className="h-8 w-auto" />
            <span className="font-display font-bold text-xl md:text-2xl tracking-tighter text-[#050505]">IRONSTAMP</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#how-it-works" className="font-mono text-sm text-[#050505] hover:text-[#0038FF] transition-colors">
              How It Works
            </a>
            <a href="#solution" className="font-mono text-sm text-[#050505] hover:text-[#0038FF] transition-colors">
              Features
            </a>
            <a href="#demo" className="font-mono text-sm text-[#050505] hover:text-[#0038FF] transition-colors">
              Dashboard
            </a>
            <a href="#pricing" className="font-mono text-sm text-[#050505] hover:text-[#0038FF] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="font-mono text-sm text-[#050505] hover:text-[#0038FF] transition-colors">
              FAQ
            </a>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/auth/signin" className="font-mono text-sm text-[#050505] hover:text-[#0038FF] transition-colors">
              Login
            </Link>
            <Link href="/auth/signup" className="border border-[#0038FF] text-[#0038FF] px-6 py-2 hover:bg-[#0038FF] hover:text-white transition-colors uppercase text-sm tracking-wider font-bold">
              Start Free Trial
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#050505] hover:text-[#0038FF] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 space-y-4 border-t border-[#0038FF]/10 pt-4">
            <a 
              href="#how-it-works" 
              className="block font-mono text-sm text-[#050505] hover:text-[#0038FF] transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a 
              href="#solution" 
              className="block font-mono text-sm text-[#050505] hover:text-[#0038FF] transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#demo" 
              className="block font-mono text-sm text-[#050505] hover:text-[#0038FF] transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </a>
            <a 
              href="#pricing" 
              className="block font-mono text-sm text-[#050505] hover:text-[#0038FF] transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              className="block font-mono text-sm text-[#050505] hover:text-[#0038FF] transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </a>
            <div className="flex flex-col gap-3 pt-2">
              <Link 
                href="/auth/signin" 
                className="font-mono text-sm text-[#050505] hover:text-[#0038FF] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                href="/auth/signup" 
                className="border border-[#0038FF] text-[#0038FF] px-6 py-3 hover:bg-[#0038FF] hover:text-white transition-colors uppercase text-sm tracking-wider font-bold text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <header className="min-h-[110vh] flex flex-col justify-center items-start px-6 md:px-24 pt-32 relative bg-tech-grid">
        {/* Decorative Elements */}
        <div className="absolute right-0 top-1/4 w-1/3 h-px bg-[#0038FF]/20"></div>
        <div className="absolute right-1/4 top-0 h-1/3 w-px bg-[#0038FF]/20"></div>

        <div className="max-w-5xl z-10">
          <p className="text-[#0038FF] font-bold mb-4 tracking-widest uppercase">{`/// CRITICAL SYSTEM ALERT ///`}</p>

          <h1 className="font-display text-6xl md:text-[8rem] leading-[0.9] text-[#050505] font-bold mb-8 uppercase">
            Your Best Tech <br />
            Just Walked Onto <br />
            A Job Site...
          </h1>

          <div className="bg-black text-white p-6 md:p-10 max-w-2xl shadow-[10px_10px_0px_#0038FF] transform -rotate-1">
            <p className="text-xl md:text-3xl font-display uppercase leading-tight">
              ...WITH AN EXPIRED LICENSE. <br />
              <span className="text-[#0038FF]">AND YOU DON&apos;T EVEN KNOW IT.</span>
            </p>
          </div>

          <p className="mt-12 max-w-xl text-lg text-gray-600 leading-relaxed">
            <span className="font-bold text-black">Real talk:</span> You&apos;re running a business, not a filing cabinet. But the state of Massachusetts doesn&apos;t care. One surprise inspection, one expired EPA card, and you&apos;re looking at fines that wipe out your profit margin for the month.
          </p>

          <div className="mt-10 mb-16 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <a href="#solution" className="bg-[#0038FF] text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-[#050505] transition-colors shadow-lg flex items-center gap-3">
              Stop The Bleeding <ArrowDown className="w-5 h-5" />
            </a>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ShieldAlert className="w-4 h-4" />
              <span>MA Inspection Readiness: <span className="text-red-600 font-bold cursor">LOW</span></span>
            </div>
          </div>
        </div>
      </header>

      {/* THE AGITATION (Twisting the Knife) */}
      <section id="how-it-works" className="py-24 px-6 md:px-24 bg-white border-y border-[#0038FF]/20 relative overflow-hidden">
        {/* Background Noise Text */}
        <div className="absolute -right-20 top-10 font-display text-[20rem] text-gray-100 font-bold select-none pointer-events-none leading-none opacity-50">
          CHAOS
        </div>

        <div className="max-w-4xl relative z-10">
          <h2 className="font-display text-5xl md:text-7xl mb-12 uppercase reveal" ref={addToRefs}>
            The Friday Afternoon <span className="underline-rough text-[#0038FF]">Nightmare</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6 text-lg text-gray-800 reveal" ref={addToRefs}>
              <p>
                It&apos;s 3:30 PM. You&apos;re trying to wrap up payroll. Your phone rings. It&apos;s Mike. He&apos;s on the big commercial install downtown.
              </p>
              <p className="font-bold pl-4 border-l-4 border-red-500">
                &quot;Boss, the GC is asking for my OSHA 30 card. I think I left it in the other truck... or maybe it expired last month? I don&apos;t know.&quot;
              </p>
              <p>
                Your stomach drops. If he gets kicked off the site, you lose the schedule. If the inspector writes it up, you lose the money.
              </p>
              <p>
                You start digging through Google Drive folders named &quot;New Folder (2)&quot; and text message screenshots. <span className="bg-yellow-300 px-1">It&apos;s a mess.</span> And you know it.
              </p>
            </div>

            {/* Visualizing the Pain */}
            <div className="reveal md:translate-y-12 md:translate-x-12" ref={addToRefs}>
              <img 
                src="/Nightmare.png" 
                alt="Compliance nightmare scenario" 
                className="w-full md:w-[150%] md:max-w-none h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* THE SOLUTION (The Blueprint) */}
      <section id="solution" className="py-24 px-6 md:px-24 bg-[#001F8C] text-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-white/20 pb-8 reveal" ref={addToRefs}>
            <div>
              <p className="text-[#0038FF] font-mono mb-2">{`/// SYSTEM REBOOT ///`}</p>
              <h2 className="font-display text-5xl md:text-7xl uppercase">We Tighten <br /> The Ship.</h2>
            </div>
            <div className="text-right mt-8 md:mt-0">
              <p className="text-xl md:text-2xl max-w-md text-gray-300">
                IronStamp is the automated compliance officer you can&apos;t afford to hire.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group border border-white/20 p-8 hover:bg-white hover:text-[#001F8C] transition-all duration-300 cursor-default reveal" ref={addToRefs}>
              <div className="mb-6 p-4 bg-[#0038FF]/20 w-fit rounded group-hover:bg-[#0038FF] group-hover:text-white transition-colors">
                <Radar className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4 uppercase">The Radar</h3>
              <p className="font-mono text-sm opacity-80">
                We track every expiration date. 90 days out? We ping you. 30 days out? We ping the tech. 7 days out? We scream. No one slips through the cracks.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group border border-white/20 p-8 hover:bg-white hover:text-[#001F8C] transition-all duration-300 cursor-default reveal" ref={addToRefs}>
              <div className="mb-6 p-4 bg-[#0038FF]/20 w-fit rounded group-hover:bg-[#0038FF] group-hover:text-white transition-colors">
                <FileCheck className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4 uppercase">The Vault</h3>
              <p className="font-mono text-sm opacity-80">
                Every cert, every license, digitized and searchable by tech name, license type, or ID. Accessible from your phone in the truck or the iPad on the site.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group border border-white/20 p-8 hover:bg-white hover:text-[#001F8C] transition-all duration-300 cursor-default reveal" ref={addToRefs}>
              <div className="mb-6 p-4 bg-[#0038FF]/20 w-fit rounded group-hover:bg-[#0038FF] group-hover:text-white transition-colors">
                <Printer className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4 uppercase">The &quot;Shut Up&quot; Button</h3>
              <p className="font-mono text-sm opacity-80">
                Inspector giving you grief? Hit one button. Generate a full PDF compliance report for the entire crew. Hand it over. Watch them leave.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO / VISUALIZATION */}
      <section id="demo" className="py-24 px-6 md:px-24 relative bg-[#F0F4F8]">
        <div className="absolute left-0 top-0 w-full h-full bg-tech-grid opacity-50 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto text-center mb-16 relative z-10 reveal" ref={addToRefs}>
          <h2 className="font-display text-4xl md:text-6xl uppercase mb-4">The Compliance Radar</h2>
          <p className="font-mono text-gray-600">Real-time visibility into your team&apos;s certification status.</p>
        </div>

        {/* Dashboard Image */}
        <div className="relative z-10 max-w-6xl mx-auto reveal" ref={addToRefs}>
          <img 
            src="/Dashboardv2.png" 
            alt="IronStamp Dashboard - Compliance Management Interface" 
            className="w-full h-auto rounded-lg shadow-[20px_20px_0px_#0038FF] border-2 border-[#050505]"
          />
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section id="compliance" className="py-24 bg-[#050505] text-white border-t border-white/10">
        <div className="container mx-auto px-6 text-center">
          <h3 className="font-mono text-[#0038FF] mb-12">Built for technicians trained by:</h3>

          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-80 transition-all duration-500 reveal" ref={addToRefs}>
            <div className="flex items-center gap-3">
              <img src="/EPAlogo.png" alt="EPA" className="h-16 md:h-24 object-contain brightness-0 invert" />
            </div>
            <div className="flex items-center gap-3">
              <img src="/NATE-White-HeatCoolPro-MD-640w.png" alt="NATE" className="h-16 md:h-24 object-contain opacity-90 hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-3">
              <img src="/OSHALogo.png" alt="OSHA" className="h-16 md:h-24 object-contain brightness-0 invert" />
            </div>
          </div>

          <div className="mt-20 max-w-3xl mx-auto border-l-2 border-[#0038FF] pl-8 text-left reveal" ref={addToRefs}>
            <p className="font-display text-2xl md:text-4xl italic leading-tight">
              &quot;I used to keep certs in a shoebox. Now I keep them in my pocket. IronStamp saved us from a $5k fine last month.&quot;
            </p>
            <p className="mt-6 font-mono text-sm text-[#0038FF]">
              — TOM R., OWNER, MASS MECHANICAL
            </p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-white border-t border-[#0038FF]/10">
        <PricingBase />
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 md:px-24 bg-[#F0F4F8] border-t border-[#0038FF]/10">
        <div className="max-w-4xl mx-auto reveal" ref={addToRefs}>
          <div className="mb-16">
            <p className="text-[#0038FF] font-mono mb-2">{`/// KNOWLEDGE BASE ///`}</p>
            <h2 className="font-display text-4xl md:text-6xl uppercase mb-6">Common <br /> Questions</h2>
            <p className="font-mono text-gray-600 max-w-xl">
              Everything you need to know about compliance tracking, data security, and getting your team set up on IronStamp.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              {
                question: "Is my data secure?",
                answer: "Yes. We use bank-level encryption (AES-256) to protect your documents both in transit and at rest. Your certifications are stored on secure cloud servers with regular backups and 99.9% uptime guarantee."
              },
              {
                question: "Who owns my data?",
                answer: "You do. All uploaded certifications and personal information belong to you. You can export or delete your data at any time. We never sell or share your information with third parties."
              },
              {
                question: "Can I export my data?",
                answer: "Absolutely. You can export all your certifications, documents, and data in multiple formats (PDF, CSV, ZIP) at any time. There are no restrictions or fees for data export."
              },
              {
                question: "Is there a mobile app?",
                answer: "Yes! IronStamp works perfectly on mobile browsers, and we have native iOS and Android apps coming Q2 2024. You can upload photos of certificates directly from your phone."
              },
              {
                question: "What file formats are supported?",
                answer: "We support all common formats including PDF, JPG, PNG, DOC, DOCX, and more. You can also take photos with your phone and our AI will automatically extract expiration dates."
              },
              {
                question: "How do reminders work?",
                answer: "You'll receive automatic notifications via email and SMS (team plans) at 90, 60, 30, 14, and 7 days before expiration. You can customize these timing and preferences in your settings."
              },
              {
                question: "Can I try before I buy?",
                answer: "Yes! Individual use is completely free forever. Team plans include a 14-day free trial with full access to all features. No credit card required to start."
              },
              {
                question: "Do you support HVAC-specific certs like EPA 608?",
                answer: "Yes! IronStamp is built with HVAC techs in mind—including EPA 608, OSHA-10/30, NATE, and local licensing. You can track any certification, upload documents, and get notified before anything expires."
              },
              {
                question: "What happens if I cancel?",
                answer: "You can cancel anytime with no fees. Your data remains accessible for 30 days after cancellation, giving you time to export everything if needed."
              },
              {
                question: "Is this built for my state?",
                answer: "Yes. IronStamp supports license tracking for HVAC teams in Massachusetts. We're adding more states soon."
              }
            ].map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white border border-[#0038FF]/10 px-6 py-2 transition-all hover:border-[#0038FF]/30 data-[state=open]:border-[#0038FF] group"
              >
                <AccordionTrigger className="text-left font-display text-xl uppercase hover:no-underline py-4 [&[data-state=open]>svg]:rotate-180">
                  <span className="group-data-[state=open]:text-[#0038FF] transition-colors">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="font-mono text-sm text-gray-600 pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FOOTER / CTA */}
      <footer className="bg-[#0038FF] text-white py-24 px-6 md:px-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 border-[20px] border-white/10 rounded-full"></div>

        <div className="max-w-4xl relative z-10 reveal" ref={addToRefs}>
          <h2 className="font-display text-6xl md:text-8xl uppercase font-bold leading-none mb-8">
            Get Your <br /> House In Order.
          </h2>
          <p className="text-xl md:text-2xl mb-12 max-w-xl text-blue-100">
            Stop gambling with your compliance. It takes 5 minutes to set up.
          </p>

          <div className="flex flex-col md:flex-row gap-6">
            <a href="#" className="bg-white text-[#0038FF] px-10 py-5 font-bold uppercase text-lg tracking-wider hover:bg-[#050505] hover:text-white transition-colors shadow-xl">
              Start Free Trial
            </a>
            <a href="#" className="border-2 border-white text-white px-10 py-5 font-bold uppercase text-lg tracking-wider hover:bg-white hover:text-[#0038FF] transition-colors">
              Book Demo
            </a>
          </div>

          <div className="mt-24 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center font-mono text-xs opacity-70">
            <div>&copy; 2025 IRONSTAMP SYSTEMS. BOSTON, MA.</div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy-policy" className="hover:text-white">PRIVACY</Link>
              <Link href="/terms-of-service" className="hover:text-white">TERMS</Link>
              <a href="#" className="hover:text-white">SUPPORT</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

