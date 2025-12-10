"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function LiveCounter() {
  const [count, setCount] = useState(2400000); // Starting at 2.4M as per spec
  const [earnings, setEarnings] = useState(1250000); // $1.25M in earnings

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time growth
      setCount((prev) => prev + Math.floor(Math.random() * 3));
      setEarnings((prev) => prev + Math.floor(Math.random() * 50));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex items-center justify-center gap-8 mb-8"
    >
      <div className="bg-card/30 backdrop-blur border border-border/30 rounded-2xl px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <motion.div
              key={count}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-display font-bold text-emerald-400"
            >
              {formatNumber(count)}
            </motion.div>
            <div className="text-xs text-muted-foreground">
              datasets powering AI
            </div>
          </div>

          <div className="w-px h-8 bg-border/50" />

          <div className="text-center">
            <motion.div
              key={earnings}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-display font-bold text-amber-400"
            >
              ${formatNumber(earnings)}
            </motion.div>
            <div className="text-xs text-muted-foreground">
              earned by creators
            </div>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 bg-emerald-400 rounded-full"
        />
        <span className="text-xs text-muted-foreground">Live</span>
      </div>
    </motion.div>
  );
}
