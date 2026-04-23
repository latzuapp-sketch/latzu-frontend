"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, CheckCircle, AlertCircle, Mail, ShieldCheck } from "lucide-react";

// Note: metadata export doesn't work in "use client" components.
// Move to a parent server component if SSR metadata is needed.

export default function EliminarDatosPage() {
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [deleteWhatsapp, setDeleteWhatsapp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !email.includes("@")) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // Send deletion request email via mailto (client-side)
      // In production, this should call an API endpoint
      const subject = encodeURIComponent("Solicitud de eliminación de datos — Latzu");
      const body = encodeURIComponent(
        `Email de la cuenta: ${email}\n\n` +
        `Tipo de solicitud: ${deleteWhatsapp ? "Cuenta completa + datos de WhatsApp" : "Cuenta completa"}\n\n` +
        `Motivo (opcional): ${reason || "No especificado"}\n\n` +
        `Fecha de solicitud: ${new Date().toLocaleDateString("es-CO", { dateStyle: "long" })}`
      );
      window.open(`mailto:latzuapp@gmail.com?subject=${subject}&body=${body}`, "_blank");
      setStep("done");
    } catch {
      setError("Ocurrió un error. Por favor escríbenos directamente a latzuapp@gmail.com");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <h1 className="text-2xl font-heading font-bold">Solicitud de Eliminación de Datos</h1>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Tienes derecho a solicitar la eliminación de todos tus datos personales de la plataforma Latzu, de conformidad con la Ley 1581 de 2012 de Colombia y el GDPR.
        </p>
      </div>

      {/* Info boxes */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-border/50 bg-card/50">
          <ShieldCheck className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm font-medium mb-1">¿Qué se elimina?</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Tu cuenta y perfil</li>
            <li>• Historial de chat completo</li>
            <li>• Notas, planes y biblioteca</li>
            <li>• Datos de aprendizaje y memoria IA</li>
            <li>• Número de WhatsApp (si aplica)</li>
          </ul>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-card/50">
          <AlertCircle className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-sm font-medium mb-1">Importante</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Esta acción es <strong className="text-foreground">irreversible</strong></li>
            <li>• Procesamos en máximo 30 días</li>
            <li>• Copias de seguridad: hasta 90 días adicionales</li>
            <li>• Recibirás confirmación por email</li>
          </ul>
        </div>
      </div>

      {/* Step: Form */}
      {step === "form" && (
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 space-y-5">
          <h2 className="font-semibold">Datos de la solicitud</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico de tu cuenta <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <textarea
                id="reason"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
                placeholder="Puedes dejarlo en blanco. Tu opinión nos ayuda a mejorar."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* WhatsApp specific option */}
            <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border/50 bg-muted/30">
              <input
                id="whatsapp"
                type="checkbox"
                className="mt-0.5 accent-primary"
                checked={deleteWhatsapp}
                onChange={(e) => setDeleteWhatsapp(e.target.checked)}
              />
              <div>
                <Label htmlFor="whatsapp" className="text-sm font-medium cursor-pointer">
                  Eliminar también datos de WhatsApp
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Incluye el número de teléfono y el historial de conversaciones via WhatsApp Business.
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" variant="destructive" className="w-full gap-2">
              <Trash2 className="w-4 h-4" />
              Solicitar eliminación de mis datos
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            También puedes escribirnos directamente a{" "}
            <a href="mailto:latzuapp@gmail.com" className="text-primary hover:underline">
              latzuapp@gmail.com
            </a>
            {" "}con el asunto «Eliminar datos».
          </p>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
            <h2 className="font-semibold text-destructive">Confirma tu solicitud</h2>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Vas a solicitar la eliminación permanente de todos los datos asociados a:</p>
            <p className="font-semibold text-foreground">{email}</p>
            {deleteWhatsapp && (
              <p className="text-xs">Incluye datos de WhatsApp Business.</p>
            )}
            <p className="mt-2">
              <strong className="text-foreground">Esta acción es irreversible.</strong> Una vez eliminados, no podremos recuperar tu contenido, historial de chat, notas ni progreso de aprendizaje.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep("form")}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Confirmar eliminación
            </Button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-heading font-semibold text-xl">Solicitud enviada</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Hemos recibido tu solicitud de eliminación para <strong className="text-foreground">{email}</strong>.
            Procesaremos tu solicitud dentro de los próximos <strong className="text-foreground">30 días</strong> y te
            enviaremos una confirmación cuando hayamos eliminado tus datos.
          </p>
          <p className="text-xs text-muted-foreground">
            Si no recibes confirmación en 30 días, escríbenos a{" "}
            <a href="mailto:latzuapp@gmail.com" className="text-primary hover:underline">
              latzuapp@gmail.com
            </a>
          </p>
          <Link href="/" className="text-sm text-primary hover:underline">
            Volver al inicio →
          </Link>
        </div>
      )}

      {/* Legal note */}
      <div className="mt-8 p-4 rounded-xl bg-muted/40 text-xs text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground/70">Base legal</p>
        <p>
          Esta solicitud se procesa de conformidad con el <strong>Artículo 8 de la Ley 1581 de 2012</strong> (Habeas Data, Colombia) y con el <strong>Artículo 17 del GDPR</strong> (derecho de supresión, para usuarios en el EEE).
        </p>
        <p>
          Para más información sobre cómo tratamos tus datos, consulta nuestra{" "}
          <Link href="/privacidad" className="text-primary hover:underline">
            Política de Privacidad
          </Link>.
        </p>
      </div>
    </div>
  );
}
