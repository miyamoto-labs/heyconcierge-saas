"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export default function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");
  const num = parseInt(value.replace(/[^0-9]/g, ""));
  const isNumeric = !isNaN(num) && num > 0;

  useEffect(() => {
    if (!isInView || !isNumeric) {
      if (!isNumeric) setDisplay(value);
      return;
    }
    let start = 0;
    const duration = 1500;
    const step = Math.ceil(num / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= num) {
        setDisplay(num.toLocaleString());
        clearInterval(timer);
      } else {
        setDisplay(start.toLocaleString());
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, num, isNumeric, value]);

  return (
    <motion.span ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}>
      {display}{suffix}
    </motion.span>
  );
}
