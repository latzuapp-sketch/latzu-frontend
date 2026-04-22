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
} from "lucide-react";
import { useTheme } from "next-themes";

const profileIcons: Record<ProfileType, typeof GraduationCap> = {
  estudiante: GraduationCap,
  aprendiz: Lightbulb,
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { profileType, preferences, updatePreferences, updateProfileType, isUpdatingProfileType } =
    useUserProfile();

  const [localPrefs, setLocalPrefs] = useState(preferences);

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



