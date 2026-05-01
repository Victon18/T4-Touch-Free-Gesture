import Hero from "@/components/Hero";
import UseCases from "@/components/UseCases";
import HowItWorks from "@/components/HowItWorks";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function PreviewPage() {
  return (
    <div style={{ width: '100%', background: '#000', minHeight: '100vh', color: '#fff' }}>
      <main>
        <Hero />
        <UseCases />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
