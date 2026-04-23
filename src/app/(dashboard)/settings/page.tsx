"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/stores/userStore";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useBillingActions, useSubscription } from "@/hooks/useBilling";
import { profileTemplates } from "@/config/templates";
import type { ProfileType } from "@/types/user";
import {
  User,
  Bell,
  Palette,
  Shield,
  Globe,
  GraduationCap,
  Lightbulb,
  Check,
  Moon,
  Sun,
  Monitor,
  CreditCard,
  Zap,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";

const profileIcons: Record<ProfileType, typeof GraduationCap> = {
  estudiante: GraduationCap,
  aprendiz: Lightbulb,
};

const PRICE_PRO_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? "";
const PRICE_PRO_YEARLY  = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY  ?? "";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { profileType, preferences, updatePreferences, updateProfileType, isUpdatingProfileType } =
    useUserProfile();
  const { subscription, loading: subLoading } = useSubscription();
  const { startCheckout, openPortal } = useBillingActions();
  const searchParams = useSearchParams();
  const billingMsg = searchParams.get("billing");

  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleCheckout = async (priceId: string, label: string) => {
    setCheckoutLoading(label);
    try { await startCheckout(priceId); } finally { setCheckoutLoading(null); }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try { await openPortal(); } finally { setPortalLoading(false); }
  };

  const handleNotificationToggle = (key: keyof typeof preferences.notifications) => {
    const newPrefs = {
      ...localPrefs,
      notifications: {
        ...localPrefs.notifications,
        [key]: !localPrefs.notifications[key],
      },
    };
    setLocalPrefs(newPrefs);
    updatePreferences(newPrefs);
  };

  const handleProfileTypeChange = (type: ProfileType) => {
    updateProfileType(type);
  };

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold mb-2">Configuración</h1>
        <p className="text-muted-foreground">
          Personaliza tu experiencia en Latzu
        </p>
      </div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle>Perfil</CardTitle>
            </div>
            <CardDescription>Tu información personal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={session?.user?.image || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{session?.user?.name}</h3>
                <p className="text-muted-foreground">{session?.user?.email}</p>
                <Badge variant="outline" className="mt-1 capitalize">
                  {profileType || "Sin perfil"}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Profile Type Selection */}
            <div className="space-y-3">
              <h4 className="font-medium">Tipo de Perfil</h4>
              <p className="text-sm text-muted-foreground">
                Cambia tu perfil para adaptar la experiencia
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(profileTemplates) as ProfileType[]).map((type) => {
                  const Icon = profileIcons[type];
                  const isSelected = profileType === type;

                  return (
                    <button
                      key={type}
                      onClick={() => handleProfileTypeChange(type)}
                      disabled={isUpdatingProfileType}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-secondary"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium capitalize">{type}</p>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <CardTitle>Apariencia</CardTitle>
            </div>
            <CardDescription>Personaliza el aspecto de la aplicación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Tema</h4>
              <div className="flex gap-3">
                {[
                  { value: "light", label: "Claro", icon: Sun },
                  { value: "dark", label: "Oscuro", icon: Moon },
                  { value: "system", label: "Sistema", icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      theme === value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-sm text-center">{label}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle>Notificaciones</CardTitle>
            </div>
            <CardDescription>Controla cómo recibes notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  Recibir actualizaciones por email
                </p>
              </div>
              <Switch
                checked={localPrefs.notifications.email}
                onCheckedChange={() => handleNotificationToggle("email")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push</p>
                <p className="text-sm text-muted-foreground">
                  Notificaciones push en el navegador
                </p>
              </div>
              <Switch
                checked={localPrefs.notifications.push}
                onCheckedChange={() => handleNotificationToggle("push")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sugerencias Proactivas</p>
                <p className="text-sm text-muted-foreground">
                  La IA te sugiere tareas y conceptos
                </p>
              </div>
              <Switch
                checked={localPrefs.notifications.proactiveSuggestions}
                onCheckedChange={() => handleNotificationToggle("proactiveSuggestions")}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Language Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <CardTitle>Idioma</CardTitle>
            </div>
            <CardDescription>Selecciona tu idioma preferido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {[
                { value: "es", label: "Español", flag: "🇪🇸" },
                { value: "en", label: "English", flag: "🇺🇸" },
              ].map(({ value, label, flag }) => (
                <button
                  key={value}
                  onClick={() => {
                    const newPrefs = { ...localPrefs, language: value as "es" | "en" };
                    setLocalPrefs(newPrefs);
                    updatePreferences(newPrefs);
                  }}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    localPrefs.language === value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl block text-center mb-1">{flag}</span>
                  <p className="text-sm text-center">{label}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Billing Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <CardTitle>Plan y Facturación</CardTitle>
            </div>
            <CardDescription>Gestiona tu suscripción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {billingMsg === "success" && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
                ¡Suscripción activada correctamente!
              </div>
            )}
            {billingMsg === "cancel" && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-400">
                Proceso de pago cancelado.
              </div>
            )}

            {/* Current plan badge */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/40">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  subscription.plan === "pro" ? "bg-violet-500/20" : "bg-muted"
                }`}>
                  <Zap className={`w-4 h-4 ${subscription.plan === "pro" ? "text-violet-400" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-semibold capitalize">{subscription.plan === "pro" ? "Pro" : "Gratis"}</p>
                  {subscription.status && (
                    <p className="text-xs text-muted-foreground capitalize">{subscription.status}</p>
                  )}
                  {subscription.currentPeriodEnd && (
                    <p className="text-xs text-muted-foreground">
                      Renueva {new Date(subscription.currentPeriodEnd).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
              {subLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>

            {subscription.plan === "free" ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Actualizar a Pro</p>
                  <p className="text-xs text-muted-foreground">Acceso completo a todas las funcionalidades: agente IA ilimitado, knowledge graph ampliado, análisis avanzados.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleCheckout(PRICE_PRO_MONTHLY, "monthly")}
                    disabled={checkoutLoading !== null || !PRICE_PRO_MONTHLY}
                    className="gap-2"
                  >
                    {checkoutLoading === "monthly" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Pro Mensual
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCheckout(PRICE_PRO_YEARLY, "yearly")}
                    disabled={checkoutLoading !== null || !PRICE_PRO_YEARLY}
                    className="gap-2"
                  >
                    {checkoutLoading === "yearly" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Pro Anual
                    <Badge variant="secondary" className="text-[10px]">Ahorra 20%</Badge>
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={handlePortal}
                disabled={portalLoading}
                className="w-full gap-2"
              >
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Gestionar suscripción
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Privacy Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Privacidad y Seguridad</CardTitle>
            </div>
            <CardDescription>Gestiona tu privacidad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Descargar mis datos
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
              Eliminar cuenta
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}



