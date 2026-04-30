"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User, Loader2, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useLanguage, LangToggle } from "@/lib/i18n";

function WaitlistContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email) {
      setError(t.register.errorRequired);
      return;
    }

    setIsLoading(true);

    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Logo */}
      <div className="text-center space-y-2">
        <div className="flex justify-end">
          <LangToggle />
        </div>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex items-center gap-2 text-4xl font-heading font-bold"
        >
          <Image src="/logo.png" alt="Latzu" width={48} height={48} className="w-12 h-12 object-contain" />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Latzu
          </span>
        </motion.div>
        <p className="text-muted-foreground">{t.register.subtitle}</p>
      </div>

      <Card className="glass border-border/50">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-heading">{t.register.cardTitle}</CardTitle>
          <CardDescription>{t.register.cardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-4"
            >
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold">{t.register.successTitle}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.register.successMessage}
              </p>
            </motion.div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.register.nameLabel}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={t.register.namePlaceholder}
                      className="pl-10"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t.register.emailLabel}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t.register.createButton
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t.register.alreadyHaveAccount}{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            {t.register.loginLink}
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

function WaitlistFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<WaitlistFallback />}>
      <WaitlistContent />
    </Suspense>
  );
}
