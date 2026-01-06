import { useStore } from "@nanostores/react";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { $isSecurityModalOpen, closeSecurityModal } from "../../stores/uiStore";
import { cn } from "../../lib/utils";
import { Modal } from "../ui/Modal";

// ============================================
// SecurityModal Component
// Bill verification guide for USD and CUP
// ============================================

interface SecurityFeature {
  name: string;
  description: string;
  location: string;
}

const USD_FEATURES: SecurityFeature[] = [
  {
    name: "Marca de Agua",
    description: "Retrato visible al trasluz",
    location: "Lado derecho",
  },
  {
    name: "Hilo de Seguridad",
    description: 'Texto "USA 100" visible con luz UV',
    location: "Lado izquierdo",
  },
  {
    name: "Tinta que Cambia de Color",
    description: 'El "100" cambia de cobre a verde',
    location: "Esquina inferior derecha",
  },
  {
    name: "Campana en el Tintero",
    description: "Cambia de cobre a verde al inclinar",
    location: "Centro frontal",
  },
  {
    name: "Microimpresión",
    description: '"THE UNITED STATES OF AMERICA"',
    location: "Cuello de Franklin",
  },
];

const CUP_FEATURES: SecurityFeature[] = [
  {
    name: "Marca de Agua",
    description: "Imagen de José Martí visible al trasluz",
    location: "Lado izquierdo",
  },
  {
    name: "Hilo de Seguridad",
    description: "Hilo metálico integrado",
    location: "Vertical, centro",
  },
  {
    name: "Elementos en Relieve",
    description: "Textura táctil en denominación",
    location: "Número principal",
  },
  {
    name: "Tintas Especiales",
    description: "Brillan bajo luz ultravioleta",
    location: "Varios puntos",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: SecurityFeature;
  index: number;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3",
        "bg-neutral-950/50 rounded-xl"
      )}
    >
      <div
        className={cn(
          "shrink-0 w-6 h-6 rounded-full",
          "bg-emerald-500/20 text-emerald-400",
          "flex items-center justify-center",
          "text-xs font-bold"
        )}
      >
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm">{feature.name}</div>
        <div className="text-xs text-neutral-500 mt-0.5">
          {feature.description}
        </div>
        <div className="text-xs text-emerald-400 mt-1">
          📍 {feature.location}
        </div>
      </div>
    </div>
  );
}

export function SecurityModal() {
  const isOpen = useStore($isSecurityModalOpen) ?? false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeSecurityModal}
      title="Guía de Seguridad"
      size="md"
    >
      <div className="p-5 space-y-6">
        {/* Introduction */}
        <div
          className={cn(
            "flex items-start gap-3 p-4",
            "bg-emerald-500/10 border border-emerald-500/30",
            "rounded-xl"
          )}
        >
          <Shield className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white font-medium">
              Verifica la autenticidad
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Revisa estos elementos de seguridad antes de aceptar billetes de
              alta denominación.
            </p>
          </div>
        </div>

        {/* USD $100 Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🇺🇸</span>
            <h3 className="text-lg font-semibold text-white">USD $100</h3>
          </div>

          {/* Bill Visual */}
          <div
            className={cn(
              "relative rounded-xl p-4 mb-3 overflow-hidden",
              "bg-gradient-to-br from-green-900/40 to-green-800/20",
              "border border-green-700/30"
            )}
          >
            <div className="flex items-center justify-center h-14">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  Benjamin Franklin
                </div>
                <div className="text-xs text-green-500/70">Serie 2009-2017</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {USD_FEATURES.map((feature, i) => (
              <FeatureCard key={feature.name} feature={feature} index={i} />
            ))}
          </div>
        </div>

        {/* CUP 1000 Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🇨🇺</span>
            <h3 className="text-lg font-semibold text-white">CUP 1000</h3>
          </div>

          {/* Bill Visual */}
          <div
            className={cn(
              "relative rounded-xl p-4 mb-3 overflow-hidden",
              "bg-gradient-to-br from-blue-900/40 to-blue-800/20",
              "border border-blue-700/30"
            )}
          >
            <div className="flex items-center justify-center h-14">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  José Martí
                </div>
                <div className="text-xs text-blue-500/70">
                  Banco Central de Cuba
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {CUP_FEATURES.map((feature, i) => (
              <FeatureCard key={feature.name} feature={feature} index={i} />
            ))}
          </div>
        </div>

        {/* Warning */}
        <div
          className={cn(
            "flex items-start gap-3 p-4",
            "bg-amber-500/10 border border-amber-500/30",
            "rounded-xl"
          )}
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white font-medium">Importante</p>
            <p className="text-xs text-neutral-400 mt-1">
              Esta guía es de referencia. En caso de duda, consulta con un
              profesional o utiliza una lámpara UV para verificación adicional.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
