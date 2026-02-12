"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Shield,
  Sparkles,
  ChevronRight,
  Flame,
  Star,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PWAInstallModal } from "@/components/landing/pwa-install-modal";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  }),
};

export default function LandingPage() {
  const [showInstall, setShowInstall] = useState(false);

  return (
    <div className="min-h-svh bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-svh flex flex-col items-center justify-center px-6 py-20">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-coral/5 blur-3xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-gold/5 blur-3xl" />
        </div>

        <motion.div
          className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto"
          initial="hidden"
          animate="visible"
        >
          {/* Logo / Brand */}
          <motion.div custom={0} variants={fadeUp} className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Flame size={16} aria-hidden="true" />
              <span>100% cubano, 100% real</span>
            </div>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-balance"
          >
            Encuentra el amor
            <br />
            <span className="gradient-primary bg-clip-text text-transparent">
              en Cuba
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            className="mt-5 text-lg text-muted-foreground max-w-sm text-balance"
          >
            La app de citas hecha por y para cubanos. Gratis, auténtica, real.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} className="mt-8 flex flex-col gap-3 w-full max-w-xs">
            <Button
              onClick={() => setShowInstall(true)}
              className="h-14 rounded-full gradient-primary text-white font-display font-semibold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-shadow"
            >
              Dale, entra ya
              <ChevronRight size={20} className="ml-1" aria-hidden="true" />
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-2 border-primary/20 text-primary font-semibold hover:bg-primary/5"
            >
              <Link href="/auth/login">Ya tengo cuenta</Link>
            </Button>
          </motion.div>

          {/* Swipe Demo Animation */}
          <motion.div
            custom={4}
            variants={fadeUp}
            className="mt-12 relative w-64 h-80"
          >
            {/* Back card */}
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 w-52 h-72 rounded-2xl bg-muted shadow-md"
              aria-hidden="true"
            />
            {/* Front card */}
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-76 rounded-2xl bg-card shadow-xl border border-border/50 overflow-hidden"
              animate={{
                rotate: [0, -3, 3, -2, 0],
                x: [0, -8, 8, -4, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              aria-hidden="true"
            >
              <div className="h-full bg-gradient-to-b from-primary/10 via-coral/5 to-transparent flex flex-col items-center justify-center gap-3">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <Heart size={36} className="text-primary" />
                </div>
                <p className="font-display font-bold text-lg">Haz swipe</p>
                <p className="text-xs text-muted-foreground">Desliza para conectar</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6 bg-muted/30">
        <motion.div
          className="max-w-lg mx-auto text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <p className="font-display text-3xl font-extrabold text-primary">5,000+</p>
              <p className="text-xs text-muted-foreground mt-1">Usuarios</p>
            </div>
            <div className="h-10 w-px bg-border" aria-hidden="true" />
            <div className="text-center">
              <p className="font-display text-3xl font-extrabold text-primary">2,400+</p>
              <p className="text-xs text-muted-foreground mt-1">Matches</p>
            </div>
            <div className="h-10 w-px bg-border" aria-hidden="true" />
            <div className="text-center">
              <p className="font-display text-3xl font-extrabold text-primary">98%</p>
              <p className="text-xs text-muted-foreground mt-1">Reales</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Ya somos miles de cubanos buscando conexiones reales
          </p>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-lg mx-auto">
          <motion.h2
            className="font-display text-2xl font-bold text-center mb-10 text-balance"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Tu próximo amor está a un swipe
          </motion.h2>

          <div className="grid gap-4">
            {[
              {
                icon: Heart,
                title: "Matches cerca de ti",
                desc: "Encuentra personas en tu municipio y provincia. Sin distancias imposibles.",
                color: "text-primary bg-primary/10",
              },
              {
                icon: Shield,
                title: "Sin trucos, personas reales",
                desc: "Perfiles verificados con Google. No más match falsos ni bots.",
                color: "text-success bg-success/10",
              },
              {
                icon: Sparkles,
                title: "Gratis para cubanos",
                desc: "Las funciones básicas son gratis. Haz match, chatea y conecta sin pagar.",
                color: "text-gold bg-gold/10",
              },
              {
                icon: MessageCircle,
                title: "Conecta por WhatsApp",
                desc: "Cuando hagas match, podrás chatear directamente por WhatsApp. Fácil y rápido.",
                color: "text-info bg-info/10",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                className="flex items-start gap-4 rounded-2xl bg-card p-4 shadow-sm border border-border/50"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${feature.color}`}
                >
                  <feature.icon size={22} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-lg mx-auto">
          <motion.h2
            className="font-display text-2xl font-bold text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Así de fácil
          </motion.h2>

          <div className="flex flex-col gap-8">
            {[
              {
                step: "1",
                icon: Users,
                title: "Crea tu perfil",
                desc: "Entra con Google, sube tus fotos y cuéntale al mundo quién eres.",
              },
              {
                step: "2",
                icon: Star,
                title: "Haz swipe y match",
                desc: "Desliza a la derecha si te gusta, a la izquierda si no. Si ambos se gustan, ¡match!",
              },
              {
                step: "3",
                icon: MessageCircle,
                title: "Conecta por WhatsApp",
                desc: "Habla directamente con tu match. Sin intermediarios, sin esperas.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                className="flex items-center gap-5"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-primary text-white font-display font-bold text-xl shadow-md shadow-primary/20">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 text-center">
        <motion.div
          className="max-w-sm mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-display text-3xl font-extrabold mb-2 text-balance">
            Dale candela
            <br />
            a tu amor
          </p>
          <p className="text-muted-foreground mb-8">
            No más match falsos. Personas reales, conexiones reales.
          </p>
          <Button
            onClick={() => setShowInstall(true)}
            className="h-14 w-full max-w-xs rounded-full gradient-primary text-white font-display font-semibold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-shadow"
          >
            Quiero conocer gente
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-4 text-center">
          <p className="font-display font-bold text-primary">Dating Cuba</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Términos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
            <a href="#" className="hover:text-foreground transition-colors">Contacto</a>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Dating Cuba. Hecho con amor en Cuba.
          </p>
        </div>
      </footer>

      <PWAInstallModal open={showInstall} onClose={() => setShowInstall(false)} />
    </div>
  );
}
