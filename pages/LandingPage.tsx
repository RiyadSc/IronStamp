import React from 'react'
import Link from 'next/link'
import { 
  ArrowRight, 
  ChevronRight, 
  Menu, 
  X, 
  Shield, 
  Users, 
  Award, 
  Truck,
  Check,
  Calendar,
  FolderOpen,
  Bell,
  Download,
  Play,
  FileText,
  Building
} from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"
import { cn } from '@/lib/utils'
import { supabasePersistent } from '@/lib/supabase'

// Animation variants for hero section
const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

const menuItems = [
    { name: 'Features', href: '#features' },
    { name: 'Solution', href: '#demo' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'About', href: '#faq' },
]

// Logo Component
const Logo = ({ className, isScrolled }: { className?: string; isScrolled?: boolean }) => {
    return (
        <div className={cn('flex items-center space-x-0.5', className)}>
            <img 
                src="/LogoIronStamp.png" 
                alt="IronStamp" 
                className="w-11 h-11" 
            />
            <span className={cn('text-xl font-bold transition-colors duration-300', isScrolled ? 'text-black' : 'text-white')}>
                IronStamp
            </span>
        </div>
    )
}

// Header Component
const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [showDashboardOnly, setShowDashboardOnly] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        // Check for session and keepMeLoggedIn
        const checkSession = async () => {
            const keepMe = localStorage.getItem('keepMeLoggedIn') === 'true'
            if (keepMe) {
                const { data: { session } } = await supabasePersistent.auth.getSession()
                if (session && session.user) {
                    setShowDashboardOnly(true)
                }
            }
        }
        checkSession()
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])
    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2 group">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo isScrolled={isScrolled} />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                'block duration-150',
                                                isScrolled ? 'text-muted-foreground hover:text-accent-foreground' : 'text-white'
                                            )}
                                        >
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            {showDashboardOnly ? (
                                <Button asChild size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                                    <Link href="/Dashboard">
                                        Go to Dashboard
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <div className="lg:hidden">
                                        <ul className="space-y-6 text-base">
                                            {menuItems.map((item, index) => (
                                                <li key={index}>
                                                    <Link
                                                        href={item.href}
                                                        className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                        <span>{item.name}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className={cn(isScrolled && 'lg:hidden', 'hover:shadow-[0_0_8px_2px_#72e9ff] transition-shadow duration-300 ease-in-out')}
                                        >
                                            <Link href="/auth/signin">
                                                <span>Login</span>
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className={cn(isScrolled && 'lg:hidden', 'bg-white text-black hover:shadow-[0_0_8px_2px_#72e9ff] transition-shadow duration-300 ease-in-out')}
                                        >
                                            <Link href="/auth/signup">
                                                <span>Sign Up</span>
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size="sm"
                                            className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}>
                                            <Link href="/auth/signup">
                                                <span>Get Started</span>
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

// Hero Section Component
const HeroSection = () => {
    return (
        <main className="overflow-hidden">
            <div
                aria-hidden
                className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
                <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
            </div>
            <section>
                <div className="relative pt-24 md:pt-36">
                    <AnimatedGroup
                        variants={{
                            container: {
                                visible: {
                                    transition: {
                                        delayChildren: 1,
                                    },
                                },
                            },
                            item: {
                                hidden: {
                                    opacity: 0,
                                    y: 20,
                                },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                        type: 'spring',
                                        bounce: 0.3,
                                        duration: 2,
                                    },
                                },
                            },
                        }}
                        className="absolute inset-0 -z-20">
                        <img
                            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=3276&auto=format&fit=crop"
                            alt="background"
                            className="absolute inset-x-0 top-56 -z-20 hidden lg:top-32 dark:block"
                            width="3276"
                            height="4095"
                        />
                    </AnimatedGroup>
                    <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                            <AnimatedGroup preset="blur-slide">
                                <Link
                                    href="#link"
                                    className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950">
                                    <span className="text-foreground text-sm">Introducing IronStamp Pro</span>
                                    <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                                    <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                                        <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                            <span className="flex size-6">
                                                <ArrowRight className="m-auto size-3" />
                                            </span>
                                            <span className="flex size-6">
                                                <ArrowRight className="m-auto size-3" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                    
                                <h1
                                    className="mt-6 max-w-4xl mx-auto text-balance text-3xl sm:text-4xl md:text-6xl lg:text-7xl lg:mt-16 xl:text-[5.25rem] text-white drop-shadow-ultra leading-tight"
                                >
                                    Stop Losing Money to Expired HVAC Licenses in Massachusetts.
                                </h1>
                                <p
                                    className="mx-auto mt-6 max-w-2xl text-balance text-base sm:text-lg text-white drop-shadow-strong px-4"
                                >
                                    Track EPA 608, OSHA 10/30, and Massachusetts state license expirations for every tech on your team. We send reminders, store files, and keep you compliant. No spreadsheets, no stress.
                                </p>
                            </AnimatedGroup>

                            <AnimatedGroup
                                preset="slide"
                                className="mt-8 flex flex-col items-center justify-center gap-4 px-4">
                                <div
                                    key={1}
                                    className="bg-foreground/10 rounded-[14px] border p-0.5 hover:shadow-[0_0_12px_4px_rgba(114,233,255,0.3)] transition-shadow duration-300 ease-in-out w-full max-w-sm">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="rounded-xl px-6 py-4 text-base w-full">
                                        <Link href="/auth/signup">
                                            <span className="text-sm sm:text-base">Start Free for HVAC Teams</span>
                                        </Link>
                                    </Button>
                                </div>

                            </AnimatedGroup>
                        </div>
                    </div>

                    <div className="relative mt-8 overflow-visible px-4 sm:px-2 sm:mr-0 sm:mt-12 md:mt-20">
                        <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-xl sm:rounded-2xl border p-2 sm:p-4 shadow-lg shadow-zinc-950/15 ring-1">
                            <img
                                className="bg-background w-full h-auto relative hidden rounded-xl sm:rounded-2xl dark:block"
                                src="/Dashboard1.png"
                                alt="Dashboard screenshot"
                                width="2700"
                                height="1440"
                            />
                            <img
                                className="z-2 border-border/25 w-full h-auto relative rounded-xl sm:rounded-2xl border dark:hidden"
                                src="/Dashboard1.png"
                                alt="Dashboard screenshot"
                                width="2700"
                                height="1440"
                            />
                        </div>
                        {/* White gradient overlay for fade-out effect */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 w-full max-w-6xl h-48 z-10 rounded-b-2xl"
                            style={{
                                background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 90%)"
                            }}
                        />
                    </div>
                </div>
            </section>
        </main>
    )
}

// Social Proof Component
const SocialProof = () => {
  const logos = [
    { src: "/EPAlogo.png", alt: "EPA" },
    { src: "/NateLogo.png", alt: "NATE" },
    { src: "/OSHALogo.png", alt: "OSHA" },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-slate-600 font-medium mb-6 sm:mb-8 text-sm sm:text-base">
            Built for technicians trained by:
          </p>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4 sm:gap-8 items-center justify-center">
            {logos.map((logo, index) => (
              <div key={index} className="flex flex-col items-center p-2 sm:p-4">
                <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-34 md:h-34 flex items-center justify-center mb-2 sm:mb-3">
                  <img src={logo.src} alt={logo.alt} className="max-h-16 sm:max-h-20 md:max-h-28 object-contain" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-3xl mx-auto text-center px-4">
          <blockquote className="text-base sm:text-lg text-slate-700 italic mb-4 sm:mb-6">
            "We almost missed an EPA cert renewal in MA, IronStamp caught it."
          </blockquote>
          <div className="flex items-center justify-center">
            <img src="/Mark.png" alt="Mark B." className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3 sm:mr-4 object-cover" />
            <div className="text-left">
              <p className="font-medium text-slate-900 text-sm sm:text-base">Mark B.</p>
              <p className="text-xs sm:text-sm text-slate-600">Operations Manager, Patriot Heating & Air</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Pain Solution Component
const PainSolution = () => {
  const painPoints = [
    "Forgot to renew EPA 608 or OSHA-10 certs",
    "Scrambling for PDFs before inspections",
    "Techs working with expired licenses",
    "Penalties from state licensing boards",
    "No team visibility on compliance status"
  ];

  const solutions = [
    "Automated reminders for EPA, OSHA, and state licenses",
    "All certs stored in one place",
    "Clear compliance reports for audits",
    "Team view of all techs' cert status",
    "Real-time compliance reporting"
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
            Stop Playing Certification Roulette
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto px-4">
            Are you still managing HVAC technician licenses and certifications the old way? It's time for a better approach.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-20">
                      <div className="space-y-6 sm:space-y-8">
            <div className="text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">The Old Way (Risky)</h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {painPoints.map((pain, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  </div>
                  <p className="text-slate-700 text-sm sm:text-base">{pain}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8 mt-8 md:mt-0">
            <div className="text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">The IronStamp Way (Smart)</h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {solutions.map((solution, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </div>
                  <p className="text-slate-700 text-sm sm:text-base">{solution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Features Component
const Features = () => {
  const features = [
    {
      icon: Calendar,
      title: "License Renewal Reminders for HVAC Techs",
      description: "Get notified 90, 60, 30, and 7 days before any license expires. Never miss a deadline again."
    },
    {
      icon: FolderOpen,
      title: "Secure Storage",
      description: "Upload and access certificates from any device. Bank-level encryption keeps your documents safe."
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Give managers and workers role-based access. See who's compliant at a glance."
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Get notified before your techs lose work eligibility. Email, SMS, and in-app alerts ensure critical renewals never slip through the cracks."
    },
    {
      icon: Shield,
      title: "Compliance Reports",
      description: "Generate audit-ready reports in seconds. Prove compliance to regulators instantly."
    },
    {
      icon: Download,
      title: "Data Export",
      description: "Your data stays yours. Export everything anytime in multiple formats."
    }
  ];

  return (
    <section id="features" className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
            Everything You Need to Stay Compliant
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto px-4">
            Simple tools that work for HVAC teams managing technician licenses and certifications.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-3 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Product Demo Component
const ProductDemo = () => {
  return (
    <section id="demo" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            See IronStamp in Action
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Watch how easy it is to upload, track, and manage all your certifications.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
                    <Play className="h-10 w-10 text-white ml-1" />
                  </div>
                  <p className="text-slate-700 font-medium">Interactive Demo</p>
                  <p className="text-sm text-slate-500">No signup required</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Upload in Seconds
                </h3>
                <p className="text-slate-600">
                  Drag and drop certificates, or snap photos with your phone. AI automatically extracts expiration dates.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Smart Tracking
                </h3>
                <p className="text-slate-600">
                  Visual dashboard shows what's expiring soon, what needs renewal, and what's up to date.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Team Visibility
                </h3>
                <p className="text-slate-600">
                  Managers see compliance status across the entire team. Workers access only their own certifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Pricing Component
const Pricing = () => {
  const plans = [
    {
      name: "Individual",
      price: "Free",
      description: "Perfect for solo professionals",
      icon: Users,
      features: [
        "Up to 10 certifications",
        "Email reminders",
        "Mobile app access",
        "Basic document storage",
        "Export your data"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Team",
      price: "$12",
      period: "/user/month",
      description: "Designed for small and mid-sized HVAC teams managing 3+ technicians",
      icon: Building,
      features: [
        "Unlimited certifications",
        "Team dashboard",
        "Role-based access",
        "SMS & email alerts",
        "Compliance reports",
        "Priority support",
        "Advanced exports"
      ],
      cta: "Start 14-Day Trial",
      popular: true
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Start free as an individual. Scale up when your team grows.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <div 
                key={index} 
                className={`relative p-6 sm:p-8 rounded-xl sm:rounded-2xl border-2 ${
                  plan.popular 
                    ? 'border-blue-500 shadow-xl' 
                    : 'border-slate-200 hover:border-slate-300'
                } transition-all duration-200`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6 sm:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-slate-600 mb-3 sm:mb-4 text-sm sm:text-base">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl sm:text-4xl font-bold text-slate-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-slate-600 ml-1 text-sm sm:text-base">{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                      <span className="text-slate-600 text-sm sm:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  asChild
                  className={`w-full py-3 sm:py-4 rounded-xl transition-all duration-300 ease-in-out text-sm sm:text-base ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-[0_0_12px_4px_rgba(59,130,246,0.4)] text-white' 
                      : 'bg-slate-100 hover:bg-slate-200 hover:shadow-[0_0_8px_2px_rgba(114,233,255,0.3)] text-slate-900'
                  }`}
                >
                  <Link href="/auth/signup">
                    {plan.cta}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600 mb-4">Need a custom plan for larger organizations?</p>
          <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
};

// FAQ Component
const FAQ = () => {
  const faqs = [
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
  ];

  return (
    <section id="faq" className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-slate-600">
            Everything you need to know about IronStamp
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white border border-slate-200 rounded-xl px-6"
            >
              <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12">
          <p className="text-slate-600 mb-4">Still have questions?</p>
          <div className="space-x-4">
            <a href="mailto:ironstamp.team@gmail.com" className="text-blue-600 hover:text-blue-700 font-medium">
              Email Support
            </a>
            <span className="text-slate-300">•</span>
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Live Chat
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

// Final CTA Component
const FinalCTA = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-blue-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-6 sm:mb-8">
          <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-blue-200 mx-auto mb-4 sm:mb-6" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 px-4">
            Ready to Take Control of Your HVAC Team's Compliance?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto px-4">
            Join HVAC companies who keep their technicians legally eligible to work and avoid regulatory fines. Start free today.
          </p>
        </div>

        <div className="flex flex-col gap-4 justify-center items-center mb-6 sm:mb-8 px-4">
          <Button 
            asChild
            size="lg" 
            className="bg-white text-blue-600 hover:bg-blue-50 hover:shadow-[0_0_16px_6px_rgba(114,233,255,0.4)] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl font-semibold transition-all duration-300 ease-in-out w-full max-w-sm"
          >
            <Link href="/auth/signup">
              Start Free Account
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </Button>

        </div>

        <div className="text-blue-200 text-xs sm:text-sm px-4">
          ✓ No credit card required • ✓ Set up in under 5 minutes • ✓ Cancel anytime
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Demo", href: "#demo" },
      { name: "Security", href: "#" }
    ],
    company: [
      { name: "About", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Contact", href: "#" }
    ],
    support: [
      { name: "Help Center", href: "#" },
      { name: "API Docs", href: "#" },
      { name: "Status", href: "#" },
      { name: "Live Chat", href: "#" }
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Terms of Service", href: "/terms-of-service" },
      { name: "GDPR", href: "#" },
      { name: "Compliance", href: "#" }
    ]
  };

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">IronStamp</span>
            </div>
            <p className="text-slate-400 mb-6 max-w-sm">
              The smart way to track HVAC technician licenses and certifications. Never miss a deadline again.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white">Twitter</a>
              <a href="#" className="text-slate-400 hover:text-white">LinkedIn</a>
              <a href="#" className="text-slate-400 hover:text-white">YouTube</a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400">
            © 2025 IronStamp. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="text-slate-400">🔒 SOC 2 Compliant</span>
            <span className="text-slate-400">📱 Mobile Ready</span>
            <span className="text-slate-400">🌍 99.9% Uptime</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const LandingPage = () => {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <img
        src="/HeroGradient1.png"
        alt="Hero Gradient Background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          minHeight: '800px',
          maxHeight: '1200px',
          objectFit: 'cover',
          objectPosition: 'center top',
          zIndex: 0,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        draggable={false}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroHeader />
        <HeroSection />
        <SocialProof />
        <PainSolution />
        <Features />
        <ProductDemo />
        <Pricing />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage; 