import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Building2, Zap, MessageSquare, BarChart3, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import heroBg from "@/assets/hero-bg.jpg";
import logoIso from "@/assets/logo-isotipo.png";
import sponsorDiscover from "@/assets/preview-sponsor-discover.png";
import sponsorConnect from "@/assets/preview-sponsor-connect.png";
import sponsorManage from "@/assets/preview-sponsor-manage.png";
import organizerPublish from "@/assets/preview-organizer-publish.png";
import organizerProposals from "@/assets/preview-organizer-proposals.png";
import organizerVisibility from "@/assets/preview-organizer-visibility.png";
import matchScorePreview from "@/assets/preview-match-score.png";

const sponsorPreview = [
  { img: sponsorDiscover, title: "Descubre eventos", desc: "Explora eventos relevantes para tu marca y filtra por categoría o audiencia." },
  { img: sponsorConnect, title: "Explora eventos en el mapa", desc: "Visualiza eventos por ubicación y descubre oportunidades cerca de ti." },
  { img: sponsorManage, title: "Gestiona tus acuerdos", desc: "Haz seguimiento de tus patrocinios activos y métricas clave." },
];

const organizerPreview = [
  { img: organizerPublish, title: "Busca sponsors para tu evento", desc: "Explora marcas compatibles y descubre sponsors ideales según el match score con tu evento." },
  { img: organizerProposals, title: "Recibe propuestas", desc: "Revisa y responde a solicitudes de patrocinio en un solo lugar." },
  { img: organizerVisibility, title: "Controla tu visibilidad", desc: "Ve cómo aparece tu evento ante los sponsors potenciales." },
];

function PreviewCards({ items }: { items: typeof sponsorPreview }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {items.map((it, i) => (
        <div
          key={it.title}
          className="bg-card rounded-2xl overflow-hidden shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 animate-slide-up flex flex-col"
          style={{ animationDelay: `${0.08 * i}s`, animationFillMode: "both" }}
        >
          <div className="aspect-[16/10] bg-muted/40 overflow-hidden border-b border-border">
            <img
              src={it.img}
              alt={it.title}
              loading="lazy"
              width={1280}
              height={800}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="p-6">
            <h3 className="font-semibold text-base mb-1">{it.title}</h3>
            <p className="text-sm text-muted-foreground">{it.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center overflow-hidden">
              <img src={logoIso} alt="Sponsorly" className="h-5 w-5 object-contain brightness-0 invert" />
            </div>
            Sponsorly
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="rounded-pill">
                Iniciar sesión
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm" className="gradient-primary text-white border-0 rounded-pill">
                Registrarse <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-14 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="container relative z-10 py-24 md:py-32">
          <div className="max-w-2xl animate-slide-up">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Conectar marcas, crear momentos.</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight">
              El punto de encuentro entre eventos y marcas
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg">
              ¿Organizas eventos? Encuentra sponsors ideales. ¿Eres una marca? Descubre eventos donde brillar.
              Match inteligente, comunicación directa, resultados reales.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gradient-primary text-white border-0 rounded-pill h-12 px-8 font-semibold">
                  Empezar gratis <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 container">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl font-bold">Todo lo que necesitas</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Herramientas diseñadas para simplificar la conexión entre eventos y marcas
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: "Perfiles verificados",
              desc: "Organizadores y sponsors con perfiles completos para generar confianza desde el primer contacto.",
            },
            {
              icon: Building2,
              title: "Explora oportunidades",
              desc: "Sponsors descubren eventos y organizadores encuentran marcas — todo en un solo lugar.",
            },
            {
              icon: Zap,
              title: "Match inteligente",
              desc: "Algoritmo que calcula compatibilidad entre evento y sponsor automáticamente.",
            },
            {
              icon: MessageSquare,
              title: "Chat directo",
              desc: "Conversaciones en tiempo real ligadas a eventos específicos.",
            },
            {
              icon: BarChart3,
              title: "Métricas claras",
              desc: "Presupuestos, capacidad, audiencia — toda la data en un vistazo.",
            },
            {
              icon: Shield,
              title: "Seguro y real",
              desc: "Datos reales, perfiles verificables, sin información ficticia.",
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 animate-slide-up"
              style={{ animationDelay: `${0.08 * i}s`, animationFillMode: "both" }}
            >
              <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-base mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preview by role */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-10 animate-fade-in">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Vista previa</p>
            <h2 className="text-3xl md:text-4xl font-bold">Esto es lo que encontrarás dentro</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Una experiencia diseñada para cada rol. Elige el tuyo y descubre cómo funciona.
            </p>
          </div>

          <Tabs defaultValue="sponsor" className="w-full">
            <TabsList className="mx-auto flex w-full max-w-md rounded-full bg-card p-1 h-12">
              <TabsTrigger value="sponsor" className="flex-1 rounded-full h-10 data-[state=active]:gradient-primary data-[state=active]:text-white">
                Soy Sponsor
              </TabsTrigger>
              <TabsTrigger value="organizer" className="flex-1 rounded-full h-10 data-[state=active]:gradient-primary data-[state=active]:text-white">
                Soy Organizador
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sponsor"><PreviewCards items={sponsorPreview} /></TabsContent>
            <TabsContent value="organizer"><PreviewCards items={organizerPreview} /></TabsContent>
          </Tabs>

          <div className="mt-12 text-center">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="gradient-primary text-white border-0 rounded-full h-12 px-8 font-semibold">
                Crear cuenta gratis <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Match Score spotlight */}
      <section className="py-20 container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="animate-slide-up">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Match Score</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Sabe al instante si una marca y un evento encajan
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Nuestro algoritmo analiza sector, tipo de evento, audiencia y presupuesto para darte
              un porcentaje de compatibilidad claro — con el desglose detrás de cada número.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Compatibilidad por sector y tipo de evento</li>
              <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Encaje de audiencia y presupuesto</li>
              <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Decisiones más rápidas, contactos más relevantes</li>
            </ul>
          </div>
          <div className="flex justify-center animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
            <div className="bg-card rounded-2xl shadow-card p-4 md:p-6 max-w-md w-full">
              <img
                src={matchScorePreview}
                alt="Desglose del Match Score con compatibilidad por sector, tipo de evento, audiencia y presupuesto"
                loading="lazy"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="gradient-primary rounded-2xl p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ lineHeight: '1.1' }}>
              Empieza a conectar hoy
            </h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              Crea tu cuenta gratuita y descubre oportunidades de patrocinio en minutos.
            </p>
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-white text-foreground hover:bg-white/90 rounded-pill h-12 px-8 font-semibold">
                Crear cuenta gratis <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
          <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md gradient-primary flex items-center justify-center overflow-hidden">
              <img src={logoIso} alt="Sponsorly" className="h-4 w-4 object-contain brightness-0 invert" />
            </div>
            Sponsorly
          </div>
          <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
