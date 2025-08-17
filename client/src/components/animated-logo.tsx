import { motion } from "framer-motion";

export default function AnimatedLogo() {
  const text = "StreamShare";
  const letters = text.split("");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const letterVariants = {
    hidden: { 
      opacity: 0, 
      x: 50,
      rotateY: 90,
    },
    visible: {
      opacity: 1,
      x: 0,
      rotateY: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200,
      },
    },
  };

  return (
    <motion.div
      className="flex items-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 className="text-2xl font-bold gradient-text neon-text flex">
        {letters.map((letter, index) => (
          <motion.span
            key={index}
            variants={letterVariants}
            className="inline-block"
            whileHover={{
              scale: 1.2,
              rotate: 360,
              transition: { duration: 0.3 },
            }}
          >
            {letter}
          </motion.span>
        ))}
      </motion.h1>
    </motion.div>
  );
}
