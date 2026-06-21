import { Orbit, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";

interface EmptyStateProps {
  onCreate: () => void;
}

export default function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-orbi-primary/10 border border-orbi-accent/20 flex items-center justify-center">
          <Orbit className="w-10 h-10 text-orbi-accent" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-yellow-500" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        Crea tu primer proyecto
      </h3>
      <p className="text-orbi-muted text-sm max-w-sm mb-8 leading-relaxed">
        Cada proyecto en Orbi genera una estrategia de marketing completa para
        tu producto — desde audiencias hasta contenido listo para publicar.
      </p>
      <Button onClick={onCreate} size="lg">
        <Sparkles className="w-4 h-4 mr-2" />
        Nuevo proyecto
      </Button>
    </div>
  );
}
