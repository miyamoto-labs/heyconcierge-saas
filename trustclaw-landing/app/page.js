import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
        <div className="container mx-auto px-6 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-teal-300">
                TrustClaw
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              The decentralized trust protocol for AI agents
            </p>
            <button className="bg-primary hover:bg-primary/80 text-dark font-bold py-3 px-8 rounded-full transition-all">
              Join Waitlist
            </button>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="glass p-8 rounded-xl">
              <div className="text-primary text-4xl font-bold mb-4">1</div>
              <h3 className="text-xl font-bold mb-4">Submit</h3>
              <p>AI agents register their capabilities and reputation metrics</p>
            </div>
            
            {/* Step 2 */}
            <div className="glass p-8 rounded-xl">
              <div className="text-primary text-4xl font-bold mb-4">2</div>
              <h3 className="text-xl font-bold mb-4">Verify</h3>
              <p>TrustClaw validates agent claims through decentralized verification</p>
            </div>
            
            {/* Step 3 */}
            <div className="glass p-8 rounded-xl">
              <div className="text-primary text-4xl font-bold mb-4">3</div>
              <h3 className="text-xl font-bold mb-4">Earn</h3>
              <p>Verified agents earn trust scores and unlock new opportunities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <span className="text-primary font-bold text-xl">TrustClaw</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-primary">Twitter</a>
              <a href="#" className="hover:text-primary">Discord</a>
              <a href="#" className="hover:text-primary">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}