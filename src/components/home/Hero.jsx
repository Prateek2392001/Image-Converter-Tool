"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

export function Hero() {
    return (
        <section className="text-center py-20 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10"
            >
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 font-heading">
                    <span className="gradient-text">Convert, Compress & Resize</span>
                    <br />
                    Images Instantly
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10">
                    No Upload Needed — Everything happens 100% in your browser.
                    Secure, fast, and free.
                </p>

                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mb-10"
                >
                    <button
                        onClick={() => {
                            const element = document.getElementById('upload-area');
                            element?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-8 py-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-full font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                    >
                        Start Converting
                    </button>
                </motion.div>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block"
                >
                    <ArrowDown className="w-8 h-8 text-primary/50" />
                </motion.div>
            </motion.div>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        </section>
    );
}
