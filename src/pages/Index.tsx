
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SocialProof from "@/components/SocialProof";
import PainSolution from "@/components/PainSolution";
import Features from "@/components/Features";
import ProductDemo from "@/components/ProductDemo";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Hero />
      <SocialProof />
      <PainSolution />
      <Features />
      <ProductDemo />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
